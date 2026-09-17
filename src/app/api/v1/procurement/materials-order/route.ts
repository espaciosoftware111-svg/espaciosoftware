import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { MaterialsOrderService } from "@/modules/procurement/materials-order.service";
import { createMaterialsOrderSchema, materialsOrderFilterSchema } from "@/validators/materials-order.schema";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError, ValidationError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "purchase_orders:read", "GET_MATERIALS_ORDERS");

    const { searchParams } = new URL(req.url);
    const rawParams = {
      search: searchParams.get("search") || undefined,
      customer: searchParams.get("customer") || undefined,
      leadId: searchParams.get("leadId") || undefined,
      vendorId: searchParams.get("vendorId") || undefined,
      material: searchParams.get("material") || undefined,
      materialStatus: searchParams.get("materialStatus") || undefined,
      paymentStatus: searchParams.get("paymentStatus") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
    };

    const validated = materialsOrderFilterSchema.safeParse(rawParams);
    if (!validated.success) {
      throw new ValidationError("Invalid query parameters", validated.error.errors);
    }

    const result = await MaterialsOrderService.getConfirmedMaterialsOrders(validated.data);
    return successResponse(result.items, {
      ...result.pagination,
      kpi: result.kpi,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "purchase_orders:create", "CREATE_MATERIALS_ORDER");

    const body = await req.json();
    const validated = createMaterialsOrderSchema.safeParse(body);
    if (!validated.success) {
      throw new ValidationError("Invalid Materials Order input", validated.error.errors);
    }

    const order = await MaterialsOrderService.createConfirmedMaterialsOrder(validated.data, session.userId);
    return successResponse(order, undefined, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
