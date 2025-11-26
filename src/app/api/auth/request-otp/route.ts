import dbConnect from "@/configs/db";
import {
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW,
} from "@/constants/auth-constants";
import { STATUS_CODES } from "@/constants/status-codes";
import {
  checkRateLimit,
  getClientIP,
  sendAndSaveOtp,
} from "@/helpers/auth-helpers";
import User from "@/models/user.model";
import { ApiResponse } from "@/utils/api-response";
import { OtpRequestSchema } from "@/validators/auth";
import { NextRequest } from "next/server";
import z from "zod";

export async function POST(req: NextRequest) {
  try {
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(clientIP);
    const formData = await req.json();

    const { data, success, error } = OtpRequestSchema.safeParse(formData);

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
            "X-RateLimit-Reset": (Date.now() + RATE_LIMIT_WINDOW).toString(),
          },
        }
      );
    }

    const { email, type } = data;

    if (!email || !type) {
      return ApiResponse(false, 400, "Email and OTP type are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
      return ApiResponse(false, 400, "User with this email does not exist");
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

    const result = await sendAndSaveOtp(type, email);

    return ApiResponse(result.success, result.statusCode, result.message, {
      headers: {
        "X-RateLimit-Limit": RATE_LIMIT_MAX_REQUESTS.toString(),
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
      },
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
