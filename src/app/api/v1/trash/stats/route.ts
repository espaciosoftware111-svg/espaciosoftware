import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { TrashService } from "@/modules/trash/trash.service";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError } from "@/lib/errors";

export async function GET(_req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    const stats = await TrashService.getTrashStats();
    return successResponse(stats);
  } catch (err) {
    return errorResponse(err);
  }
}
