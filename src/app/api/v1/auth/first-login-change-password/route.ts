import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { successResponse, errorResponse } from "@/lib/response";
import { ValidationError } from "@/lib/errors";
import { z } from "zod";

const firstLoginChangePasswordSchema = z
  .object({
    tempToken: z.string().min(1, "Session token is required"),
    currentPassword: z.string().min(1, "Present password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters long"),
    confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters long"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation password do not match",
    path: ["confirmPassword"],
  });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = firstLoginChangePasswordSchema.safeParse(body);

    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message || "Validation failed";
      throw new ValidationError(msg, parsed.error.format());
    }

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await AuthService.firstLoginChangePassword({
      tempToken: parsed.data.tempToken,
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
      confirmPassword: parsed.data.confirmPassword,
      ipAddress,
      userAgent,
    });

    return successResponse(result, {
      message: result.message || "Password updated successfully. Please proceed with 2-Step Verification.",
    });
  } catch (err) {
    console.error("[FIRST_LOGIN_CHANGE_PASSWORD ERROR]:", err);
    return errorResponse(err);
  }
}
