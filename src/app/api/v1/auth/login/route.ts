import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { loginSchema } from "@/validators/auth.schema";
import { successResponse, errorResponse } from "@/lib/response";
import { ValidationError } from "@/lib/errors";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { env } from "@/config/env";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message || "Please enter a valid email and password";
      throw new ValidationError(msg, parsed.error.format());
    }

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await AuthService.login({
      email: parsed.data.email,
      password: parsed.data.password,
      ipAddress,
      userAgent,
    });

    // 2-Step Verification is strictly mandatory for every login:
    // We return the 2FA challenge response. The session cookie is only attached after 2FA verification.
    return successResponse(result, {
      message: result.require2FASetup
        ? "Please set up Google Authenticator to continue"
        : "Please enter the 6-digit code from Google Authenticator",
    });
  } catch (err) {
    console.error("[LOGIN POST ERROR]:", err);
    return errorResponse(err);
  }
}
