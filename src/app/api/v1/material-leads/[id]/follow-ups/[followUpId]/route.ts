import { NextRequest } from "next/server";
import { MaterialLeadService } from "@/modules/material-leads/material-lead.service";
import { successResponse, errorResponse, ApiResponse } from "@/lib/response";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; followUpId: string }> }
) {
  try {
    const { followUpId } = await params;
    const user = await getCurrentUser();
    const body = await req.json();

    const outcomeNotes = body.outcomeNotes || body.notes || "Follow-up completed";
    const result = await MaterialLeadService.completeFollowUp(followUpId, outcomeNotes, user?.id);
    return successResponse(result, { message: "Follow-up completed" });
  } catch (error) {
    return errorResponse(error);
  }
}
