import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { CalendarService } from "@/modules/calendar/calendar.service";
import { createCalendarEventSchema } from "@/validators/calendar.schema";
import { successResponse, errorResponse, ApiResponse } from "@/lib/response";
import { AuthError, ValidationError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);

    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : defaultStart;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : defaultEnd;

    const category = searchParams.get("category") || "ALL";
    const status = searchParams.get("status") || "ALL";
    const search = searchParams.get("search") || undefined;

    const [events, kpi] = await Promise.all([
      CalendarService.getCalendarEvents({
        startDate,
        endDate,
        category,
        status,
        search,
      }),
      CalendarService.getCalendarKPIs(),
    ]);

    return successResponse(events, {
      kpi,
      totalEvents: events.length,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      category,
      status,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    const body = await req.json();
    const validated = createCalendarEventSchema.safeParse(body);
    if (!validated.success) {
      const errMsg = validated.error.errors.map((e) => e.message).join(", ");
      return ApiResponse.error(`Validation Error: ${errMsg}`, 400);
    }

    const result = await CalendarService.createCalendarEvent(validated.data, session.userId);
    return successResponse(result, { message: "Calendar event scheduled successfully" }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}

