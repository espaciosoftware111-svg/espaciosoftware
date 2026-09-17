import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { MaterialsOrderService } from "@/modules/procurement/materials-order.service";
import { recordMaterialsOrderPaymentSchema } from "@/validators/materials-order.schema";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError, ValidationError } from "@/lib/errors";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "payments:create", "RECORD_MATERIALS_ORDER_PAYMENT");

    const { id } = await params;
    const body = await req.json();
    const validated = recordMaterialsOrderPaymentSchema.safeParse(body);
    if (!validated.success) {
      throw new ValidationError("Invalid payment payload", validated.error.errors);
    }

    const result = await MaterialsOrderService.recordPaymentForMaterialsOrder(id, validated.data, session.userId);
    return successResponse(result, undefined, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
