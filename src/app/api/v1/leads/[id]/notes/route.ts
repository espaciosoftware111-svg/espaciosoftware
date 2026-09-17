import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { ActivityService } from "@/modules/activity/activity.service";
import { AuditService } from "@/modules/audit/audit.service";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError, ValidationError, NotFoundError } from "@/lib/errors";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "leads:write", "ADD_LEAD_NOTE");

    const { id } = await params;
    const body = await req.json();
    const { note, stage, type = "NOTE" } = body;

    if (!note || typeof note !== "string" || note.trim().length === 0) {
      throw new ValidationError("Note content is required");
    }

    const lead = await db.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundError("Lead not found");

    const activity = await ActivityService.record({
      userId: session.userId,
      entityType: "Lead",
      entityId: id,
      type,
      title: stage ? `Note on ${stage}` : "Lead Note Added",
      description: note.trim(),
      metadata: { stage: stage || lead.stage, addedBy: session.fullName },
    });

    await AuditService.logEvent({
      userId: session.userId,
      action: "LEAD_NOTE_ADDED",
      entityType: "Lead",
      entityId: id,
      newValues: { note: note.trim(), stage: stage || lead.stage },
    });

    return successResponse(activity, { message: "Note added successfully" });
  } catch (err) {
    return errorResponse(err);
  }
}
