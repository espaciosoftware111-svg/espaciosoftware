import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { successResponse, errorResponse } from "@/lib/response";
import { ValidationError } from "@/lib/errors";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { env } from "@/config/env";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tempToken, code } = body;

    if (!tempToken || typeof tempToken !== "string") {
      throw new ValidationError("Missing setup session token");
    }

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      throw new ValidationError("Please enter the 6-digit code from Google Authenticator");
    }

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await AuthService.confirmTwoFactorSetup({
      tempToken,
      code: code.trim(),
      ipAddress,
      userAgent,
    });

    const response = successResponse(result.user, { message: "2-Step Verification activated successfully" });

    // Attach HTTP-Only Session Cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: result.token,
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: env.SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (err) {
    console.error("[2FA SETUP CONFIRM POST ERROR]:", err);
    return errorResponse(err);
  }
}
