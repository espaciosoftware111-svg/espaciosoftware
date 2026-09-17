import { NextRequest } from "next/server";
import { MaterialLeadService } from "@/modules/material-leads/material-lead.service";
import { createMaterialLeadSchema } from "@/validators/material-lead.schema";
import { successResponse, errorResponse, ApiResponse } from "@/lib/response";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const url = new URL(req.url);

    const params = {
      search: url.searchParams.get("search") || undefined,
      status: url.searchParams.get("status") || undefined,
      source: url.searchParams.get("source") || undefined,
      location: url.searchParams.get("location") || undefined,
      dateFrom: url.searchParams.get("dateFrom") || undefined,
      dateTo: url.searchParams.get("dateTo") || undefined,
      page: parseInt(url.searchParams.get("page") || "1", 10),
      limit: parseInt(url.searchParams.get("limit") || "20", 10),
    };

    const result = await MaterialLeadService.getMaterialLeads(params, user?.id);
    return successResponse(result.items, {
      pagination: result.pagination,
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
      totalPages: result.pagination.totalPages,
      kpi: result.pagination.kpi,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const validated = createMaterialLeadSchema.safeParse(body);
    if (!validated.success) {
      const errMsg = validated.error.errors.map((e) => e.message).join(", ");
      return ApiResponse.error(`Validation Error: ${errMsg}`, 400);
    }

    const result = await MaterialLeadService.createMaterialLead(validated.data, user?.id);
    return successResponse(result.materialLead, { message: `Material Lead ${result.referenceNo} registered successfully` }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
