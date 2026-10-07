import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { GstInvoiceService } from "@/modules/finance/gst-invoice.service";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const clientId = searchParams.get("clientId") || undefined;
    const projectId = searchParams.get("projectId") || undefined;
    const quotationId = searchParams.get("quotationId") || undefined;
    const search = searchParams.get("search") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const overdueOnly = searchParams.get("overdueOnly") === "true";

    const invoices = await GstInvoiceService.getInvoices({
      status,
      clientId,
      projectId,
      quotationId,
      search,
      startDate,
      endDate,
      overdueOnly,
    });

    return successResponse(invoices);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    const body = await req.json();

    if (body.quotationId && (body.paymentType || body.amountPaid !== undefined)) {
      const result = await GstInvoiceService.createQuotationPaymentInvoice({
        quotationId: body.quotationId,
        paymentType: body.paymentType || "Payment",
        amountPaid: Number(body.amountPaid || body.amount || 0),
        paymentDate: body.paymentDate,
        paymentMode: body.paymentMode || body.paymentMethod || "UPI",
        invoiceNo: body.invoiceNo || body.invoiceNumber || undefined,
        transactionReference: body.transactionReference || body.referenceNumber || body.referenceNoExt,
        paymentNotes: body.paymentNotes || body.notes,
        createdById: session.userId,
        allowOverpayment: body.allowOverpayment ?? false,
        handoverDate: body.handoverDate || body.targetDeliveryDate,
        targetDeliveryDate: body.targetDeliveryDate || body.handoverDate,
      });
      return successResponse(result, undefined, 201);
    }

    const invoice = await GstInvoiceService.createInvoice({
      ...body,
      createdById: session.userId,
    });

    return successResponse(invoice, undefined, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
