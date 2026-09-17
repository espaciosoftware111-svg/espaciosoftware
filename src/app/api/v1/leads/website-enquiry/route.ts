import { NextRequest } from "next/server";
import { LeadService } from "@/modules/leads/lead.service";
import { websiteEnquirySchema } from "@/validators/lead.schema";
import { successResponse, errorResponse, ApiResponse } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    // Normalize field variations from diverse frontend forms
    const normalizedInput = {
      fullName: rawBody.fullName || rawBody.full_name || rawBody.name || rawBody.clientName || "",
      mobileNumber: rawBody.mobileNumber || rawBody.mobile || rawBody.phone || rawBody.phoneNumber || "",
      emailAddress: rawBody.emailAddress || rawBody.email || "",
      requirementType: rawBody.requirementType || rawBody.requirement || rawBody.requirement_type || "Turnkey Interiors",
      customRequirement: rawBody.customRequirement || rawBody.custom_requirement || null,
      propertyType: rawBody.propertyType || rawBody.property_type || "Apartment",
      customPropertyType: rawBody.customPropertyType || rawBody.custom_property_type || null,
      spaces: Array.isArray(rawBody.spaces)
        ? rawBody.spaces
        : typeof rawBody.spaces === "string"
        ? [rawBody.spaces]
        : rawBody.selectedSpaces || ["Full Home"],
      customSpace: rawBody.customSpace || rawBody.custom_space || null,
      projectLocation: rawBody.projectLocation || rawBody.location || rawBody.project_location || "",
      propertySize: rawBody.propertySize || rawBody.size || rawBody.property_size || null,
      customerStage: rawBody.customerStage || rawBody.stage || rawBody.customer_stage || "Ready To Start",
      specificRequirements: rawBody.specificRequirements || rawBody.notes || rawBody.specific_requirements || null,
      source: "WEBSITE",
    };

    const validated = websiteEnquirySchema.safeParse(normalizedInput);
    if (!validated.success) {
      const errorMsg = validated.error.errors.map((e) => e.message).join(", ");
      return ApiResponse.error(`Validation Error: ${errorMsg}`, 400);
    }

    const result = await LeadService.ingestWebsiteEnquiry(validated.data);

    return successResponse(
      {
        leadId: result.lead.id,
        referenceNo: result.referenceNo,
        status: "NEW",
        clientName: result.lead.clientName,
        createdAt: result.lead.createdAt,
        duplicateWarning: result.duplicateWarning,
      },
      { message: "Website enquiry processed and lead generated successfully." },
      201
    );
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function GET() {
  return successResponse({
    status: "ACTIVE",
    endpoint: "/api/v1/leads/website-enquiry",
    description: "Multi-Step Website Inbound Lead Enquiry Ingestion Endpoint",
    requiredFields: [
      "fullName (min 2 chars)",
      "mobileNumber (min 10 digits)",
      "emailAddress (valid email)",
      "requirementType",
      "propertyType",
      "projectLocation (min 2 chars)",
    ],
    optionalFields: [
      "customRequirement (when requirement is Something Else)",
      "customPropertyType (when property is Others)",
      "spaces (array e.g. ['Kitchen', 'Living Room'])",
      "customSpace (when spaces includes Others)",
      "propertySize (e.g. '3200 sq ft', '3 BHK')",
      "customerStage ('Just Exploring' | 'Ready To Start' | 'Have A Timeline In Mind')",
      "specificRequirements (free text area)",
    ],
  });
}
