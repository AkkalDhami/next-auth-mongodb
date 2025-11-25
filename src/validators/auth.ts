import { OTP_CODE_LENGTH, OTP_TYPES } from "@/constants/auth-constants";
import z from "zod";

export const emailSchema = z
  .email({ message: "Please enter a valid email address." })
  .max(100, { message: "Email must be no more than 100 characters." });

export const nameSchema = z
  .string({ error: "Name must be a string" })
  .trim()
  .min(3, {
    message: "Name must be at least 3 characters long",
  })
  .max(50, {
    message: "Name must be at most 50 characters long",
  });

export const passwordSchema = z
  .string({ error: "Password must be a string" })
  .trim()
  .min(6, {
    message: "Password must be at least 6 characters long",
  })
  .max(80, {
    message: "Password must be at most 80 characters long",
  });

export const OtpRequestSchema = z.object({
  email: emailSchema,
  type: z.enum(OTP_TYPES, { error: "Invalid OTP type" }),
});

export const OtpVerifySchema = z.object({
  otpCode: z.string().min(OTP_CODE_LENGTH, "Please enter a valid OTP"),
  otpType: z.enum(OTP_TYPES, { error: "Invalid OTP type" }),
  email: emailSchema,
});

export const SigninSchema = z.object({
  email: emailSchema,
  password: z.string({ error: "Password must be a string" }).trim().min(1, {
    message: "Password is required",
  }),
});

export const SignupSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine(
    (data) => {
      return data.password === data.confirmPassword;
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

export const ResetPasswordSchema = z
  .object({
    email: emailSchema.optional(),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, "Confirm new password is required"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export const ChangePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmNewPassword: passwordSchema,
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export const DeleteAccountSchema = z.object({
  type: z
    .enum(["soft", "hard"], { error: "Type must be either soft or hard" })
    .default("soft"),
});

export const ProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z
    .string({ error: "Bio must be a string!" })
    .max(500, "Bio must be at most 500 characters")
    .optional(),
  avatarFile: z.instanceof(File).optional(),
});

export type ProfileFormData = z.infer<typeof ProfileSchema>;

export type OtpRequest = z.infer<typeof OtpRequestSchema>;
export type OtpVerify = z.infer<typeof OtpVerifySchema>;
export type SigninFormData = z.infer<typeof SigninSchema>;
export type SignupFormData = z.infer<typeof SignupSchema>;
export type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof ChangePasswordSchema>;
export type DeleteAccount = z.infer<typeof DeleteAccountSchema>;
