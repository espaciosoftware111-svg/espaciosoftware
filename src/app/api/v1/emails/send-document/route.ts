import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { EmailService } from "@/lib/email.service";
import { AuditService } from "@/modules/audit/audit.service";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError, ValidationError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError("Unauthorized session");

    const body = await req.json();
    const { to, recipientName, subject, message, pdfBase64, filename, documentType, documentId } = body;

    if (!to || typeof to !== "string" || !to.includes("@")) {
      throw new ValidationError("Valid recipient email is required");
    }
    if (!pdfBase64 || typeof pdfBase64 !== "string") {
      throw new ValidationError("PDF attachment binary payload is required");
    }

    const result = await EmailService.sendDocumentWithAttachment({
      recipientEmail: to.trim(),
      recipientName: recipientName?.trim(),
      subject: subject || "Official Document - Espacio Interiors",
      body: message || "",
      filename: filename || "Official_Document.pdf",
      pdfBase64,
      documentType,
      documentId,
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to send email");
    }

    // Preserve full audit history
    await AuditService.logEvent({
      userId: session.userId,
      action: "DOCUMENT_EMAILED",
      entityType: documentType || "QUOTATION",
      entityId: documentId || null,
      newValues: {
        recipientEmail: to.trim(),
        recipientName,
        filename: result.filename,
        subject,
      },
    });

    return successResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
