import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { MaterialLeadService } from "@/modules/material-leads/material-lead.service";
import { placeMaterialOrderSchema } from "@/validators/material-lead.schema";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError, ValidationError } from "@/lib/errors";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "leads:update", "PLACE_MATERIAL_LEAD_ORDER");

    const { id } = await params;
    const body = await req.json();
    const validated = placeMaterialOrderSchema.safeParse(body);
    if (!validated.success) {
      throw new ValidationError("Invalid place order payload", validated.error.errors);
    }

    const result = await MaterialLeadService.placeMaterialOrder(id, validated.data, session.userId);
    return successResponse(result, undefined, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
