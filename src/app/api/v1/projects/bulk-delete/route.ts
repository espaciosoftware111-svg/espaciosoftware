import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { ProjectService } from "@/modules/projects/project.service";
import { deleteMultipleProjectsSchema } from "@/validators/project.schema";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError, ValidationError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "projects:delete", "DELETE_PROJECTS_BULK");

    const body = await req.json().catch(() => ({}));
    const parsed = deleteMultipleProjectsSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.errors[0]?.message || "Invalid payload for multiple projects deletion",
        parsed.error.format()
      );
    }

    const result = await ProjectService.deleteMultipleProjects(
      parsed.data.projectIds,
      session.userId,
      parsed.data.adminPassword
    );

    return successResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest) {
  return POST(req);
}
