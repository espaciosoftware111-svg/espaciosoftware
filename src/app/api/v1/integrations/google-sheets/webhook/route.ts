import { NextRequest, NextResponse } from "next/server";
import { GoogleSheetsSyncService } from "@/modules/integrations/google-sheets.service";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    logger.info("[GOOGLE_SHEETS_WEBHOOK] Received webhook payload:", body);

    // If payload is an array of rows or contains a specific type
    const type = (body.type || (body.sheetName?.toLowerCase().includes("material") ? "MATERIAL_LEAD" : "LEAD")).toUpperCase();
    const row = body.row || body.data || body;

    const result = await GoogleSheetsSyncService.ingestWebhookRow(
      type.includes("MAT") ? "MATERIAL_LEAD" : "LEAD",
      row
    );

    return NextResponse.json({
      success: true,
      message: "Row processed successfully into ESPACIO ERP",
      result,
    });
  } catch (error: any) {
    logger.error("[GOOGLE_SHEETS_WEBHOOK] Failed to process webhook row:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process webhook" },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "HEALTHY",
    service: "ESPACIO ERP Google Sheets Webhook Receiver",
    timestamp: new Date().toISOString(),
  });
}
