import { NextRequest } from "next/server";
import z from "zod";
import crypto from "crypto";
import Otp from "@/models/otp.model";
import {
  OTP_MAX_ATTEMPTS,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW,
  RESET_PASSWORD_TOKEN_EXPIRY,
} from "@/constants/auth-constants";
import {
  checkRateLimit,
  cookieOptions,
  generateRandomToken,
  getClientIP,
  setAuthCookies,
  verifyOtp,
} from "@/helpers/auth-helpers";
import User from "@/models/user.model";
import {
  generateAccessToken,
  generateRefreshToken,
} from "@/helpers/jwt-helpers";
import { STATUS_CODES } from "@/constants/status-codes";
import { ApiResponse } from "@/utils/api-response";
import dbConnect from "@/configs/db";
import { OtpVerifySchema } from "@/validators/auth";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(clientIP);
    const formData = await req.json();
    const cookieStore = await cookies();
    const { data, success, error } = OtpVerifySchema.safeParse(formData);

    await dbConnect();

    if (!success) {
      return ApiResponse(
        false,
        STATUS_CODES.UNPROCESSABLE_ENTITY,
        "Invalid data received",
        z.flattenError(error).fieldErrors
      );
    }

    if (!rateLimit.allowed) {
      return ApiResponse(
        false,
        STATUS_CODES.TOO_MANY_REQUESTS,
        "Too many requests. Please try again later.",
        {
          retryAfter: RATE_LIMIT_WINDOW / 1000,
          status: STATUS_CODES.TOO_MANY_REQUESTS,
          headers: {
            "X-RateLimit-Limit": RATE_LIMIT_MAX_REQUESTS.toString(),
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          },
        }
      );
    }

    const { email, otpCode, otpType } = data;

    if (!email || !otpCode) {
      return ApiResponse(
        false,
        STATUS_CODES.BAD_REQUEST,
        "Email and OTP code are required"
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return ApiResponse(
        false,
        STATUS_CODES.BAD_REQUEST,
        "User with this email does not exist"
      );
    }

    if (user?.isDeleted || user?.deletedAt) {
      return ApiResponse(
        false,
        STATUS_CODES.BAD_REQUEST,
        "Your account has been deactivated."
      );
    }

    if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
      const remainingSec = Math.ceil(
        (user.lockUntil.getTime() - Date.now()) / 1000
      );
      return ApiResponse(
        false,
        STATUS_CODES.BAD_REQUEST,
        `Please wait ${remainingSec} seconds before sending another OTP`
      );
    }

    const otpHashCode = crypto
      .createHash("sha256")
      .update(String(otpCode))
      .digest("hex");

    const otpInDb = await Otp.findOne({
      email,
      otpType,
    });

    if (!otpInDb) {
      return ApiResponse(
        false,
        STATUS_CODES.BAD_REQUEST,
        "Invalid or expired OTP code."
      );
    }

    if (otpInDb.attempts >= OTP_MAX_ATTEMPTS) {
      await Otp.deleteMany({ email, attempts: { $gte: OTP_MAX_ATTEMPTS } });
      return ApiResponse(
        false,
        STATUS_CODES.BAD_REQUEST,
        "Maximum number of attempts reached. Please try again later."
      );
    }

    if (otpInDb.isVerified) {
      return ApiResponse(
        false,
        STATUS_CODES.BAD_REQUEST,
        "OTP code has already been verified."
      );
    }

    if (new Date(otpInDb.expiresAt) < new Date()) {
      return ApiResponse(
        false,
        STATUS_CODES.BAD_REQUEST,
        "OTP code has expired."
      );
    }

    if (
      !verifyOtp({ code: otpCode, hashCode: otpHashCode }) ||
      otpInDb.otpHashCode !== otpHashCode
    ) {
      await Otp.findOneAndUpdate(
        { _id: otpInDb._id },
        { $inc: { attempts: 1 } },
        { new: true }
      );
      return ApiResponse(
        false,
        STATUS_CODES.BAD_REQUEST,
        "Invalid or expired OTP code."
      );
    }

    await Otp.findOneAndUpdate(
      { _id: otpInDb._id },
      { $set: { isVerified: true } },
      { new: true }
    );

    await Otp.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { attempts: { $gte: OTP_MAX_ATTEMPTS } },
        { isVerified: true },
      ],
    });

    if (otpInDb.otpType === "email-verification") {
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        await user.save();
      }

      const payload = {
        _id: user._id.toString(),
      };
      const accessToken = generateAccessToken(payload._id);
      const refreshToken = generateRefreshToken(user._id.toString());
      setAuthCookies(accessToken, refreshToken);

      await User.updateOne(
        { _id: user._id },
        { $set: { lastLogin: new Date(), failedLoginAttempts: 0 } }
      );

      await User.updateOne({ _id: user._id }, { $unset: { lockUntil: 1 } });

      return ApiResponse(
        true,
        STATUS_CODES.OK,
        "OTP code verified successfully.",
        {
          accessToken,
          refreshToken,
        }
      );
    }

    if (otpInDb.otpType === "password-reset") {
      if (!user.isEmailVerified) {
        return ApiResponse(false, 400, "Email is not verified yet.");
      }

      const { hashedToken: hashedResetPasswordToken } = generateRandomToken(
        user._id.toString()
      );
      const resetPasswordExpiry = new Date(
        Date.now() + RESET_PASSWORD_TOKEN_EXPIRY
      );

      if (
        cookieStore.has("hashedResetPasswordToken") ||
        cookieStore.has("resetPasswordExpiry")
      ) {
        cookieStore.delete("hashedResetPasswordToken");
        cookieStore.delete("resetPasswordExpiry");
      }

      cookieStore.set("hashedResetPasswordToken", hashedResetPasswordToken, {
        ...cookieOptions,
        maxAge: RESET_PASSWORD_TOKEN_EXPIRY,
      });

      cookieStore.set(
        "resetPasswordExpiry",
        resetPasswordExpiry.toISOString(),
        {
          ...cookieOptions,
          maxAge: RESET_PASSWORD_TOKEN_EXPIRY,
        }
      );

      return ApiResponse(
        true,
        200,
        "OTP verified successfully. Reset your password"
      );
    }

    return ApiResponse(
      true,
      STATUS_CODES.OK,
      "OTP code verified successfully."
    );
  } catch (error) {
    console.error(error);
    return ApiResponse(
      false,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again."
    );
  }
}
