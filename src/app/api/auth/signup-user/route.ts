import dbConnect from "@/configs/db";
import { STATUS_CODES } from "@/constants/status-codes";
import User from "@/models/user.model";
import { ApiResponse } from "@/utils/api-response";
import { SignupSchema } from "@/validators/auth";
import { NextRequest } from "next/server";
import z from "zod";
import {
  checkRateLimit,
  getClientIP,
  hashPassword,
} from "@/helpers/auth-helpers";
import {
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW,
} from "@/constants/auth-constants";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.json();
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

    const { success, data, error } = SignupSchema.safeParse(formData);
    await dbConnect();
    if (!success) {
      return ApiResponse(
        false,
        STATUS_CODES.UNPROCESSABLE_ENTITY,
        "Invalid data received!",
        z.flattenError(error).fieldErrors
      );
    }

    const { name, email, password } = data;
    if (!name || !email) {
      return ApiResponse(
        false,
        STATUS_CODES.BAD_REQUEST,
        "Name and email are required"
      );
    }

    const existingUser = await User.findOne({ email }).select("+password");

    if (existingUser) {
      return ApiResponse(
        false,
        STATUS_CODES.CONFLICT,
        "User with this email already exists"
      );
    }

    const hashedPassword = await hashPassword(password);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    if (!newUser) {
      return ApiResponse(
        false,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        "Something went wrong. Please try again."
      );
    }

    await newUser.save();

    return ApiResponse(
      true,
      STATUS_CODES.CREATED,
      "User created successfully",
      {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      }
    );
  } catch (error) {
    console.error(error);
    return ApiResponse(
      false,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again."
    );
  }
}
