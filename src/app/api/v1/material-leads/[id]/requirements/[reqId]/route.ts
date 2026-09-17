import { NextRequest } from "next/server";
import { MaterialLeadService } from "@/modules/material-leads/material-lead.service";
import { materialRequirementItemSchema } from "@/validators/material-lead.schema";
import { successResponse, errorResponse, ApiResponse } from "@/lib/response";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; reqId: string }> }
) {
  try {
    const { id, reqId } = await params;
    const user = await getCurrentUser();
    const body = await req.json();

    const validated = materialRequirementItemSchema.partial().safeParse(body);
    if (!validated.success) {
      const errMsg = validated.error.errors.map((e) => e.message).join(", ");
      return ApiResponse.error(`Validation Error: ${errMsg}`, 400);
    }

    const result = await MaterialLeadService.updateRequirement(id, reqId, validated.data, user?.id);
    return successResponse(result, { message: "Material Requirement item updated" });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; reqId: string }> }
) {
  try {
    const { id, reqId } = await params;
    const user = await getCurrentUser();
    const result = await MaterialLeadService.deleteRequirement(id, reqId, user?.id);
    return successResponse(result, { message: "Material Requirement item removed" });
  } catch (error) {
    return errorResponse(error);
  }
}
