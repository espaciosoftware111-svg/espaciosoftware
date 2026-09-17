import { NextRequest } from "next/server";
import { LeadService } from "@/modules/leads/lead.service";
import { websiteEnquirySchema } from "@/validators/lead.schema";
import { successResponse, errorResponse, ApiResponse } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    // Check if payload is wrapped in 'data' or 'body'
    const payload = rawBody.data || rawBody.body || rawBody;

    const normalizedInput = {
      fullName: payload.fullName || payload.full_name || payload.name || payload.clientName || payload.customer_name || "",
      mobileNumber: payload.mobileNumber || payload.mobile || payload.phone || payload.phoneNumber || payload.phone_number || "",
      emailAddress: payload.emailAddress || payload.email || payload.email_address || "",
      requirementType: payload.requirementType || payload.requirement || payload.requirement_type || "Turnkey Interiors",
      customRequirement: payload.customRequirement || payload.custom_requirement || null,
      propertyType: payload.propertyType || payload.property_type || "Apartment",
      customPropertyType: payload.customPropertyType || payload.custom_property_type || null,
      spaces: Array.isArray(payload.spaces)
        ? payload.spaces
        : typeof payload.spaces === "string"
        ? payload.spaces.split(",").map((s: string) => s.trim())
        : payload.selectedSpaces || ["Full Home"],
      customSpace: payload.customSpace || payload.custom_space || null,
      projectLocation: payload.projectLocation || payload.location || payload.project_location || payload.city || "Hyderabad",
      propertySize: payload.propertySize || payload.size || payload.property_size || payload.area || null,
      customerStage: payload.customerStage || payload.stage || payload.customer_stage || "Ready To Start",
      specificRequirements: payload.specificRequirements || payload.notes || payload.specific_requirements || payload.message || null,
      source: "WEBSITE",
    };

    const validated = websiteEnquirySchema.safeParse(normalizedInput);
    if (!validated.success) {
      const errorMsg = validated.error.errors.map((e) => e.message).join(", ");
      return ApiResponse.error(`Webhook Payload Validation Error: ${errorMsg}`, 400);
    }

    const result = await LeadService.ingestWebsiteEnquiry(validated.data);

    return successResponse(
      {
        received: true,
        leadId: result.lead.id,
        referenceNo: result.referenceNo,
        status: "NEW",
        clientName: result.lead.clientName,
        createdAt: result.lead.createdAt,
        duplicateWarning: result.duplicateWarning,
      },
      { message: "Webhook received and Lead generated successfully." },
      201
    );
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function GET() {
  return successResponse({
    status: "ACTIVE",
    endpoint: "/api/v1/leads/webhook",
    method: "POST",
    contentType: "application/json",
    description: "External Website Lead Inbound Webhook Ingestion Hook (ESPACIO ERP Rule 41)",
  });
}
