import { STATUS_CODES } from "@/constants/status-codes";
import { setAuthCookies } from "@/helpers/auth-helpers";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "@/helpers/jwt-helpers";
import User from "@/models/user.model";
import { ApiResponse } from "@/utils/api-response";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      return ApiResponse(
        false,
        STATUS_CODES.UNAUTHORIZED,
        "Unauthorized, please login first"
      );
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return ApiResponse(
        false,
        STATUS_CODES.UNAUTHORIZED,
        "Unauthorized, please login first"
      );
    }

    const user = await User.findOne({ _id: decoded._id });
    if (!user) {
      return ApiResponse(
        false,
        STATUS_CODES.UNAUTHORIZED,
        "Unauthorized, please login first"
      );
    }

    const newAccessToken = generateAccessToken(decoded._id);

    const newRefreshToken = generateRefreshToken(decoded._id);

    await setAuthCookies(newAccessToken, newRefreshToken);

    return ApiResponse(true, STATUS_CODES.OK, "Refreshing tokens successfully");
  } catch (err) {
    console.log(err);
    return ApiResponse(
      false,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again."
    );
  }
}
