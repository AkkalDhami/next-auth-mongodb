import { OTP_TYPES } from "@/constants/auth-constants";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const BASE_URL = process.env.APP_URL || "http://localhost:3000";

export interface User {
  avatar: {
    url: string;
    public_id: string;
  };
  email: string;
  bio: string;
  id: number;
  isEmailVerified: boolean;
  lastLoginAt: string;
  name: string;
  role: "admin" | "user";
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

interface ApiResponse {
  message?: string;
  success?: boolean;
  data?: {
    message?: string;
    success?: boolean;
    email?: string;
    id?: number;
    name?: string;
    user?: User;
  };
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${BASE_URL}/api/auth`,
  }),
  tagTypes: ["Auth"],
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse, { email: string; password: string }>({
      query: (body) => ({
        url: "/signin-user",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    register: builder.mutation<ApiResponse, { name: string; email: string }>({
      query: (body) => ({
        url: "/signup-user",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    requestOtp: builder.mutation<
      ApiResponse,
      { email: string; type: (typeof OTP_TYPES)[number] }
    >({
      query: (body) => ({
        url: "/request-otp",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    verifyOtp: builder.mutation<
      ApiResponse,
      {
        email: string;
        otpCode: string;
        otpType: (typeof OTP_TYPES)[number] | null;
      }
    >({
      query: (body) => ({
        url: "/verify-otp",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    resetPassword: builder.mutation<
      ApiResponse,
      { newPassword: string; confirmNewPassword: string }
    >({
      query: (body) => ({
        url: "/reset-password",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    getProfile: builder.query<ApiResponse, void>({
      query: () => ({
        url: "/my-profile",
        method: "GET",
      }),
      providesTags: ["Auth"],
    }),

    updateProfile: builder.mutation<
      ApiResponse,
      { name: string; avatar?: string }
    >({
      query: (body) => ({
        url: "/update-profile",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    logout: builder.mutation<ApiResponse, void>({
      query: () => ({
        url: "/logout",
        method: "POST",
      }),
      invalidatesTags: ["Auth"],
    }),

    deleteAccount: builder.mutation<ApiResponse, { type: "soft" | "hard" }>({
      query: (body) => ({
        url: "/delete-account",
        method: "DELETE",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRequestOtpMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
  useLogoutMutation,
  useUpdateProfileMutation,
  useGetProfileQuery,
  useDeleteAccountMutation,
} = authApi;
