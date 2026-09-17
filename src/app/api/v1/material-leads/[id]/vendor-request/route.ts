import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { MaterialLeadService } from "@/modules/material-leads/material-lead.service";
import { vendorRequestSchema, vendorResponseSchema } from "@/validators/material-lead.schema";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError, ValidationError } from "@/lib/errors";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "leads:update", "SEND_VENDOR_REQUEST");

    const { id } = await params;
    const body = await req.json();
    const validated = vendorRequestSchema.safeParse(body);
    if (!validated.success) {
      throw new ValidationError("Invalid vendor request payload", validated.error.errors);
    }

    const result = await MaterialLeadService.sendVendorRequest(id, validated.data, session.userId);
    return successResponse(result, undefined, 201);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "leads:update", "RECORD_VENDOR_RESPONSE");

    const { id } = await params;
    const body = await req.json();
    const validated = vendorResponseSchema.safeParse(body);
    if (!validated.success) {
      throw new ValidationError("Invalid vendor response payload", validated.error.errors);
    }

    const result = await MaterialLeadService.recordVendorResponse(id, validated.data, session.userId);
    return successResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
