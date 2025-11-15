import { NextResponse } from "next/server";

interface IApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: any;
}

export const ApiResponse = (
  success: boolean,
  statusCode: number,
  message: string,
  data?: any
): NextResponse<IApiResponse> => {
  return NextResponse.json(
    { success, statusCode, message, data },
    { status: statusCode }
  );
};
