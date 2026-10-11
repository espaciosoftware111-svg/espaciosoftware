import { NextRequest } from "next/server";
import { LeadService } from "@/modules/leads/lead.service";
import { getCurrentUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/response";
import { ValidationError } from "@/lib/errors";
import { freezeLeadsSchema } from "@/validators/lead.schema";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    const body = await req.json();

    const parsed = freezeLeadsSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(new ValidationError(parsed.error.errors[0].message));
    }

    const result = await LeadService.freezeMultipleLeads(
      parsed.data.leadIds,
      parsed.data.freeze,
      parsed.data.reason,
      user?.id
    );

    return successResponse(result, { message: result.message });
  } catch (error: any) {
    return errorResponse(error);
  }
}
