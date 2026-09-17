import { NextRequest } from "next/server";
import { MaterialLeadService } from "@/modules/material-leads/material-lead.service";
import { updateMaterialLeadSchema } from "@/validators/material-lead.schema";
import { successResponse, errorResponse, ApiResponse } from "@/lib/response";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const result = await MaterialLeadService.getMaterialLeadById(id, user?.id);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const body = await req.json();

    const validated = updateMaterialLeadSchema.safeParse(body);
    if (!validated.success) {
      const errMsg = validated.error.errors.map((e) => e.message).join(", ");
      return ApiResponse.error(`Validation Error: ${errMsg}`, 400);
    }

    const updated = await MaterialLeadService.updateMaterialLead(id, validated.data, user?.id);
    return successResponse(updated, { message: "Material Lead updated successfully" });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return PUT(req, { params });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const result = await MaterialLeadService.deleteMaterialLead(id, user?.id);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
