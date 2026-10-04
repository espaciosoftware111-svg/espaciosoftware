import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { ProjectService } from "@/modules/projects/project.service";
import { QuotationService } from "@/modules/quotations/quotation.service";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError, ValidationError } from "@/lib/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "projects:read", "GET_PROJECT_QUOTATIONS");

    const { id } = await params;
    const quotations = await QuotationService.getQuotations(
      { projectId: id, limit: 50 },
      session.userId
    );
    return successResponse(quotations);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "projects:write", "LINK_PROJECT_QUOTATION");

    const { id } = await params;
    const body = await req.json();
    const { action = "LINK", quotationId } = body;

    if (!quotationId) {
      throw new ValidationError("Quotation ID is required");
    }

    if (action === "SET_APPROVED") {
      const result = await ProjectService.setApprovedQuotation(id, quotationId, session.userId);
      return successResponse(result);
    }

    const linked = await ProjectService.linkQuotation(id, quotationId, session.userId);
    return successResponse(linked);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "projects:write", "UNLINK_PROJECT_QUOTATION");

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const quotationId = searchParams.get("quotationId");

    if (!quotationId) {
      throw new ValidationError("Quotation ID is required in query params");
    }

    const unlinked = await ProjectService.unlinkQuotation(id, quotationId, session.userId);
    return successResponse(unlinked);
  } catch (err) {
    return errorResponse(err);
  }
}
