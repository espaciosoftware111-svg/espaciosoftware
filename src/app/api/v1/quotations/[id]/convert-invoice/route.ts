import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { QuotationService } from "@/modules/quotations/quotation.service";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError } from "@/lib/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    const { id } = await params;
    const eligibility = await QuotationService.getQuotationConversionEligibility(id);

    return successResponse(eligibility);
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

    const { id } = await params;
    const result = await QuotationService.convertQuotationToInvoice(id, session.userId);

    return successResponse(result, undefined, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
