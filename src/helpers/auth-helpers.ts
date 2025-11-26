import { NEXT_OTP_DELAY, OTP_TYPES } from "./../constants/auth-constants";
import { cookies } from "next/headers";
import crypto from "crypto";
import {
  ACCESS_TOKEN_EXPIRY,
  OTP_CODE_EXPIRY,
  OTP_CODE_LENGTH,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW,
  REFRESH_TOKEN_EXPIRY,
} from "@/constants/auth-constants";
import { NextRequest } from "next/server";
import argon2 from "argon2";
import Otp from "@/models/otp.model";
import { STATUS_CODES } from "@/constants/status-codes";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "./jwt-helpers";
import User from "@/models/user.model";
import dbConnect from "@/configs/db";

export const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
} as const;

export const hashPassword = async (password: string) => argon2.hash(password);

export const verifyPassword = async (
  password: string,
  hashedPassword: string
) => argon2.verify(hashedPassword, password);

export const generateOtp = (length: number, ttlMinutes: number) => {
  const code = String(
    Math.floor(Math.random() * Math.pow(10, length))
  ).padStart(length, "0");
  const hashCode = crypto
    .createHash("sha256")
    .update(String(code))
    .digest("hex");
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  return { code, hashCode, expiresAt };
};

export const verifyOtp = ({
  code,
  hashCode,
}: {
  code: string;
  hashCode: string;
}) => {
  const hashedCode = crypto
    .createHash("sha256")
    .update(String(code))
    .digest("hex");
  return hashedCode === hashCode;
};

export const setAuthCookies = async (
  accessToken: string,
  refreshToken: string
) => {
  const cookieStore = await cookies();
  cookieStore.set("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: ACCESS_TOKEN_EXPIRY,
  });
  cookieStore.set("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: REFRESH_TOKEN_EXPIRY,
  });
};

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

export function checkRateLimit(clientIP: string) {
  const now = Date.now();
  const data = rateLimitStore.get(clientIP);

  if (!data || now > data.resetTime) {
    rateLimitStore.set(clientIP, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (data.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  data.count++;
  rateLimitStore.set(clientIP, data);

  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - data.count };
}

export function resetRateLimit(clientIP: string) {
  rateLimitStore.delete(clientIP);
}

export async function sendAndSaveOtp(
  otpType: (typeof OTP_TYPES)[number],
  email: string
) {
  try {
    const otp = generateOtp(OTP_CODE_LENGTH || 6, OTP_CODE_EXPIRY || 5);
    console.log(otp);

    const existingOtp = await Otp.findOne({ email, otpType });
    if (existingOtp && new Date(existingOtp.nextResendAllowedAt) > new Date()) {
      const remainingSec = Math.ceil(
        (existingOtp.nextResendAllowedAt.getTime() - Date.now()) / 1000
      );
      return {
        success: false,
        statusCode: STATUS_CODES.TOO_MANY_REQUESTS,
        message: `Please wait ${remainingSec} seconds before sending another OTP`,
      };
    }

    if (otpType === "email-verification") {
      const html = `<p>OTP: ${otp.code}</p>`;
      // await sendEmail(email, `OTP for email verification`, html);
    }
    if (otpType === "password-reset") {
      const html = `<p>OTP: ${otp.code}</p>`;
      // await sendEmail(email, `OTP for password reset`, html);
    }

    const nextResendAllowedAt = new Date(Date.now() + NEXT_OTP_DELAY);

    const newOtp = new Otp({
      email,
      otpType,
      otpHashCode: otp.hashCode,
      attempts: 0,
      isVerified: false,
      expiresAt: otp.expiresAt,
      nextResendAllowedAt,
    });

    await newOtp.save();

    return {
      success: true,
      statusCode: STATUS_CODES.OK,
      message: "OTP sent successfully",
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "Failed to send OTP",
    };
  }
}

export const getCurrentAuthUser = async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;
  if (!accessToken || !refreshToken) return null;

  try {
    const dd = verifyAccessToken(accessToken);
    if (!dd) return null;
    const { _id: userId } = dd;

    await dbConnect();

    const user = await User.findOne({ _id: userId });

    if (!user) return null;
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      avatar: user.avatar,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isDeleted: user.isDeleted,
      lockUntil: user.lockUntil,
    };

    return userData;
  } catch (error: any) {
    if (error.message === "jwt expired") {
      const decoded = verifyRefreshToken(refreshToken);
      console.log({ refreshToken, decoded });
      if (!decoded) return null;
      const user = await User.findOne({ _id: decoded._id });
      if (!user) return null;

      const newAccessToken = generateAccessToken(decoded._id);

      const newRefreshToken = generateRefreshToken(decoded._id);

      await setAuthCookies(newAccessToken, newRefreshToken);
    }
  }
};

export const generateRandomToken = (id: string) => {
  const token = crypto.createHash("sha256").update(String(id)).digest("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(String(token))
    .digest("hex");

  return { token, hashedToken };
};
