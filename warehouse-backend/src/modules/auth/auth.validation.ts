import { z } from "zod";
import { MIN_PASSWORD_LENGTH } from "@/common/utils/password";

const phoneSchema = z.string().regex(/^\+?[1-9]\d{7,14}$/, "Invalid phone number (use E.164 format)");
const emailSchema = z.string().email().transform((v) => v.toLowerCase());

export const requestPhoneOtpSchema = z.object({
  phone: phoneSchema,
  purpose: z.enum(["REGISTRATION", "LOGIN_2FA", "PASSWORD_RESET"]),
});

export const verifyPhoneOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string().length(6),
  purpose: z.enum(["REGISTRATION", "LOGIN_2FA", "PASSWORD_RESET"]),
});

export const requestEmailOtpSchema = z.object({
  email: emailSchema,
  purpose: z.enum(["REGISTRATION", "LOGIN_2FA", "PASSWORD_RESET"]),
});

export const verifyEmailOtpSchema = z.object({
  email: emailSchema,
  code: z.string().length(6),
  purpose: z.enum(["REGISTRATION", "LOGIN_2FA", "PASSWORD_RESET"]),
});

export const registerAdminSchema = z.object({
  name: z.string().min(2).max(120),
  phone: phoneSchema,
  email: emailSchema,
  password: z.string().min(MIN_PASSWORD_LENGTH),
  confirmPassword: z.string().min(MIN_PASSWORD_LENGTH),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  identifier: z.string().min(3), // phone OR email
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(MIN_PASSWORD_LENGTH),
  confirmNewPassword: z.string().min(MIN_PASSWORD_LENGTH),
}).refine((d) => d.newPassword === d.confirmNewPassword, {
  message: "Passwords do not match",
  path: ["confirmNewPassword"],
});

export const resetPasswordSchema = z.object({
  identifier: z.string().min(3),
  otpChannel: z.enum(["PHONE", "EMAIL"]),
  code: z.string().length(6),
  newPassword: z.string().min(MIN_PASSWORD_LENGTH),
  confirmNewPassword: z.string().min(MIN_PASSWORD_LENGTH),
}).refine((d) => d.newPassword === d.confirmNewPassword, {
  message: "Passwords do not match",
  path: ["confirmNewPassword"],
});
