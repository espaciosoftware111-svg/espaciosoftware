import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { MaterialsOrderService } from "@/modules/procurement/materials-order.service";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError } from "@/lib/errors";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "purchase_orders:edit", "MARK_MATERIALS_ORDER_RECEIVED");

    const { id } = await params;
    const order = await MaterialsOrderService.markMaterialsOrderReceived(id, session.userId);
    return successResponse(order, {
      message: "Material Order marked as Received successfully. (No Project Pipeline updated).",
    });
  } catch (err) {
    return errorResponse(err);
  }
}
