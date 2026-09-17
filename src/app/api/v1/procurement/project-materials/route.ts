import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { ProjectMaterialsService } from "@/modules/procurement/project-materials.service";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "purchase_orders:read", "GET_PROJECT_MATERIALS");

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const projectId = searchParams.get("projectId") || undefined;
    const vendorId = searchParams.get("vendorId") || undefined;
    const orderType = searchParams.get("orderType") || undefined;
    const materialStatus = searchParams.get("materialStatus") || undefined;
    const paymentStatus = searchParams.get("paymentStatus") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;

    const result = await ProjectMaterialsService.getProjectMaterials({
      search,
      projectId,
      vendorId,
      orderType,
      materialStatus,
      paymentStatus,
      startDate,
      endDate,
      page,
      limit,
    });

    return successResponse(result.orders, { ...result.pagination, summary: result.summary });
  } catch (error) {
    return errorResponse(error);
  }
}
