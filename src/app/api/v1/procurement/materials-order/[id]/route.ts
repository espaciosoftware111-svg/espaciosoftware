import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { MaterialsOrderService } from "@/modules/procurement/materials-order.service";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError } from "@/lib/errors";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "purchase_orders:read", "GET_MATERIALS_ORDER_DETAIL");

    const { id } = await params;
    const order = await MaterialsOrderService.getMaterialsOrderById(id);
    return successResponse(order);
  } catch (err) {
    return errorResponse(err);
  }
}
