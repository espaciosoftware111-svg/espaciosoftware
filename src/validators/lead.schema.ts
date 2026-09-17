import { z } from "zod";

export const LEAD_STAGES = [
  "NEW",
  "NOT_CONTACTED",
  "CONTACTED",
  "FOLLOW_UP_SCHEDULED",
  "SITE_VISIT_SCHEDULED",
  "SITE_VISIT_COMPLETED",
  "QUOTATION_IN_PROGRESS",
  "QUOTATION_SENT",
  "NEGOTIATION",
  "WON",
  "PROJECT_CREATED",
  "LOST",
] as const;

export const LEAD_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const LOSS_REASONS = [
  "BUDGET",
  "COMPETITOR",
  "NOT_INTERESTED",
  "TIMING",
  "UNREACHABLE",
  "PROJECT_CANCELLED",
  "NOT_SUITABLE",
  "OTHER",
] as const;

export const FOLLOW_UP_TYPES = [
  "CALL",
  "WHATSAPP",
  "EMAIL",
  "MEETING",
  "SITE_VISIT",
  "OTHER",
] as const;

export const FOLLOW_UP_STATUSES = [
  "PENDING",
  "COMPLETED",
  "MISSED",
  "CANCELLED",
] as const;

export const SITE_VISIT_STATUSES = [
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
  "MISSED",
] as const;

export const createLeadSchema = z.object({
  clientName: z.string().min(2, "Customer name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")).nullable(),
  alternatePhone: z.string().optional().or(z.literal("")).nullable(),
  propertyType: z.string().optional().or(z.literal("")),
  propertyTypeKey: z.string().optional().or(z.literal("")),
  customPropertyType: z.string().optional().or(z.literal("")).nullable(),
  propertyLocation: z.string().optional().or(z.literal("")).nullable(),
  location: z.string().optional().or(z.literal("")).nullable(),
  propertySize: z.string().optional().or(z.literal("")).nullable(),
  spaces: z.array(z.string()).optional(),
  customSpace: z.string().optional().or(z.literal("")).nullable(),
  budget: z.number().nonnegative("Budget cannot be negative").optional().nullable(),
  estimatedBudget: z.number().nonnegative().optional().nullable(),
  requirement: z.string().optional().or(z.literal("")).nullable(),
  requirementType: z.string().optional().or(z.literal("")).nullable(),
  customRequirement: z.string().optional().or(z.literal("")).nullable(),
  customerStage: z.string().optional().or(z.literal("")).nullable(),
  specificRequirements: z.string().optional().or(z.literal("")).nullable(),
  source: z.string().default("WEBSITE").optional(),
  sourceKey: z.string().optional(),
  customSource: z.string().optional().or(z.literal("")).nullable(),
  priority: z.enum(LEAD_PRIORITIES).default("MEDIUM").optional(),
  assignedToId: z.string().optional().or(z.literal("")).nullable(),
  tags: z.string().optional().or(z.literal("")).nullable(),
  notes: z.string().optional().or(z.literal("")).nullable(),
  clientId: z.string().uuid().optional().nullable(),
  customFields: z.record(z.unknown()).optional(),
  websiteSubmission: z.record(z.unknown()).optional(),
});

export const websiteEnquirySchema = z.object({
  fullName: z.string().min(2, "Full Name is required and must be at least 2 characters").optional(),
  name: z.string().optional(),
  clientName: z.string().optional(),
  mobileNumber: z.string().optional(),
  phoneNumber: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  emailAddress: z.string().optional(),
  email: z.string().optional(),
  requirementType: z.string().optional().default("Turnkey Interiors"),
  requirement: z.string().optional(),
  customRequirement: z.string().optional().or(z.literal("")).nullable(),
  propertyType: z.string().optional().default("Apartment"),
  customPropertyType: z.string().optional().or(z.literal("")).nullable(),
  spaces: z.union([z.array(z.string()), z.string()]).optional().default([]),
  customSpace: z.string().optional().or(z.literal("")).nullable(),
  projectLocation: z.string().optional(),
  location: z.string().optional(),
  propertySize: z.string().optional().or(z.literal("")).nullable(),
  customerStage: z.string().optional().or(z.literal("")).nullable(),
  specificRequirements: z.string().optional().or(z.literal("")).nullable(),
  source: z.string().default("WEBSITE"),
}).transform((data) => {
  const resolvedFullName = (data.fullName || data.name || data.clientName || "").trim();
  const resolvedMobile = (data.mobileNumber || data.phoneNumber || data.phone || data.mobile || "").trim();
  const resolvedEmail = (data.emailAddress || data.email || "").trim();
  const resolvedLocation = (data.projectLocation || data.location || "").trim();
  const resolvedRequirement = (data.requirementType || data.requirement || "Turnkey Interiors").trim();
  const resolvedSpaces = Array.isArray(data.spaces) ? data.spaces : (data.spaces ? [data.spaces] : []);

  if (resolvedFullName.length < 2) {
    throw new Error("Full Name is required and must be at least 2 characters");
  }
  if (resolvedMobile.length < 7) {
    throw new Error("Valid mobile/phone number is required");
  }
  if (!resolvedEmail.includes("@")) {
    throw new Error("Valid email address is required");
  }
  if (resolvedLocation.length < 2) {
    throw new Error("Project Location is required and must be at least 2 characters");
  }

  return {
    fullName: resolvedFullName,
    mobileNumber: resolvedMobile,
    emailAddress: resolvedEmail,
    requirementType: resolvedRequirement,
    customRequirement: data.customRequirement || null,
    propertyType: data.propertyType || "Apartment",
    customPropertyType: data.customPropertyType || null,
    spaces: resolvedSpaces,
    customSpace: data.customSpace || null,
    projectLocation: resolvedLocation,
    propertySize: data.propertySize || null,
    customerStage: data.customerStage || "Ready To Start",
    specificRequirements: data.specificRequirements || null,
    source: data.source || "WEBSITE",
  };
});

export type WebsiteEnquiryInput = z.infer<typeof websiteEnquirySchema>;
export type CreateLeadInput = z.input<typeof createLeadSchema>;

export const updateLeadSchema = createLeadSchema.partial();

export const changeStatusSchema = z.object({
  status: z.string().min(1, "Status key is required"),
  lossReason: z.string().optional().nullable(),
  reopenReason: z.string().optional().nullable(),
  quotationId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const scheduleFollowUpSchema = z.object({
  scheduledAt: z.string().or(z.date()).optional(),
  followUpDate: z.string().or(z.date()).optional(),
  type: z.enum(FOLLOW_UP_TYPES).default("CALL"),
  notes: z.string().min(1, "Follow-up notes are required"),
  assignedToId: z.string().optional().nullable(),
  reminderMinutesBefore: z.number().int().nonnegative().optional(),
});

export const completeFollowUpSchema = z.object({
  outcomeNotes: z.string().min(1, "Outcome notes are required"),
  nextFollowUpDate: z.string().or(z.date()).optional().nullable(),
  nextFollowUpType: z.enum(FOLLOW_UP_TYPES).optional().nullable(),
  nextFollowUpNotes: z.string().optional().nullable(),
});

export const scheduleSiteVisitSchema = z.object({
  visitDate: z.string().or(z.date()),
  location: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const completeSiteVisitSchema = z.object({
  outcomeNotes: z.string().min(1, "Outcome notes are required"),
});

export const linkClientSchema = z.object({
  clientId: z.string().uuid("Valid client ID is required"),
});

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;
export type ScheduleFollowUpInput = z.infer<typeof scheduleFollowUpSchema>;
export type CompleteFollowUpInput = z.infer<typeof completeFollowUpSchema>;
export type ScheduleSiteVisitInput = z.infer<typeof scheduleSiteVisitSchema>;
export type CompleteSiteVisitInput = z.infer<typeof completeSiteVisitSchema>;
export type LinkClientInput = z.infer<typeof linkClientSchema>;
