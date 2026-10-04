import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { TrashService } from "@/modules/trash/trash.service";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError } from "@/lib/errors";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    const { id } = await params;
    const result = await TrashService.permanentlyDelete(id, session.userId);
    return successResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
