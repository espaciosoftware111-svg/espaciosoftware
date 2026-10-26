import { NextRequest } from "next/server";
import { AccessRequestService } from "@/modules/auth/access-request.service";
import { successResponse, errorResponse } from "@/lib/response";
import { ValidationError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, phone, department, roleRequested, reason, password } = body;

    if (!fullName || typeof fullName !== "string") {
      throw new ValidationError("Please provide your full name");
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      throw new ValidationError("Please provide a valid email address");
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      throw new ValidationError("Password must be at least 6 characters");
    }

    const result = await AccessRequestService.createRequest({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: typeof phone === "string" ? phone.trim() : undefined,
      department: typeof department === "string" ? department.trim() : undefined,
      roleRequested: typeof roleRequested === "string" ? roleRequested.trim() : undefined,
      reason: typeof reason === "string" ? reason.trim() : undefined,
      password,
    });

    return successResponse(result, {
      message: "Access request submitted. An administrator will review your account.",
    });
  } catch (err) {
    console.error("[REQUEST ACCESS POST ERROR]:", err);
    return errorResponse(err);
  }
}
