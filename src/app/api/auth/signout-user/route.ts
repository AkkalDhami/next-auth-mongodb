import { STATUS_CODES } from "@/constants/status-codes";
import { verifyRefreshToken } from "@/helpers/jwt-helpers";
import { ApiResponse } from "@/utils/api-response";
import { cookies } from "next/headers";

export const POST = async () => {
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

    const decoded = verifyRefreshToken(refreshToken as string);
    if (!decoded) {
      return ApiResponse(
        false,
        STATUS_CODES.UNAUTHORIZED,
        "Unauthorized, please login first"
      );
    }

    cookieStore.delete("refreshToken");
    cookieStore.delete("accessToken");

    return ApiResponse(
      true,
      STATUS_CODES.NO_CONTENT,
      "Logged out successfully"
    );
  } catch (error) {
    console.log(error);
    return ApiResponse(
      false,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      "Internal server error"
    );
  }
};
