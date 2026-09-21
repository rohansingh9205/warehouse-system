import { Router } from "express";
import * as controller from "./auth.controller";
import { validateBody } from "@/common/middleware/validate";
import {
  requestPhoneOtpSchema,
  verifyPhoneOtpSchema,
  requestEmailOtpSchema,
  verifyEmailOtpSchema,
  registerAdminSchema,
  loginSchema,
  changePasswordSchema,
  resetPasswordSchema,
} from "./auth.validation";
import { loginRateLimiter, otpRateLimiter } from "@/common/middleware/rate-limiters";
import { requireAuth } from "@/common/middleware/require-auth";

const router = Router();

// OTP
router.post("/request-phone-otp", otpRateLimiter, validateBody(requestPhoneOtpSchema), controller.requestPhoneOtp);
router.post("/verify-phone-otp", otpRateLimiter, validateBody(verifyPhoneOtpSchema), controller.verifyPhoneOtp);
router.post("/request-email-otp", otpRateLimiter, validateBody(requestEmailOtpSchema), controller.requestEmailOtp);
router.post("/verify-email-otp", otpRateLimiter, validateBody(verifyEmailOtpSchema), controller.verifyEmailOtp);

// Registration (Admin only — Super Admin is CLI-provisioned)
router.post("/register", validateBody(registerAdminSchema), controller.registerAdmin);

// Session lifecycle
router.post("/login", loginRateLimiter, validateBody(loginSchema), controller.login);
router.post("/logout", requireAuth, controller.logout);
router.post("/logout-all", requireAuth, controller.logoutAllDevices);
router.get("/me", requireAuth, controller.getCurrentUser);

// Password
router.post("/change-password", requireAuth, validateBody(changePasswordSchema), controller.changePassword);
router.post("/reset-password", otpRateLimiter, validateBody(resetPasswordSchema), controller.resetPassword);

export default router;
