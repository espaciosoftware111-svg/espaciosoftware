import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { TrashService } from "@/modules/trash/trash.service";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await TrashService.getTrashItems({
      category,
      search,
      page,
      limit,
    });

    return successResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;

    const result = await TrashService.emptyTrash(category, session.userId);
    return successResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
