import { NextRequest } from "next/server";
import { MaterialLeadService } from "@/modules/material-leads/material-lead.service";
import { websiteMaterialEnquirySchema } from "@/validators/material-lead.schema";
import { successResponse, errorResponse, ApiResponse } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    const normalizedInput = {
      customerName: rawBody.customerName || rawBody.fullName || rawBody.name || rawBody.clientName || "",
      contactNumber1: rawBody.contactNumber1 || rawBody.primaryContact || rawBody.phone || rawBody.mobile || "",
      contactNumber2: rawBody.contactNumber2 || rawBody.secondaryContact || rawBody.alternatePhone || null,
      emailAddress: rawBody.emailAddress || rawBody.email || "",
      projectLocation: rawBody.projectLocation || rawBody.location || "",
      source: rawBody.source || "Website",
      customSource: rawBody.customSource || null,
      materialPreferences: rawBody.materialPreferences || rawBody.notes || rawBody.specificRequirements || null,
      requirements: Array.isArray(rawBody.requirements) ? rawBody.requirements : [],
    };

    const validated = websiteMaterialEnquirySchema.safeParse(normalizedInput);
    if (!validated.success) {
      const errorMsg = validated.error.errors.map((e) => e.message).join(", ");
      return ApiResponse.error(`Validation Error: ${errorMsg}`, 400);
    }

    const result = await MaterialLeadService.ingestWebsiteMaterialEnquiry(validated.data);

    return successResponse(
      {
        materialLeadId: result.materialLead.id,
        referenceNo: result.referenceNo,
        status: "NEW",
        customerName: result.materialLead.customerName,
        createdAt: result.materialLead.createdAt,
        duplicateWarning: result.duplicateWarning,
      },
      { message: "Material request enquiry received and Material Lead generated successfully." },
      201
    );
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function GET() {
  return successResponse({
    status: "ACTIVE",
    endpoint: "/api/v1/material-leads/website-enquiry",
    description: "Inbound Website Material Request & Catalog Unlock Ingestion Endpoint",
    requiredFields: [
      "customerName / fullName (min 2 chars)",
      "contactNumber1 / primaryContact (valid phone)",
      "projectLocation / location (min 2 chars)",
    ],
    optionalFields: [
      "contactNumber2 / secondaryContact",
      "emailAddress / email",
      "source (default 'Website')",
      "customSource (when source is Other)",
      "materialPreferences / notes",
      "requirements (array of material items)",
    ],
  });
}
