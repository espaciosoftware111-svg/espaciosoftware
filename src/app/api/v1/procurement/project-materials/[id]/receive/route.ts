import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { ProjectMaterialsService } from "@/modules/procurement/project-materials.service";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError } from "@/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "purchase_orders:write", "MARK_MATERIAL_RECEIVED");

    const resolvedParams = await params;
    const result = await ProjectMaterialsService.markMaterialAsReceived(
      resolvedParams.id,
      session.userId
    );

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
