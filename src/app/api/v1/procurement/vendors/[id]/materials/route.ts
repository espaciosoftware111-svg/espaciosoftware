import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { VendorService } from "@/modules/vendors/vendor.service";
import { addVendorMaterialSchema, updateVendorMaterialSchema } from "@/validators/vendor.schema";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError, ValidationError } from "@/lib/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "vendors:read", "GET_VENDOR_MATERIALS");

    const { id } = await params;
    const materials = await VendorService.getVendorMaterials(id);

    return successResponse(materials);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "vendors:write", "ADD_VENDOR_MATERIAL");

    const { id } = await params;
    const body = await req.json();
    const parsed = addVendorMaterialSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Invalid vendor material payload", parsed.error.format());
    }

    const material = await VendorService.addVendorMaterial(id, parsed.data, session.userId);

    return successResponse(material, undefined, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "vendors:write", "UPDATE_VENDOR_MATERIAL");

    const body = await req.json();
    const { vendorMaterialId, ...updateData } = body;
    if (!vendorMaterialId) {
      throw new ValidationError("vendorMaterialId is required for update");
    }

    const parsed = updateVendorMaterialSchema.safeParse(updateData);
    if (!parsed.success) {
      throw new ValidationError("Invalid vendor material update payload", parsed.error.format());
    }

    const updated = await VendorService.updateVendorMaterial(vendorMaterialId, parsed.data, session.userId);

    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "vendors:write", "DELETE_VENDOR_MATERIAL");

    const { searchParams } = new URL(req.url);
    const vendorMaterialId = searchParams.get("vendorMaterialId");
    if (!vendorMaterialId) {
      throw new ValidationError("vendorMaterialId query parameter is required");
    }

    const result = await VendorService.deleteVendorMaterial(vendorMaterialId, session.userId);

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
