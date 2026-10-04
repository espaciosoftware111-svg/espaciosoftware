import { z } from "zod";

export const QuotationStatusEnum = z.enum([
  "DRAFT",
  "INTERNAL_REVIEW",
  "READY_TO_SEND",
  "SENT",
  "NEGOTIATION",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
  "SUPERSEDED",
]);

export const QuotationUnitEnum = z.enum([
  "SQFT",
  "RFT",
  "NOS",
  "LUMPSUM",
  "SQMT",
  "SET",
  "RUNNING_METER",
]);

export const QuotationItemSchema = z.object({
  id: z.string().optional(),
  room: z.string().min(1, "Room/Area name is required").default("General"),
  category: z.string().min(1, "Category/Trade is required"),
  itemType: z.enum(["CUSTOM", "CATALOG"]).optional().default("CUSTOM"),
  materialId: z.string().optional().nullable(),
  itemDescription: z.string().min(1, "Item description is required"),
  specifications: z.string().optional().nullable(),
  length: z.number().positive().optional().nullable(),
  height: z.number().positive().optional().nullable(),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unitKey: z.string().min(1).default("NOS"),
  unitRate: z.number().min(0, "Unit rate cannot be negative"),
  internalCostRate: z.number().min(0).optional().nullable(),
  discountAmount: z.number().min(0).optional().default(0),
  sortOrder: z.number().int().optional().default(0),
});

export const QuotationTypeEnum = z.enum(["LEAD", "PROJECT", "MATERIAL"]);

export const CreateQuotationSchema = z.object({
  title: z.string().min(1).default("Interior Design & Execution Quotation"),
  customTitle: z.string().optional().nullable(),
  quotationType: QuotationTypeEnum.optional().default("LEAD"),
  showSignature: z.boolean().optional().default(true),
  advancePaid: z.number().min(0).optional().default(0),
  paymentType: z.string().optional().nullable(),
  previousPayments: z.number().min(0).optional().default(0),
  currentPayment: z.number().min(0).optional().default(0),
  leadId: z.string().optional().nullable().transform((v) => (v && v.trim() ? v : null)),
  projectId: z.string().optional().nullable().transform((v) => (v && v.trim() ? v : null)),
  clientId: z.string().optional().nullable().transform((v) => (v && v.trim() ? v : null)),
  validityDate: z.string().or(z.date()).optional().nullable(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).optional().nullable().or(z.literal("")).transform((v) => (v && v.trim() ? (v as "PERCENTAGE" | "FIXED") : null)),
  discountValue: z.number().min(0).optional().default(0),
  adjustmentAmount: z.number().optional().default(0),
  adjustmentReason: z.string().optional().nullable(),
  taxRate: z.number().min(0).max(100).optional().default(0),
  termsAndConditions: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  status: QuotationStatusEnum.optional().default("DRAFT"),
  clientSnapshot: z.string().optional().nullable(),
  items: z.array(QuotationItemSchema).min(1, "At least one BOQ line item is required"),
});

export const UpdateQuotationSchema = CreateQuotationSchema.partial().extend({
  items: z.array(QuotationItemSchema).optional(),
});

export const UpdateQuotationStatusSchema = z.object({
  status: QuotationStatusEnum,
  notes: z.string().optional().nullable(),
});

export const ApproveQuotationSchema = z.object({
  clientApprovedName: z.string().optional().nullable(),
  approvalNotes: z.string().optional().nullable(),
});

export const CreateRevisionSchema = z.object({
  notes: z.string().optional().nullable(),
});

export type QuotationItemInput = z.input<typeof QuotationItemSchema>;
export type CreateQuotationInput = z.input<typeof CreateQuotationSchema>;
export type UpdateQuotationInput = z.input<typeof UpdateQuotationSchema>;
export type UpdateQuotationStatusInput = z.infer<typeof UpdateQuotationStatusSchema>;
export type ApproveQuotationInput = z.infer<typeof ApproveQuotationSchema>;
export type CreateRevisionInput = z.infer<typeof CreateRevisionSchema>;
