import { deleteCloudinaryFile } from "@/configs/cloudinary";
import dbConnect from "@/configs/db";
import {
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW,
  REACTIVATION_AVAILABLE_AT,
} from "@/constants/auth-constants";
import { STATUS_CODES } from "@/constants/status-codes";
import {
  checkRateLimit,
  getClientIP,
  getCurrentAuthUser,
} from "@/helpers/auth-helpers";
import User from "@/models/user.model";
import { ApiResponse } from "@/utils/api-response";
import { DeleteAccountSchema } from "@/validators/auth";
import { NextRequest } from "next/server";
import z from "zod";

export async function DELETE(req: NextRequest) {
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

    const { success, data, error } = DeleteAccountSchema.safeParse(req.body);

    if (!success) {
      return ApiResponse(
        false,
        STATUS_CODES.UNPROCESSABLE_ENTITY,
        "Invalid data received!",
        z.flattenError(error).fieldErrors
      );
    }

    const { type } = data;

    await dbConnect();
    const user = await getCurrentAuthUser();
    if (!user) {
      return ApiResponse(
        false,
        STATUS_CODES.UNAUTHORIZED,
        "Unauthorized, please login first"
      );
    }

    const userInfo = await User.findOne({ _id: user.id });
    if (!userInfo) {
      return ApiResponse(
        false,
        STATUS_CODES.UNAUTHORIZED,
        "Unauthorized, please login first"
      );
    }

    if (user.id !== userInfo._id.toString()) {
      return ApiResponse(
        false,
        STATUS_CODES.UNAUTHORIZED,
        "Unauthorized, please login first"
      );
    }

    if (user?.isDeleted) {
      return ApiResponse(
        false,
        STATUS_CODES.BAD_REQUEST,
        "Your account has already been deactivated!"
      );
    }

    if (user?.lockUntil && new Date(user.lockUntil) > new Date()) {
      return ApiResponse(
        false,
        STATUS_CODES.BAD_REQUEST,
        `Your account has been locked. Please try again after ${Math.ceil(
          (user.lockUntil.getTime() - Date.now()) / (1000 * 60)
        )} minutes.`
      );
    }

    if (type === "soft") {
      await User.findByIdAndUpdate(userInfo._id, {
        isDeleted: true,
        deletedAt: Date.now(),
        reactivationAvailableAt: Date.now() + REACTIVATION_AVAILABLE_AT,
      });
    } else if (type === "hard") {
      if (user?.avatar?.public_id) {
        await deleteCloudinaryFile(user.avatar.public_id);
      }
      await User.findByIdAndDelete(userInfo._id);
    }

    return ApiResponse(
      true,
      STATUS_CODES.OK,
      `Account ${type === "soft" ? "deactivated" : "deleted"} successfully!`,
      {
        headers: {
          "X-RateLimit-Limit": RATE_LIMIT_MAX_REQUESTS.toString(),
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        },
      }
    );
  } catch (err) {
    console.error("error:", err);
    return ApiResponse(
      false,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again."
    );
  }
}
