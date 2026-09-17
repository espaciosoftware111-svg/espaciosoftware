import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "@/lib/response";
import { ReportsService } from "@/modules/reports/reports.service";
import { generatePdfHtml } from "@/modules/reports/pdf-generator";
import { AuditService } from "@/modules/audit/audit.service";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return ApiResponse.unauthorized();

    const body = await req.json();
    const { reportKey, filter, scope } = body;

    if (!reportKey) {
      return ApiResponse.error("reportKey is required", 400);
    }

    // Generate the report data
    const reportData = await ReportsService.generateReport(reportKey, filter || {}, user.id);

    // Generate print-ready HTML
    const htmlContent = generatePdfHtml({
      reportName: reportData.reportName,
      reportKey: reportData.reportKey,
      category: reportData.category,
      period: reportData.period,
      generatedBy: user.fullName,
      columns: reportData.columns,
      rows: reportData.rows,
      scope: scope || "Complete Section",
    });

    // Audit log
    await AuditService.logEvent({
      userId: user.id,
      action: "REPORT_PDF_GENERATED",
      entityType: "Report",
      entityId: reportKey,
      newValues: { format: "PDF", rowCount: reportData.totalRows, scope: scope || "complete" },
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const sanitizedKey = reportKey.toLowerCase().replace(/[^a-z0-9_]/g, "_");

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${sanitizedKey}_${timestamp}.html"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate PDF report";
    return ApiResponse.error(message, 500);
  }
}
