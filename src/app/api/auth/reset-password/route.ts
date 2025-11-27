import { cookies } from "next/headers";

import { NextRequest } from "next/server";
import z from "zod";
import { ApiResponse } from "@/utils/api-response";
import { ResetPasswordSchema } from "@/validators/auth";
import { STATUS_CODES } from "@/constants/status-codes";
import dbConnect from "@/configs/db";
import {
  generateRandomToken,
  hashPassword,
  verifyPassword,
} from "@/helpers/auth-helpers";
import User from "@/models/user.model";

export const POST = async (request: NextRequest) => {
  try {
    const cookieStore = await cookies();
    await dbConnect();
    // const user = await getCurrentAuthUser();

    // if (!user) {
    //   return ApiResponse(
    //     false,
    //     STATUS_CODES.UNAUTHORIZED,
    //     "Unauthorized, please login first"
    //   );
    // }

    // console.log({ user });

    // if (user?.isDeleted) {
    //   return ApiResponse(
    //     false,
    //     STATUS_CODES.BAD_REQUEST,
    //     "Your account has been deactivated!"
    //   );
    // }

    // if (user?.lockUntil && new Date(user?.lockUntil) > new Date()) {
    //   return ApiResponse(
    //     false,
    //     STATUS_CODES.BAD_REQUEST,
    //     `Your account has been locked. Please try again after ${Math.ceil(
    //       (user.lockUntil.getTime() - Date.now()) / (1000 * 60)
    //     )} minutes.`
    //   );
    // }

    const formData = await request.json();
    const { data, success, error } = ResetPasswordSchema.safeParse(formData);
    if (!success) {
      return ApiResponse(
        false,
        STATUS_CODES.UNPROCESSABLE_ENTITY,
        "Invalid data received",
        z.flattenError(error).fieldErrors
      );
    }

    const { newPassword, email } = data;

    if (!newPassword) {
      return ApiResponse(
        false,
        STATUS_CODES.BAD_REQUEST,
        "New password is required"
      );
    }

    const resetPasswordToken = cookieStore.get(
      "hashedResetPasswordToken"
    )?.value;
    const resetPasswordExpiry = cookieStore.get("resetPasswordExpiry")?.value;
    console.log({ resetPasswordExpiry, resetPasswordToken });
    console.log(
      new Date(resetPasswordExpiry as string) < new Date(),
      new Date().toISOString()
    );
    if (!resetPasswordExpiry || new Date(resetPasswordExpiry) < new Date()) {
      return ApiResponse(
        false,
        STATUS_CODES.BAD_REQUEST,
        "Reset password token has expired"
      );
    }
    const userInfo = await User.findOne({ email }).select("+password");
    if (!userInfo) {
      return ApiResponse(false, STATUS_CODES.NOT_FOUND, "User not found");
    }

    const { hashedToken } = generateRandomToken(userInfo?._id.toString());

    if (resetPasswordToken !== hashedToken) {
      return ApiResponse(
        false,
        STATUS_CODES.BAD_REQUEST,
        "Invalid reset password token"
      );
    }

    const hashedPassword = await hashPassword(newPassword);
    const oldPassword = userInfo?.password;

    const isOldPassword = await verifyPassword(
      newPassword,
      oldPassword as string
    );

    if (isOldPassword) {
      return ApiResponse(
        false,
        STATUS_CODES.BAD_REQUEST,
        "New password cannot be same as old password"
      );
    }

    const isPasswordUpdated = await User.findOneAndUpdate(
      { _id: userInfo.id },
      { password: hashedPassword },
      { new: true }
    );
    if (!isPasswordUpdated) {
      return ApiResponse(
        false,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        "Something went wrong. Please try again."
      );
    }

    cookieStore.delete("hashedResetPasswordToken");
    cookieStore.delete("resetPasswordExpiry");
    return ApiResponse(true, STATUS_CODES.OK, "Password reset successfully");
  } catch (error) {
    console.error(error);
    return ApiResponse(
      false,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again."
    );
  }
};
