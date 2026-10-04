import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { LeadService } from "@/modules/leads/lead.service";
import { deleteMultipleLeadsSchema } from "@/validators/lead.schema";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError, ValidationError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "leads:delete", "DELETE_LEADS_BULK");

    const body = await req.json().catch(() => ({}));
    const parsed = deleteMultipleLeadsSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.errors[0]?.message || "Invalid payload for multiple leads deletion",
        parsed.error.format()
      );
    }

    const result = await LeadService.deleteMultipleLeads(
      parsed.data.leadIds,
      session.userId,
      parsed.data.adminPassword
    );

    return successResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest) {
  return POST(req);
}
