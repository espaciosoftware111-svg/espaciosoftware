import { NextRequest } from "next/server";
import { ProjectService } from "@/modules/projects/project.service";
import { getCurrentUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/response";
import { ValidationError } from "@/lib/errors";
import { freezeProjectsSchema } from "@/validators/project.schema";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    const body = await req.json();

    const parsed = freezeProjectsSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(new ValidationError(parsed.error.errors[0].message));
    }

    const result = await ProjectService.freezeMultipleProjects(
      parsed.data.projectIds,
      parsed.data.freeze,
      parsed.data.reason,
      user?.id
    );

    return successResponse(result, { message: result.message });
  } catch (error: any) {
    return errorResponse(error);
  }
}
