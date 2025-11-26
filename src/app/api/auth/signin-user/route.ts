import dbConnect from "@/configs/db";
import { STATUS_CODES } from "@/constants/status-codes";
import User from "@/models/user.model";
import { ApiResponse } from "@/utils/api-response";
import { SigninSchema } from "@/validators/auth";
import { NextRequest } from "next/server";
import z from "zod";
import {
  checkRateLimit,
  getClientIP,
  hashPassword,
  sendAndSaveOtp,
  verifyPassword,
} from "@/helpers/auth-helpers";
import {
  LOCK_TIME_MS,
  LOGIN_MAX_ATTEMPTS,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW,
} from "@/constants/auth-constants";

export async function POST(req: NextRequest) {
  try {
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(clientIP);

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
            "X-RateLimit-Reset": (Date.now() + RATE_LIMIT_WINDOW).toString(),
          },
        }
      );
    }

    const formData = await req.json();
    const { success, data, error } = SigninSchema.safeParse(formData);
    await dbConnect();
    if (!success) {
      return ApiResponse(
        false,
        STATUS_CODES.UNPROCESSABLE_ENTITY,
        "Invalid data received!",
        z.flattenError(error).fieldErrors
      );
    }

    const { email, password } = data;
    if (!email || !password) {
      return ApiResponse(
        false,
        STATUS_CODES.BAD_REQUEST,
        "Email and password are required"
      );
    }

    const existingUser = await User.findOne({ email }).select("+password");

    if (!existingUser) {
      return ApiResponse(
        false,
        STATUS_CODES.UNAUTHORIZED,
        "Invalid email or password"
      );
    }

    const ispasswordMatched = await verifyPassword(
      password,
      existingUser.password
    );

    if (!ispasswordMatched) {
      let lockUntil = null;

      const newAttempts = existingUser.failedLoginAttempts + 1;

      if (newAttempts >= LOGIN_MAX_ATTEMPTS) {
        lockUntil = new Date(Date.now() + LOCK_TIME_MS);
      }

      await User.updateOne(
        { _id: existingUser._id },
        { $set: { failedLoginAttempts: newAttempts, lockUntil } }
      );
      return ApiResponse(
        false,
        STATUS_CODES.UNAUTHORIZED,
        "Invalid email or password"
      );
    }

    await User.updateOne(
      { _id: existingUser._id },
      { $set: { failedLoginAttempts: 0, lockUntil: null } }
    );

    const result = await sendAndSaveOtp("email-verification", email);

    return ApiResponse(result.success, result.statusCode, result.message, {
      _id: existingUser._id,
      name: existingUser.name,
      email: existingUser.email,
    });
  } catch (error) {
    console.error(error);
    return ApiResponse(
      false,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again."
    );
  }
}
