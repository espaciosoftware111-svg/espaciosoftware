import { z } from "zod";

export const materialsOrderItemSchema = z.object({
  materialName: z.string().min(1, "Material name is required"),
  category: z.string().optional().default("RAW_MATERIAL"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unitKey: z.string().min(1).default("NOS"),
  referencePrice: z.number().nonnegative().optional().default(0),
  notes: z.string().optional().nullable(),
});

export const createMaterialsOrderSchema = z.object({
  leadId: z.string().optional().nullable(),
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().min(5, "Customer phone is required"),
  customerEmail: z.string().email().optional().nullable().or(z.literal("")),
  customerAddress: z.string().optional().nullable(),
  quotationId: z.string().optional().nullable(),
  vendorId: z.string().min(1, "Vendor selection is required"),
  materials: z.array(materialsOrderItemSchema).min(1, "At least one material item is required"),
  // Manual Final Vendor Order Amount (Strict Rule: Manually entered, never auto-calculated)
  finalVendorOrderAmount: z.number().positive("Final Vendor Order Amount must be greater than 0"),
  notes: z.string().optional().nullable(),
  expectedDeliveryDate: z.string().optional().nullable(),
});

export const recordMaterialsOrderPaymentSchema = z.object({
  amount: z.number().positive("Payment amount must be greater than 0"),
  paymentMethod: z.string().default("BANK_TRANSFER"),
  paymentDate: z.coerce.date().optional(),
  referenceNoExt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const materialsOrderFilterSchema = z.object({
  search: z.string().optional(),
  customer: z.string().optional(),
  leadId: z.string().optional(),
  vendorId: z.string().optional(),
  material: z.string().optional(),
  materialStatus: z.enum(["Pending", "Received"]).optional(),
  paymentStatus: z.enum(["Unpaid", "Partial", "Paid"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type MaterialsOrderItem = z.infer<typeof materialsOrderItemSchema>;
export type CreateMaterialsOrderInput = z.infer<typeof createMaterialsOrderSchema>;
export type RecordMaterialsOrderPaymentInput = z.infer<typeof recordMaterialsOrderPaymentSchema>;
export type MaterialsOrderFilterParams = z.infer<typeof materialsOrderFilterSchema>;
