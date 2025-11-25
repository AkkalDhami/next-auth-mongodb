import dbConnect from "@/configs/db";
import { STATUS_CODES } from "@/constants/status-codes";
import { getCurrentAuthUser } from "@/helpers/auth-helpers";
import User from "@/models/user.model";
import { ApiResponse } from "@/utils/api-response";

export async function GET() {
  try {
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

    const sanitizedData = {
      user: {
        id: userInfo.id,
        name: userInfo.name,
        bio: userInfo.bio,
        email: userInfo.email,
        role: userInfo.role,
        isEmailVerified: userInfo.isEmailVerified,
        avatar: userInfo.avatar,
        lastLoginAt: userInfo.lastLoginAt,
        createdAt: userInfo.createdAt,
        updatedAt: userInfo.updatedAt,
        isDeleted: userInfo.isDeleted,
        lockUntil: userInfo.lockUntil,
      },
    };

    return ApiResponse(
      true,
      STATUS_CODES.OK,
      "Profile fetched successfullyy",
      sanitizedData
    );
  } catch (err) {
    console.error("geting jobs error:", err);
    return ApiResponse(
      false,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again."
    );
  }
}
