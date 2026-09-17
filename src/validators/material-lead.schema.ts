import { z } from "zod";

export const MATERIAL_LEAD_STATUSES = [
  "NEW",
  "NOT_CONTACTED",
  "CONTACTED",
  "MATERIAL_REQUIRED",
  "REQUIREMENT_DISCUSSED",
  "QUOTATION_IN_PROGRESS",
  "QUOTATION_GENERATED",
  "QUOTATION_SENT",
  "WON",
  "LOST",
  "ORDER_PLACED",
  "VENDOR_REQUEST",
  "VENDOR_ACCEPTED",
  "VENDOR_REJECTED",
  "ORDER_CONFIRMED",
  "MATERIALS_ORDER",
  "ORDER_COMPLETED",
  "ON_HOLD",
  "CANCELLED",
] as const;

export const MATERIAL_LEAD_SOURCES = [
  "WEBSITE",
  "INSTAGRAM",
  "WHATSAPP",
  "REFERRAL",
  "WALK_IN",
  "PHONE_CALL",
  "OTHER",
] as const;

export const materialRequirementItemSchema = z.object({
  id: z.string().optional(),
  materialName: z.string().min(1, "Material name is required"),
  category: z.string().default("General"),
  quantity: z.number().positive("Quantity must be greater than 0").default(1),
  unit: z.string().default("Units"),
  specifications: z.string().optional().or(z.literal("")).nullable(),
  additionalRequirements: z.string().optional().or(z.literal("")).nullable(),
  notes: z.string().optional().or(z.literal("")).nullable(),
});

export const materialFollowUpSchema = z.object({
  id: z.string().optional(),
  followUpDate: z.string().or(z.date()),
  followUpTime: z.string().optional().or(z.literal("")).nullable(),
  notes: z.string().min(1, "Follow-up notes are required"),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).default("PENDING"),
  outcomeNotes: z.string().optional().or(z.literal("")).nullable(),
  assignedToId: z.string().optional().or(z.literal("")).nullable(),
});

export const createMaterialLeadSchema = z.object({
  customerName: z.string().min(2, "Customer name must be at least 2 characters"),
  primaryContact: z.string().min(7, "Primary contact number is required"),
  secondaryContact: z.string().optional().or(z.literal("")).nullable(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")).nullable(),
  location: z.string().min(2, "Project location is required"),
  source: z.string().default("WEBSITE"),
  sourceKey: z.string().optional(),
  customSource: z.string().optional().or(z.literal("")).nullable(),
  status: z.string().default("NEW"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  notes: z.string().optional().or(z.literal("")).nullable(),
  assignedToId: z.string().optional().or(z.literal("")).nullable(),
  requirements: z.array(materialRequirementItemSchema).optional().default([]),
});

export const updateMaterialLeadSchema = createMaterialLeadSchema.partial().extend({
  status: z.string().optional(),
  lossReason: z.string().optional().or(z.literal("")).nullable(),
});

export const updateContactStatusSchema = z.object({
  status: z.enum(["CONTACTED", "NOT_CONTACTED"]),
  notes: z.string().optional().or(z.literal("")).nullable(),
  followUpDate: z.string().optional().or(z.literal("")).nullable(),
  followUpTime: z.string().optional().or(z.literal("")).nullable(),
});

export const newVendorDataSchema = z.object({
  name: z.string().min(2, "Vendor name is required"),
  phone: z.string().min(7, "Vendor phone is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")).nullable(),
  address: z.string().optional().or(z.literal("")).nullable(),
  gstin: z.string().optional().or(z.literal("")).nullable(),
  categoryKey: z.string().default("MATERIALS"),
  contactPerson: z.string().optional().or(z.literal("")).nullable(),
});

export const placeMaterialOrderSchema = z.object({
  leadId: z.string().optional(),
  quotationId: z.string().optional().or(z.literal("")).nullable(),
  vendorId: z.string().optional().or(z.literal("")).nullable(),
  isNewVendor: z.boolean().default(false),
  newVendorData: newVendorDataSchema.optional().nullable(),
  finalVendorOrderAmount: z.number().positive("Amount must be greater than 0").default(1),
  expectedDeliveryDate: z.string().optional().or(z.literal("")).nullable(),
  notes: z.string().optional().or(z.literal("")).nullable(),
  materials: z.array(materialRequirementItemSchema).optional().default([]),
});

export const vendorRequestSchema = z.object({
  orderId: z.string().optional(),
  vendorId: z.string().optional().or(z.literal("")).nullable(),
  isNewVendor: z.boolean().default(false),
  newVendorData: newVendorDataSchema.optional().nullable(),
  notes: z.string().optional().or(z.literal("")).nullable(),
});

export const vendorResponseSchema = z.object({
  response: z.enum(["ACCEPTED", "REJECTED"]),
  rejectionReason: z.string().optional().or(z.literal("")).nullable(),
  notes: z.string().optional().or(z.literal("")).nullable(),
  negotiatedAmount: z.number().optional().nullable(),
});

/**
 * Validates website Material Request / Unlock Catalog Form Submissions
 */
export const websiteMaterialEnquirySchema = z.object({
  customerName: z.string().optional(),
  fullName: z.string().optional(),
  name: z.string().optional(),
  contactNumber1: z.string().optional(),
  primaryContact: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  contactNumber2: z.string().optional().or(z.literal("")).nullable(),
  secondaryContact: z.string().optional().or(z.literal("")).nullable(),
  alternatePhone: z.string().optional().or(z.literal("")).nullable(),
  emailAddress: z.string().optional(),
  email: z.string().optional(),
  projectLocation: z.string().optional(),
  location: z.string().optional(),
  source: z.string().default("Website"),
  customSource: z.string().optional().or(z.literal("")).nullable(),
  materialPreferences: z.string().optional().or(z.literal("")).nullable(),
  notes: z.string().optional().or(z.literal("")).nullable(),
  requirements: z.array(materialRequirementItemSchema).optional().default([]),
}).transform((data) => {
  const resolvedName = (data.customerName || data.fullName || data.name || "").trim();
  const resolvedPhone1 = (data.contactNumber1 || data.primaryContact || data.phone || data.mobile || "").trim();
  const resolvedPhone2 = (data.contactNumber2 || data.secondaryContact || data.alternatePhone || "").trim() || null;
  const resolvedEmail = (data.emailAddress || data.email || "").trim();
  const resolvedLocation = (data.projectLocation || data.location || "").trim();

  if (resolvedName.length < 2) {
    throw new Error("Customer Name is required and must be at least 2 characters");
  }
  if (resolvedPhone1.length < 7) {
    throw new Error("Valid Primary Contact Number (Contact Number 1) is required");
  }
  if (resolvedEmail.length > 0 && !resolvedEmail.includes("@")) {
    throw new Error("Valid email address is required");
  }
  if (resolvedLocation.length < 2) {
    throw new Error("Project Location is required and must be at least 2 characters");
  }

  // Handle Global Others custom source
  let resolvedSource = data.source || "Website";
  if (data.customSource && (resolvedSource.toUpperCase() === "OTHER" || resolvedSource.toUpperCase() === "OTHERS")) {
    resolvedSource = data.customSource.trim();
  }

  return {
    customerName: resolvedName,
    primaryContact: resolvedPhone1,
    secondaryContact: resolvedPhone2,
    email: resolvedEmail || null,
    location: resolvedLocation,
    source: resolvedSource,
    customSource: data.customSource || null,
    materialPreferences: data.materialPreferences || null,
    notes: data.notes || data.materialPreferences || null,
    requirements: data.requirements || [],
  };
});

export type MaterialRequirementItem = z.infer<typeof materialRequirementItemSchema>;
export type MaterialFollowUpItem = z.infer<typeof materialFollowUpSchema>;
export type CreateMaterialLeadInput = z.infer<typeof createMaterialLeadSchema>;
export type UpdateMaterialLeadInput = z.infer<typeof updateMaterialLeadSchema>;
export type UpdateContactStatusInput = z.infer<typeof updateContactStatusSchema>;
export type PlaceMaterialOrderInput = z.infer<typeof placeMaterialOrderSchema>;
export type VendorRequestInput = z.infer<typeof vendorRequestSchema>;
export type VendorResponseInput = z.infer<typeof vendorResponseSchema>;
export type WebsiteMaterialEnquiryInput = z.infer<typeof websiteMaterialEnquirySchema>;
