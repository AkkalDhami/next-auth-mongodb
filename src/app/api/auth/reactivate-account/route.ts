import dbConnect from "@/configs/db";
import {
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW,
} from "@/constants/auth-constants";
import { STATUS_CODES } from "@/constants/status-codes";
import {
  checkRateLimit,
  getClientIP,
  getCurrentAuthUser,
} from "@/helpers/auth-helpers";
import User from "@/models/user.model";
import { ApiResponse } from "@/utils/api-response";
import { NextRequest } from "next/server";

export async function PUT(req: NextRequest) {
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

    await dbConnect();
    const currentUser = await getCurrentAuthUser();

    if (!currentUser) {
      return ApiResponse(
        false,
        STATUS_CODES.UNAUTHORIZED,
        "Unauthorized, please login first"
      );
    }

    const user = await User.findOne({ _id: currentUser.id });

    if (!user) {
      return ApiResponse(
        false,
        STATUS_CODES.UNAUTHORIZED,
        "Unauthorized, please login first"
      );
    }

    if (!user.isEmailVerified) {
      return ApiResponse(
        false,
        STATUS_CODES.FORBIDDEN,
        "Please verify your email"
      );
    }

    if (!user.isDeleted || !user.deletedAt) {
      return ApiResponse(
        false,
        STATUS_CODES.BAD_REQUEST,
        "Your account is already active"
      );
    }

    if (
      user?.reActivateAvailableAt &&
      new Date(user?.reActivateAvailableAt) > new Date()
    ) {
      return ApiResponse(
        false,
        STATUS_CODES.BAD_REQUEST,
        `Your account has been locked. Please try again after ${Math.ceil(
          (user.reActivateAvailableAt.getTime() - Date.now()) / (1000 * 60)
        )} minutes.`
      );
    }

    await User.updateOne(
      { _id: currentUser.id },
      {
        isDeleted: false,
      }
    );
    await User.findOneAndUpdate(
      { _id: currentUser.id },
      {
        $unset: {
          reActivateAvailableAt: 1,
          deletedAt: 1,
        },
      }
    );
    return ApiResponse(true, STATUS_CODES.OK, "Account has been reactivated", {
      headers: {
        "X-RateLimit-Limit": RATE_LIMIT_MAX_REQUESTS.toString(),
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
      },
    });
  } catch (error) {
    console.error("error:", error);
    return ApiResponse(
      false,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again."
    );
  }
}
