import { uploadToCloudinary } from "@/configs/cloudinary";
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
import { logger } from "@/utils/logger";
import { NextRequest } from "next/server";

export async function PATCH(req: NextRequest) {
  try {
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(clientIP);
    logger.info("Rate limit info: ", rateLimit);
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

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const bio = formData.get("bio") as string;
    const avatar = formData.get("avatarFile") as File;

    await dbConnect();

    const user = await getCurrentAuthUser();
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

    if (user?.isDeleted) {
      return ApiResponse(
        false,
        STATUS_CODES.BAD_REQUEST,
        "Your account has been deleted!"
      );
    }

    const userInfo = await User.findOne({ _id: user.id });
    if (!userInfo) {
      return ApiResponse(false, STATUS_CODES.NOT_FOUND, "Profile not found");
    }

    const userAvatar = {
      url: "",
      public_id: "",
      size: 0,
    };
    if (avatar) {
      const result = await uploadToCloudinary(avatar);

      if (result) {
        userAvatar.url = result;
        userAvatar.public_id = avatar.name;
        userAvatar.size = avatar.size;
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: user.id },
      { name, bio, avatar: userAvatar },
      { new: true }
    );

    if (!updatedUser) {
      return ApiResponse(
        false,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        "Something went wrong. Please try again."
      );
    }

    return ApiResponse(true, STATUS_CODES.OK, "Profile updated successfully", {
      headers: {
        "X-RateLimit-Limit": RATE_LIMIT_MAX_REQUESTS.toString(),
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
      },
    });
  } catch (error) {
    logger.error(error);
    return ApiResponse(
      false,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again."
    );
  }
}
