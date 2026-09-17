import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { VendorPaymentService } from "@/modules/finance/vendor-payment.service";
import { recordVendorPaymentSchema } from "@/validators/finance.schema";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError, ValidationError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "vendors:read", "GET_VENDOR_PAYMENTS");

    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendorId") || undefined;
    const payableId = searchParams.get("payableId") || undefined;

    const payments = await VendorPaymentService.getVendorPayments(vendorId, payableId);

    return successResponse(payments);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "vendors:write", "RECORD_VENDOR_PAYMENT");

    const body = await req.json();
    const parsed = recordVendorPaymentSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Invalid vendor payment payload", parsed.error.format());
    }

    const payment = await VendorPaymentService.recordVendorPayment(parsed.data, session.userId);

    return successResponse(payment, undefined, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
