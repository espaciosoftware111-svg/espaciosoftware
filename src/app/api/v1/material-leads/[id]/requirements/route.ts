import { NextRequest } from "next/server";
import { MaterialLeadService } from "@/modules/material-leads/material-lead.service";
import { materialRequirementItemSchema } from "@/validators/material-lead.schema";
import { successResponse, errorResponse, ApiResponse } from "@/lib/response";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const body = await req.json();

    const validated = materialRequirementItemSchema.safeParse(body);
    if (!validated.success) {
      const errMsg = validated.error.errors.map((e) => e.message).join(", ");
      return ApiResponse.error(`Validation Error: ${errMsg}`, 400);
    }

    const result = await MaterialLeadService.addRequirement(id, validated.data, user?.id);
    return successResponse(result, { message: "Material Requirement item added" }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
