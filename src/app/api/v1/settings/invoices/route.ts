import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { SettingsService } from "@/modules/settings/settings.service";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError } from "@/lib/errors";

const INVOICE_SETTINGS_KEY = "business.invoice_configuration";

export async function GET(_req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    const settings = await SettingsService.getInvoiceConfiguration();
    return successResponse(settings || {});
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    const body = await req.json();
    const updated = await SettingsService.updateInvoiceConfiguration(
      body,
      session.userId
    );

    return successResponse(updated);
  } catch (err) {
    return errorResponse(err);
  }
}
