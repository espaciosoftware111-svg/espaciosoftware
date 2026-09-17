import { db } from "@/lib/db";
import { ValidationError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { AuditService } from "../audit/audit.service";
import { verifyPassword, hashPassword } from "@/lib/auth";

export interface FinancialSettingsData {
  currency: string;
  currencySymbol: string;
  decimalPrecision: number;
  financialYearStartMonth: number; // 4 = April
  financialYearEndMonth: number; // 3 = March
  defaultPaymentTermsDays: number;
  allowedPaymentMethods: string[];
}

export interface TaxSettingsData {
  gstin: string;
  businessState: string;
  businessStateCode: string;
  taxRegistrationType: "REGULAR" | "COMPOSITION";
  applicableGstRates: number[]; // [0, 5, 12, 18, 28]
  defaultGstRate: number;
  reverseChargeApplicable: boolean;
  eInvoicingEnabled: boolean;
  eWayBillEnabled: boolean;
}

export interface InvoiceSettingsData {
  prefix: string;
  numberFormat: string;
  defaultDueDays: number;
  defaultNotes: string;
  defaultFooter: string;
  templateName: string;
  showBankDetailsOnPdf: boolean;
  allowOverBilling: boolean;
}

export interface QuotationSettingsData {
  prefix: string;
  numberFormat: string;
  currency: string;
  currencySymbol: string;
  enableGst: boolean;
  defaultGstRate: number;
  defaultDiscountType: "PERCENTAGE" | "FIXED";
  defaultDiscountValue: number;
  defaultValidityDays: number;
  defaultTermsAndConditions: string;
  defaultFooter: string;
  templateName: string;
  enableStamp: boolean;
  stampImageUrl?: string;
  enableSignature: boolean;
  signatureImageUrl?: string;
  printIncludeSignature: boolean;
  whatsappIncludeSignature: boolean;
}

export interface PaymentTypeItem {
  key: string;
  label: string;
  description: string;
  isActive: boolean;
}

export interface PaymentMethodItem {
  key: string;
  label: string;
  isSystem: boolean;
  isActive: boolean;
}

export interface PaymentSettingsData {
  paymentTypes: PaymentTypeItem[];
  paymentMethods: PaymentMethodItem[];
  allowCustomMethods: boolean;
  defaultMethodKey: string;
  requireTransactionReference: boolean;
}

export interface ConfigOptionItem {
  key: string;
  name: string;
  isActive: boolean;
  displayOrder?: number;
  description?: string;
}

export interface LeadSettingsData {
  prefix: string;
  numberFormat: string;
  sources: ConfigOptionItem[];
  propertyTypes: ConfigOptionItem[];
  lossReasons: ConfigOptionItem[];
  allowOtherSources: boolean;
}

export interface ProjectCategoryItem {
  key: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface ProjectSettingsData {
  prefix: string;
  numberFormat: string;
  categories: ProjectCategoryItem[];
  defaultCategory: string;
  defaultTimelineDays: number;
}

export interface VendorSettingsData {
  categories: ConfigOptionItem[];
  vendorTypes: ConfigOptionItem[];
  materialCategories: ConfigOptionItem[];
}

export interface ExpenseCategoryItem {
  key: string;
  name: string;
  type: "PROJECT" | "BUSINESS" | "BOTH";
  isActive: boolean;
  displayOrder?: number;
}

export interface ExpenseSettingsData {
  categories: ExpenseCategoryItem[];
  requireReceiptAbove: number;
  defaultCategoryKey: string;
}

export interface WhatsAppConfigData {
  enabled: boolean;
  status: "CONNECTED" | "NOT_CONNECTED";
  phoneNumber: string;
  instanceId: string;
  apiUrl: string;
  defaultQuotationTemplate: string;
  autoSendUpdates: boolean;
}

export interface WebsiteLeadConfigData {
  enabled: boolean;
  status: "CONNECTED" | "READY";
  webhookUrl: string;
  apiKeyMasked: string;
  leadAutoAssign: boolean;
  lastLeadReceivedAt: string | null;
}

export interface GoogleSheetsConfigData {
  enabled: boolean;
  status: "CONNECTED" | "DISCONNECTED";
  spreadsheetId: string;
  sheetName: string;
  autoSyncIntervalMinutes: number;
  lastSyncAt: string | null;
  syncLeads: boolean;
  syncProjects: boolean;
  syncExpenses: boolean;
}

export interface SystemPreferencesData {
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  timeFormat: "12_HOUR" | "24_HOUR";
  currency: string;
  currencySymbol: string;
  timezone: string;
  language: string;
  tableDensity: "compact" | "normal" | "comfortable";
  recordsPerPage: number;
}

export interface PurchaseOrderSettingsData {
  prefix: string;
  numberFormat: string;
  defaultTermsAndConditions: string;
  defaultFooter: string;
  templateName: string;
}

export interface DocumentSettingsData {
  storageProvider: "LOCAL_DISK" | "GOOGLE_DRIVE" | "OFFSITE_S3";
  allowedFileTypes: string[];
  maxFileSizeMb: number;
  defaultVisibility: "INTERNAL" | "PUBLIC" | "RESTRICTED";
  autoVersionOnUpload: boolean;
  archiveRetentionDays: number;
}

export interface SecuritySettingsData {
  sessionTimeoutMinutes: number;
  passwordMinLength: number;
  passwordRequireSpecialChar: boolean;
  passwordRequireNumber: boolean;
  maxFailedLoginAttempts: number;
  lockoutDurationMinutes: number;
  mfaRequiredForAdmins: boolean;
}

export interface UserModuleVisibilityMap {
  userId: string;
  visibleModules: string[];
}

export class SettingsService {
  /**
   * Get a single setting by key
   */
  public static async get(key: string, defaultValue = ""): Promise<string> {
    const setting = await db.setting.findUnique({ where: { key } });
    return setting?.value ?? defaultValue;
  }

  /**
   * Get all settings ordered by category
   */
  public static async getAll() {
    return db.setting.findMany({ orderBy: { category: "asc" } });
  }

  /**
   * Get all settings in a specific category
   */
  public static async getByCategory(category: string) {
    return db.setting.findMany({ where: { category }, orderBy: { key: "asc" } });
  }

  /**
   * Set or update a single setting with audit log
   */
  public static async set(key: string, value: string, category = "GENERAL", description?: string, userId?: string) {
    const existing = await db.setting.findUnique({ where: { key } });

    const setting = await db.setting.upsert({
      where: { key },
      update: { value, category, description },
      create: { key, value, category, description },
    });

    if (!existing || existing.value !== value) {
      await AuditService.logEvent({
        userId,
        action: "SETTINGS_UPDATED",
        entityType: "Setting",
        entityId: key,
        oldValues: existing ? { key, value: existing.value, category: existing.category } : null,
        newValues: { key, value, category },
      });
    }

    return setting;
  }

  public static async getBusinessPreferences() {
    const tax = await this.getTaxSettings();
    const inv = await this.getInvoiceSettings();
    const q = await this.getQuotationSettings();
    const fin = await this.getFinancialSettings();

    return {
      currency: `${fin.currency} (${fin.currencySymbol})`,
      dateFormat: "DD/MM/YYYY",
      timezone: "Asia/Kolkata (IST)",
      paymentTerms: `${fin.defaultPaymentTermsDays} Days`,
      quotationPrefix: q.prefix,
      invoicePrefix: inv.prefix,
      gstRate: tax.defaultGstRate,
    };
  }

  public static async updateBusinessPreferences(input: any, userId?: string) {
    if (input.currency) await this.set("business.currency", input.currency, "BUSINESS", "Default Currency", userId);
    if (input.paymentTerms) await this.set("business.paymentTerms", input.paymentTerms, "BUSINESS", "Default Payment Terms", userId);
    if (input.quotationPrefix) await this.updateQuotationSettings({ prefix: input.quotationPrefix }, userId);
    if (input.invoicePrefix) await this.updateInvoiceSettings({ prefix: input.invoicePrefix }, userId);
    if (input.gstRate !== undefined) await this.updateTaxSettings({ defaultGstRate: input.gstRate }, userId);
    return this.getBusinessPreferences();
  }

  public static async getProjectStageSettings() {
    const defaultStages = [
      { order: 1, name: "Confirmation Fee Paid", durationDays: 3, paymentMilestone: true, ownerRole: "SALES" },
      { order: 2, name: "Designing", durationDays: 7, paymentMilestone: false, ownerRole: "DESIGN" },
      { order: 3, name: "Designing Completed", durationDays: 2, paymentMilestone: false, ownerRole: "DESIGN" },
      { order: 4, name: "Material Selection", durationDays: 5, paymentMilestone: true, ownerRole: "PROJECT_MANAGER" },
      { order: 5, name: "Raw Material Ordered", durationDays: 4, paymentMilestone: false, ownerRole: "PROCUREMENT" },
      { order: 6, name: "Wood Work", durationDays: 14, paymentMilestone: false, ownerRole: "PROJECT_MANAGER" },
      { order: 7, name: "Wood Work Completed", durationDays: 2, paymentMilestone: false, ownerRole: "PROJECT_MANAGER" },
      { order: 8, name: "Laminates Ordered", durationDays: 3, paymentMilestone: false, ownerRole: "PROCUREMENT" },
      { order: 9, name: "Laminate Pasting", durationDays: 7, paymentMilestone: false, ownerRole: "PROJECT_MANAGER" },
      { order: 10, name: "Fitting Work Completed", durationDays: 5, paymentMilestone: false, ownerRole: "PROJECT_MANAGER" },
      { order: 11, name: "Quality Checks", durationDays: 2, paymentMilestone: false, ownerRole: "QUALITY" },
      { order: 12, name: "Handover", durationDays: 2, paymentMilestone: true, ownerRole: "PROJECT_MANAGER", completionReq: "Warranty Information Required" },
      { order: 13, name: "Project Completed", durationDays: 0, paymentMilestone: false, ownerRole: "LEADERSHIP" },
    ];

    const raw = await this.get("project.stages_config", "");
    if (!raw) return defaultStages;
    try {
      return JSON.parse(raw);
    } catch {
      return defaultStages;
    }
  }

  public static async updateProjectStageSettings(stages: any[], userId?: string) {
    const jsonStr = JSON.stringify(stages);
    await this.set("project.stages_config", jsonStr, "PROJECT", "Project Stage Workflow Configuration", userId);
    return stages;
  }

  // =========================================================================
  // 1. FINANCIAL SETTINGS
  // =========================================================================

  public static async getFinancialSettings(): Promise<FinancialSettingsData> {
    const raw = await this.get("finance.settings", "");
    const defaults: FinancialSettingsData = {
      currency: "INR",
      currencySymbol: "₹",
      decimalPrecision: 2,
      financialYearStartMonth: 4, // April
      financialYearEndMonth: 3, // March
      defaultPaymentTermsDays: 15,
      allowedPaymentMethods: ["BANK_TRANSFER", "UPI", "CASH", "CHEQUE", "CARD"],
    };

    if (raw) {
      try {
        return { ...defaults, ...JSON.parse(raw) };
      } catch {
        // fallback
      }
    }
    return defaults;
  }

  public static async updateFinancialSettings(input: Partial<FinancialSettingsData>, actorId?: string): Promise<FinancialSettingsData> {
    const existing = await this.getFinancialSettings();

    // Protection rule: Single-currency in V1. Prevent casual currency change.
    if (input.currency && input.currency !== "INR") {
      throw new ValidationError("ESPACIO ERP V1 supports Indian Rupee (INR / ₹) as the primary operating currency.");
    }

    if (input.decimalPrecision !== undefined && (input.decimalPrecision < 0 || input.decimalPrecision > 4)) {
      throw new ValidationError("Decimal precision must be between 0 and 4.");
    }

    const updated: FinancialSettingsData = {
      ...existing,
      ...input,
    };

    await this.set("finance.settings", JSON.stringify(updated), "FINANCE", "Company Financial and Currency Settings", actorId);
    return updated;
  }

  // =========================================================================
  // 2. TAX / GST SETTINGS
  // =========================================================================

  public static async getTaxSettings(): Promise<TaxSettingsData> {
    const raw = await this.get("tax.settings", "");
    const defaults: TaxSettingsData = {
      gstin: "29ABCDE1234F1ZH",
      businessState: "Karnataka",
      businessStateCode: "29",
      taxRegistrationType: "REGULAR",
      applicableGstRates: [0, 5, 12, 18, 28],
      defaultGstRate: 18,
      reverseChargeApplicable: false,
      eInvoicingEnabled: false,
      eWayBillEnabled: false,
    };

    if (raw) {
      try {
        return { ...defaults, ...JSON.parse(raw) };
      } catch {
        // fallback
      }
    }
    return defaults;
  }

  public static async updateTaxSettings(input: Partial<TaxSettingsData>, actorId?: string): Promise<TaxSettingsData> {
    const existing = await this.getTaxSettings();

    if (input.gstin !== undefined && input.gstin.trim() !== "") {
      const cleanGstin = input.gstin.trim().toUpperCase();
      if (cleanGstin.length !== 15) {
        throw new ValidationError("Invalid GSTIN format (must be 15 alphanumeric characters).");
      }
      input.gstin = cleanGstin;
    }

    if (input.defaultGstRate !== undefined && input.defaultGstRate < 0) {
      throw new ValidationError("Default GST rate cannot be negative.");
    }

    const updated: TaxSettingsData = {
      ...existing,
      ...input,
    };

    await this.set("tax.settings", JSON.stringify(updated), "TAX", "Central Tax and GST Rules Configuration", actorId);
    return updated;
  }

  // =========================================================================
  // 3. INVOICE SETTINGS
  // =========================================================================

  public static async getInvoiceSettings(): Promise<InvoiceSettingsData> {
    const raw = await this.get("invoice.settings", "");
    const defaults: InvoiceSettingsData = {
      prefix: "INV",
      numberFormat: "{PREFIX}-{YEAR}-{SEQ}",
      defaultDueDays: 15,
      defaultNotes: "Thank you for your business. Please remit payment via Bank Transfer or UPI.",
      defaultFooter: "ESPACIO Interior Solutions Pvt Ltd • 100 Feet Rd, Indiranagar, Bengaluru • contact@espacio.com",
      templateName: "STANDARD_COMMERCIAL",
      showBankDetailsOnPdf: true,
      allowOverBilling: false,
    };

    if (raw) {
      try {
        return { ...defaults, ...JSON.parse(raw) };
      } catch {
        // fallback
      }
    }
    return defaults;
  }

  public static async updateInvoiceSettings(input: Partial<InvoiceSettingsData>, actorId?: string): Promise<InvoiceSettingsData> {
    const existing = await this.getInvoiceSettings();

    if (input.prefix && !/^[A-Z0-9]{2,6}$/.test(input.prefix.toUpperCase())) {
      throw new ValidationError("Invoice prefix must be 2 to 6 alphanumeric characters.");
    }

    if (input.defaultDueDays !== undefined && input.defaultDueDays < 0) {
      throw new ValidationError("Default due days cannot be negative.");
    }

    const updated: InvoiceSettingsData = {
      ...existing,
      ...input,
      prefix: input.prefix ? input.prefix.toUpperCase() : existing.prefix,
    };

    await this.set("invoice.settings", JSON.stringify(updated), "INVOICE", "Invoice Numbering and Template Defaults", actorId);
    return updated;
  }

  // =========================================================================
  // 4. QUOTATION SETTINGS
  // =========================================================================

  public static async getQuotationSettings(): Promise<QuotationSettingsData> {
    const raw = await this.get("quotation.settings", "");
    const defaults: QuotationSettingsData = {
      prefix: "QT",
      numberFormat: "{PREFIX}-{YEAR}-{SEQ}",
      currency: "INR",
      currencySymbol: "₹",
      enableGst: true,
      defaultGstRate: 18,
      defaultDiscountType: "PERCENTAGE",
      defaultDiscountValue: 0,
      defaultValidityDays: 30,
      defaultTermsAndConditions: `1. 50% Advance on signing BOQ.\n2. 40% before dispatch of materials.\n3. 10% on handover sign-off.\n4. Design modifications post-approval will incur revision charges.\n5. Site readiness is client responsibility.`,
      defaultFooter: "ESPACIO Turnkey Interiors • Validity 30 Days from date of issuance.",
      templateName: "DETAILED_BOQ",
      enableStamp: true,
      stampImageUrl: "/brand/espacio-stamp.png",
      enableSignature: true,
      signatureImageUrl: "/brand/espacio-signature.png",
      printIncludeSignature: false,
      whatsappIncludeSignature: true,
    };

    if (raw) {
      try {
        return { ...defaults, ...JSON.parse(raw) };
      } catch {
        // fallback
      }
    }
    return defaults;
  }

  public static async updateQuotationSettings(input: Partial<QuotationSettingsData>, actorId?: string): Promise<QuotationSettingsData> {
    const existing = await this.getQuotationSettings();
    const updated: QuotationSettingsData = {
      ...existing,
      ...input,
      prefix: input.prefix ? input.prefix.toUpperCase() : existing.prefix,
    };

    await this.set("quotation.settings", JSON.stringify(updated), "QUOTATION", "Quotation Numbering, Stamp, Signature & Validity Terms Defaults", actorId);
    return updated;
  }

  // =========================================================================
  // 5. PAYMENT SETTINGS
  // =========================================================================

  public static async getPaymentSettings(): Promise<PaymentSettingsData> {
    const raw = await this.get("payment.settings", "");
    const defaults: PaymentSettingsData = {
      paymentTypes: [
        { key: "ADVANCE", label: "Advance Payment", description: "Initial commitment advance before project kick-off", isActive: true },
        { key: "MILESTONE", label: "Milestone Stage Payment", description: "Payment against completed project stage / milestone", isActive: true },
        { key: "PARTIAL", label: "Partial Payment", description: "Interim instalment towards outstanding balance", isActive: true },
        { key: "FINAL", label: "Final Payment", description: "Final settlement on project handover", isActive: true },
        { key: "RETENTION", label: "Retention / Warranty Holdback", description: "Security retention payable post warranty period", isActive: true },
      ],
      paymentMethods: [
        { key: "UPI", label: "UPI / QR Code", isSystem: true, isActive: true },
        { key: "BANK_TRANSFER", label: "Bank Transfer (NEFT / RTGS / IMPS)", isSystem: true, isActive: true },
        { key: "CHEQUE", label: "Bank Cheque / DD", isSystem: true, isActive: true },
        { key: "CASH", label: "Cash Payment", isSystem: true, isActive: true },
        { key: "CARD", label: "Debit / Credit Card", isSystem: true, isActive: true },
        { key: "OTHER", label: "Other (Manual Input)", isSystem: true, isActive: true },
      ],
      allowCustomMethods: true,
      defaultMethodKey: "BANK_TRANSFER",
      requireTransactionReference: false,
    };

    if (raw) {
      try {
        return { ...defaults, ...JSON.parse(raw) };
      } catch {
        // fallback
      }
    }
    return defaults;
  }

  public static async updatePaymentSettings(input: Partial<PaymentSettingsData>, actorId?: string): Promise<PaymentSettingsData> {
    const existing = await this.getPaymentSettings();
    const updated: PaymentSettingsData = {
      ...existing,
      ...input,
    };

    await this.set("payment.settings", JSON.stringify(updated), "FINANCE", "Payment Types, Methods & Verification Settings", actorId);
    return updated;
  }

  // =========================================================================
  // 6. LEAD CONFIGURATION & ID SETTINGS
  // =========================================================================

  public static async getLeadSettings(): Promise<LeadSettingsData> {
    const raw = await this.get("lead.settings", "");
    const dbSources = await db.leadSourceConfig.findMany({ orderBy: { displayOrder: "asc" } });
    const dbPropertyTypes = await db.propertyTypeConfig.findMany({ orderBy: { displayOrder: "asc" } });
    const dbLossReasons = await db.leadLossReasonConfig.findMany({ orderBy: { displayOrder: "asc" } });

    const defaultSources: ConfigOptionItem[] = dbSources.length > 0
      ? dbSources.map(s => ({ key: s.key, name: s.name, isActive: s.isActive, displayOrder: s.displayOrder }))
      : [
          { key: "WEBSITE", name: "Website & Direct Online", isActive: true, displayOrder: 1 },
          { key: "REFERRAL", name: "Client / Architect Referral", isActive: true, displayOrder: 2 },
          { key: "DIRECT_VISIT", name: "Direct Walk-in / Studio Visit", isActive: true, displayOrder: 3 },
          { key: "SOCIAL_MEDIA", name: "Social Media (Instagram / Meta)", isActive: true, displayOrder: 4 },
          { key: "PHONE_CALL", name: "Inbound Phone Call", isActive: true, displayOrder: 5 },
          { key: "OTHER", name: "Others (Manual Input)", isActive: true, displayOrder: 6 },
        ];

    const defaultPropertyTypes: ConfigOptionItem[] = dbPropertyTypes.length > 0
      ? dbPropertyTypes.map(p => ({ key: p.key, name: p.name, isActive: p.isActive, displayOrder: p.displayOrder }))
      : [
          { key: "APARTMENT_2BHK", name: "2BHK Apartment", isActive: true, displayOrder: 1 },
          { key: "APARTMENT_3BHK", name: "3BHK Apartment", isActive: true, displayOrder: 2 },
          { key: "APARTMENT_4BHK", name: "4BHK Apartment / Penthouse", isActive: true, displayOrder: 3 },
          { key: "VILLA", name: "Independent Villa / Bungalow", isActive: true, displayOrder: 4 },
          { key: "COMMERCIAL_OFFICE", name: "Commercial Office Space", isActive: true, displayOrder: 5 },
          { key: "RETAIL_SHOWROOM", name: "Retail Showroom / Store", isActive: true, displayOrder: 6 },
          { key: "OTHER", name: "Others (Manual Input)", isActive: true, displayOrder: 7 },
        ];

    const defaultLossReasons: ConfigOptionItem[] = dbLossReasons.length > 0
      ? dbLossReasons.map(r => ({ key: r.key, name: r.name, isActive: r.isActive, displayOrder: r.displayOrder }))
      : [
          { key: "BUDGET_MISMATCH", name: "Budget Out of Range", isActive: true },
          { key: "TIMELINE_MISMATCH", name: "Timeline Not Viable", isActive: true },
          { key: "COMPETITOR_CHOSEN", name: "Selected Competitor", isActive: true },
          { key: "DROPPED_PLAN", name: "Client Postponed / Dropped Plan", isActive: true },
          { key: "UNRESPONSIVE", name: "Client Unresponsive", isActive: true },
          { key: "OTHER", name: "Other Reason", isActive: true },
        ];

    const defaults: LeadSettingsData = {
      prefix: "LD",
      numberFormat: "{PREFIX}-{YEAR}-{SEQ}",
      sources: defaultSources,
      propertyTypes: defaultPropertyTypes,
      lossReasons: defaultLossReasons,
      allowOtherSources: true,
    };

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return {
          ...defaults,
          ...parsed,
          sources: parsed.sources || defaultSources,
          propertyTypes: parsed.propertyTypes || defaultPropertyTypes,
          lossReasons: parsed.lossReasons || defaultLossReasons,
        };
      } catch {
        // fallback
      }
    }
    return defaults;
  }

  public static async updateLeadSettings(input: Partial<LeadSettingsData>, actorId?: string): Promise<LeadSettingsData> {
    const existing = await this.getLeadSettings();
    const updated: LeadSettingsData = {
      ...existing,
      ...input,
      prefix: input.prefix ? input.prefix.toUpperCase() : existing.prefix,
    };

    // Synchronize to leadSourceConfig database records for backward compatibility
    if (input.sources && input.sources.length > 0) {
      for (const src of input.sources) {
        await db.leadSourceConfig.upsert({
          where: { key: src.key },
          update: { name: src.name, isActive: src.isActive, displayOrder: src.displayOrder || 0 },
          create: { key: src.key, name: src.name, isActive: src.isActive, displayOrder: src.displayOrder || 0 },
        });
      }
    }

    await this.set("lead.settings", JSON.stringify(updated), "CRM", "Lead Numbering, Sources & Custom Options", actorId);
    return updated;
  }

  // =========================================================================
  // 7. PROJECT CONFIGURATION & ID SETTINGS
  // =========================================================================

  public static async getProjectSettings(): Promise<ProjectSettingsData> {
    const raw = await this.get("project.settings", "");
    const defaults: ProjectSettingsData = {
      prefix: "PRJ",
      numberFormat: "{PREFIX}-{YEAR}-{SEQ}",
      categories: [
        { key: "RESIDENTIAL_TURNKEY", name: "Residential Turnkey Interior", description: "Full interior design and execution for residential homes", isActive: true },
        { key: "MODULAR_KITCHEN_WARDROBE", name: "Modular Kitchen & Wardrobes", description: "Modular cabinetry and woodworking only", isActive: true },
        { key: "COMMERCIAL_FITOUT", name: "Commercial & Office Fitout", description: "Corporate office spaces and commercial fitouts", isActive: true },
        { key: "RENOVATION", name: "Home Renovation & Remodel", description: "Structural and aesthetic renovation of existing properties", isActive: true },
        { key: "CONSULTATION_DESIGN_ONLY", name: "Design & Consultation Only", description: "3D visualisations, working drawings and BOQ design only", isActive: true },
      ],
      defaultCategory: "RESIDENTIAL_TURNKEY",
      defaultTimelineDays: 45,
    };

    if (raw) {
      try {
        return { ...defaults, ...JSON.parse(raw) };
      } catch {
        // fallback
      }
    }
    return defaults;
  }

  public static async updateProjectSettings(input: Partial<ProjectSettingsData>, actorId?: string): Promise<ProjectSettingsData> {
    const existing = await this.getProjectSettings();
    const updated: ProjectSettingsData = {
      ...existing,
      ...input,
      prefix: input.prefix ? input.prefix.toUpperCase() : existing.prefix,
    };

    await this.set("project.settings", JSON.stringify(updated), "PROJECT", "Project Numbering, Categories & Workflow Defaults", actorId);
    return updated;
  }

  // =========================================================================
  // 8. VENDOR & MATERIAL CATEGORY SETTINGS
  // =========================================================================

  public static async getVendorSettings(): Promise<VendorSettingsData> {
    const raw = await this.get("vendor.settings", "");
    const dbVendorCategories = await db.vendorCategoryConfig.findMany({ orderBy: { displayOrder: "asc" } });
    const dbMaterialCategories = await db.materialCategoryConfig.findMany({ orderBy: { displayOrder: "asc" } });

    const defaultCategories: ConfigOptionItem[] = dbVendorCategories.length > 0
      ? dbVendorCategories.map(c => ({ key: c.key, name: c.name, isActive: c.isActive, displayOrder: c.displayOrder }))
      : [
          { key: "PLYWOOD_LAMINATE", name: "Plywood & Laminate Suppliers", isActive: true },
          { key: "HARDWARE_FITTINGS", name: "Hardware & Architectural Fittings", isActive: true },
          { key: "GLASS_MIRROR", name: "Glass & Aluminium Fabricators", isActive: true },
          { key: "PAINT_POLISH", name: "Paint, PU & Polish Contractors", isActive: true },
          { key: "ELECTRICAL_LIGHTING", name: "Electrical & Lighting Vendors", isActive: true },
          { key: "CIVIL_PLUMBING", name: "Civil & Plumbing Contractors", isActive: true },
          { key: "FABRICATION_METAL", name: "Metal & CNC Fabrication", isActive: true },
          { key: "SOFT_FURNISHING", name: "Curtains, Wallpaper & Furnishings", isActive: true },
          { key: "OTHER", name: "Other Vendors / Specialized Services", isActive: true },
        ];

    const defaultMaterialCategories: ConfigOptionItem[] = dbMaterialCategories.length > 0
      ? dbMaterialCategories.map(m => ({ key: m.key, name: m.name, isActive: m.isActive, displayOrder: m.displayOrder }))
      : [
          { key: "WOOD_PLYWOOD", name: "Wood, Commercial Plywood & HDHMR", isActive: true },
          { key: "LAMINATE_VENEER", name: "Laminates, Veneers & Acrylic Sheets", isActive: true },
          { key: "HARDWARE", name: "Hinges, Channels, Locks & Handles", isActive: true },
          { key: "GLASS", name: "Toughened Glass, Mirrors & Profiles", isActive: true },
          { key: "PAINT", name: "Primers, Emulsions, PU & Melamine Polish", isActive: true },
          { key: "LABOUR", name: "Carpentry, Electrical & Installation Labour", isActive: true },
          { key: "ADHESIVES_SEALANTS", name: "Adhesives, Silicon & Fasteners", isActive: true },
          { key: "OTHER", name: "Other Consumables", isActive: true },
        ];

    const defaultTypes: ConfigOptionItem[] = [
      { key: "SUPPLIER", name: "Raw Material Supplier", isActive: true },
      { key: "SUBCONTRACTOR", name: "Execution Subcontractor", isActive: true },
      { key: "SERVICE_PROVIDER", name: "Specialized Service Provider", isActive: true },
      { key: "WHOLESALER", name: "Authorized Wholesaler / Distributor", isActive: true },
      { key: "OEM_MANUFACTURER", name: "OEM Brand Manufacturer", isActive: true },
    ];

    const defaults: VendorSettingsData = {
      categories: defaultCategories,
      vendorTypes: defaultTypes,
      materialCategories: defaultMaterialMaterialOr(defaultMaterialCategories),
    };

    function defaultMaterialMaterialOr(cats: ConfigOptionItem[]) {
      return cats;
    }

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return {
          ...defaults,
          ...parsed,
          categories: parsed.categories || defaultCategories,
          vendorTypes: parsed.vendorTypes || defaultTypes,
          materialCategories: parsed.materialCategories || defaultMaterialCategories,
        };
      } catch {
        // fallback
      }
    }
    return defaults;
  }

  public static async updateVendorSettings(input: Partial<VendorSettingsData>, actorId?: string): Promise<VendorSettingsData> {
    const existing = await this.getVendorSettings();
    const updated: VendorSettingsData = {
      ...existing,
      ...input,
    };

    if (input.categories && input.categories.length > 0) {
      for (const cat of input.categories) {
        await db.vendorCategoryConfig.upsert({
          where: { key: cat.key },
          update: { name: cat.name, isActive: cat.isActive },
          create: { key: cat.key, name: cat.name, isActive: cat.isActive, displayOrder: cat.displayOrder || 0 },
        });
      }
    }

    await this.set("vendor.settings", JSON.stringify(updated), "PROCUREMENT", "Vendor & Material Categories Configuration", actorId);
    return updated;
  }

  // =========================================================================
  // 9. EXPENSE CATEGORY SETTINGS
  // =========================================================================

  public static async getExpenseSettings(): Promise<ExpenseSettingsData> {
    const raw = await this.get("expense.settings", "");
    const dbCategories = await db.expenseCategoryConfig.findMany({ orderBy: { displayOrder: "asc" } });

    const defaultCategories: ExpenseCategoryItem[] = dbCategories.length > 0
      ? dbCategories.map(c => ({ key: c.key, name: c.name, type: (c.type as "PROJECT" | "BUSINESS" | "BOTH") || "PROJECT", isActive: c.isActive, displayOrder: c.displayOrder }))
      : [
          { key: "PROJECT_MATERIAL", name: "Project Raw Materials & Consumables", type: "PROJECT", isActive: true, displayOrder: 1 },
          { key: "SITE_LABOUR", name: "Site Execution & Carpentry Labour", type: "PROJECT", isActive: true, displayOrder: 2 },
          { key: "TRANSPORT_LOGISTICS", name: "Material Transport & Cartage", type: "PROJECT", isActive: true, displayOrder: 3 },
          { key: "VENDOR_PAYMENT", name: "Subcontractor / Vendor Direct Payment", type: "PROJECT", isActive: true, displayOrder: 4 },
          { key: "PETTY_CASH", name: "Site Petty Cash & Incidentals", type: "BOTH", isActive: true, displayOrder: 5 },
          { key: "STUDIO_RENT", name: "Office / Studio Rent & Utilities", type: "BUSINESS", isActive: true, displayOrder: 6 },
          { key: "MARKETING_SALES", name: "Marketing, Ads & Client Acquisition", type: "BUSINESS", isActive: true, displayOrder: 7 },
          { key: "SALARIES_PAYROLL", name: "Staff Payroll & Professional Fees", type: "BUSINESS", isActive: true, displayOrder: 8 },
          { key: "SOFTWARE_TOOLS", name: "Software Subscriptions & Tooling", type: "BUSINESS", isActive: true, displayOrder: 9 },
          { key: "OTHER", name: "Other Miscellaneous Expenses", type: "BOTH", isActive: true, displayOrder: 10 },
        ];

    const defaults: ExpenseSettingsData = {
      categories: defaultCategories,
      requireReceiptAbove: 2000,
      defaultCategoryKey: "PROJECT_MATERIAL",
    };

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return {
          ...defaults,
          ...parsed,
          categories: parsed.categories || defaultCategories,
        };
      } catch {
        // fallback
      }
    }
    return defaults;
  }

  public static async updateExpenseSettings(input: Partial<ExpenseSettingsData>, actorId?: string): Promise<ExpenseSettingsData> {
    const existing = await this.getExpenseSettings();
    const updated: ExpenseSettingsData = {
      ...existing,
      ...input,
    };

    if (input.categories && input.categories.length > 0) {
      for (const cat of input.categories) {
        await db.expenseCategoryConfig.upsert({
          where: { key: cat.key },
          update: { name: cat.name, type: cat.type, isActive: cat.isActive, displayOrder: cat.displayOrder || 0 },
          create: { key: cat.key, name: cat.name, type: cat.type, isActive: cat.isActive, displayOrder: cat.displayOrder || 0 },
        });
      }
    }

    await this.set("expense.settings", JSON.stringify(updated), "FINANCE", "Expense Categories & Business Allocation Policies", actorId);
    return updated;
  }

  // =========================================================================
  // 10. SYSTEM PREFERENCES
  // =========================================================================

  public static async getSystemPreferences(): Promise<SystemPreferencesData> {
    const raw = await this.get("system.preferences", "");
    const defaults: SystemPreferencesData = {
      dateFormat: "DD/MM/YYYY",
      timeFormat: "12_HOUR",
      currency: "INR",
      currencySymbol: "₹",
      timezone: "Asia/Kolkata (IST)",
      language: "English",
      tableDensity: "normal",
      recordsPerPage: 20,
    };

    if (raw) {
      try {
        return { ...defaults, ...JSON.parse(raw) };
      } catch {
        // fallback
      }
    }
    return defaults;
  }

  public static async updateSystemPreferences(input: Partial<SystemPreferencesData>, actorId?: string): Promise<SystemPreferencesData> {
    const existing = await this.getSystemPreferences();
    const updated: SystemPreferencesData = {
      ...existing,
      ...input,
    };

    await this.set("system.preferences", JSON.stringify(updated), "GENERAL", "Global System Display, Date & Regional Preferences", actorId);
    return updated;
  }

  // =========================================================================
  // 11. INTEGRATIONS (WHATSAPP, WEBSITE LEADS, GOOGLE SHEETS)
  // =========================================================================

  public static async getWhatsAppConfig(): Promise<WhatsAppConfigData> {
    const raw = await this.get("integrations.whatsapp", "");
    const defaults: WhatsAppConfigData = {
      enabled: true,
      status: "CONNECTED",
      phoneNumber: "+91 98765 43210",
      instanceId: "ESPACIO-WA-LIVE-01",
      apiUrl: "https://api.whatsapp.com/v1",
      defaultQuotationTemplate: "Hello {{clientName}}, here is your interior quotation from ESPACIO: {{quotationLink}}",
      autoSendUpdates: true,
    };

    if (raw) {
      try {
        return { ...defaults, ...JSON.parse(raw) };
      } catch {
        // fallback
      }
    }
    return defaults;
  }

  public static async updateWhatsAppConfig(input: Partial<WhatsAppConfigData>, actorId?: string): Promise<WhatsAppConfigData> {
    const existing = await this.getWhatsAppConfig();
    const updated: WhatsAppConfigData = {
      ...existing,
      ...input,
    };

    await this.set("integrations.whatsapp", JSON.stringify(updated), "INTEGRATIONS", "WhatsApp Direct Messaging & Quotation Dispatch Integration", actorId);
    return updated;
  }

  public static async getWebsiteLeadConfig(): Promise<WebsiteLeadConfigData> {
    const raw = await this.get("integrations.website_leads", "");
    const defaults: WebsiteLeadConfigData = {
      enabled: true,
      status: "READY",
      webhookUrl: "/api/v1/leads/webhook",
      apiKeyMasked: "esp_live_sec_••••••••••••94b2",
      leadAutoAssign: true,
      lastLeadReceivedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    };

    if (raw) {
      try {
        return { ...defaults, ...JSON.parse(raw) };
      } catch {
        // fallback
      }
    }
    return defaults;
  }

  public static async updateWebsiteLeadConfig(input: Partial<WebsiteLeadConfigData>, actorId?: string): Promise<WebsiteLeadConfigData> {
    const existing = await this.getWebsiteLeadConfig();
    const updated: WebsiteLeadConfigData = {
      ...existing,
      ...input,
    };

    await this.set("integrations.website_leads", JSON.stringify(updated), "INTEGRATIONS", "Website Inbound Lead Webhook & Auto-Ingestion Config", actorId);
    return updated;
  }

  public static async getGoogleSheetsConfig(): Promise<GoogleSheetsConfigData> {
    const raw = await this.get("integrations.google_sheets", "");
    const defaults: GoogleSheetsConfigData = {
      enabled: false,
      status: "DISCONNECTED",
      spreadsheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      sheetName: "ESPACIO_Live_Data_Sync",
      autoSyncIntervalMinutes: 60,
      lastSyncAt: null,
      syncLeads: true,
      syncProjects: true,
      syncExpenses: false,
    };

    if (raw) {
      try {
        return { ...defaults, ...JSON.parse(raw) };
      } catch {
        // fallback
      }
    }
    return defaults;
  }

  public static async updateGoogleSheetsConfig(input: Partial<GoogleSheetsConfigData>, actorId?: string): Promise<GoogleSheetsConfigData> {
    const existing = await this.getGoogleSheetsConfig();
    const updated: GoogleSheetsConfigData = {
      ...existing,
      ...input,
    };

    await this.set("integrations.google_sheets", JSON.stringify(updated), "INTEGRATIONS", "Google Sheets Live Database Sync Configuration", actorId);
    return updated;
  }

  // =========================================================================
  // 12. DATABASE LIVE STATS & BACKUP STATUS
  // =========================================================================

  public static async getLiveDatabaseStats() {
    const [
      leadsCount,
      projectsCount,
      quotationsCount,
      paymentsCount,
      expensesCount,
      vendorsCount,
      usersCount,
      auditLogsCount,
    ] = await Promise.all([
      db.lead.count(),
      db.project.count(),
      db.quotation.count(),
      db.clientPayment.count(),
      db.expense.count(),
      db.vendor.count(),
      db.user.count(),
      db.auditLog.count(),
    ]);

    return {
      status: "HEALTHY",
      dbEngine: "PostgreSQL / Supabase",
      lastBackupAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      counts: {
        leads: leadsCount,
        projects: projectsCount,
        quotations: quotationsCount,
        payments: paymentsCount,
        expenses: expensesCount,
        vendors: vendorsCount,
        users: usersCount,
        auditLogs: auditLogsCount,
      },
    };
  }

  // =========================================================================
  // 13. USER PASSWORD MANAGEMENT
  // =========================================================================

  public static async changeUserPassword(userId: string, currentPassword: string, newPassword: string) {
    if (!currentPassword || !newPassword) {
      throw new ValidationError("Current password and new password are required");
    }

    if (newPassword.length < 6) {
      throw new ValidationError("New password must be at least 6 characters in length");
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError("User account not found");
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new ValidationError("Current password does not match our records");
    }

    const newHash = await hashPassword(newPassword);
    await db.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    await AuditService.logEvent({
      userId,
      action: "USER_PASSWORD_CHANGED",
      entityType: "User",
      entityId: userId,
      newValues: { passwordUpdated: true },
    });

    return { success: true, message: "Password updated successfully" };
  }

  // =========================================================================
  // 14. PURCHASE ORDER SETTINGS
  // =========================================================================

  public static async getPurchaseOrderSettings(): Promise<PurchaseOrderSettingsData> {
    const raw = await this.get("procurement.po_settings", "");
    const defaults: PurchaseOrderSettingsData = {
      prefix: "PO",
      numberFormat: "{PREFIX}-{YEAR}-{SEQ}",
      defaultTermsAndConditions: "1. Materials must strictly match specified grades. 2. Delivery within 7 business days.",
      defaultFooter: "Authorized Signatory • ESPACIO Procurement Division",
      templateName: "STANDARD_PURCHASE_ORDER",
    };

    if (raw) {
      try {
        return { ...defaults, ...JSON.parse(raw) };
      } catch {
        // fallback
      }
    }
    return defaults;
  }

  public static async updatePurchaseOrderSettings(input: Partial<PurchaseOrderSettingsData>, actorId?: string): Promise<PurchaseOrderSettingsData> {
    const existing = await this.getPurchaseOrderSettings();
    const updated: PurchaseOrderSettingsData = {
      ...existing,
      ...input,
      prefix: input.prefix ? input.prefix.toUpperCase() : existing.prefix,
    };

    await this.set("procurement.po_settings", JSON.stringify(updated), "PROCUREMENT", "Purchase Order Terms and Format Defaults", actorId);
    return updated;
  }

  // =========================================================================
  // 15. DOCUMENT SETTINGS
  // =========================================================================

  public static async getDocumentSettings(): Promise<DocumentSettingsData> {
    const raw = await this.get("document.settings", "");
    const defaults: DocumentSettingsData = {
      storageProvider: "LOCAL_DISK",
      allowedFileTypes: [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/acad",
        "application/x-dwg",
      ],
      maxFileSizeMb: 50,
      defaultVisibility: "INTERNAL",
      autoVersionOnUpload: true,
      archiveRetentionDays: 365,
    };

    if (raw) {
      try {
        return { ...defaults, ...JSON.parse(raw) };
      } catch {
        // fallback
      }
    }
    return defaults;
  }

  public static async updateDocumentSettings(input: Partial<DocumentSettingsData>, actorId?: string): Promise<DocumentSettingsData> {
    const existing = await this.getDocumentSettings();

    if (input.maxFileSizeMb !== undefined && (input.maxFileSizeMb <= 0 || input.maxFileSizeMb > 500)) {
      throw new ValidationError("Maximum file size must be between 1 MB and 500 MB.");
    }

    const updated: DocumentSettingsData = {
      ...existing,
      ...input,
    };

    await this.set("document.settings", JSON.stringify(updated), "DOCUMENTS", "Central Document Repository & Storage Policy", actorId);
    return updated;
  }

  // =========================================================================
  // 16. SECURITY & ACCESS SETTINGS
  // =========================================================================

  public static async getSecuritySettings(): Promise<SecuritySettingsData> {
    const raw = await this.get("security.settings", "");
    const defaults: SecuritySettingsData = {
      sessionTimeoutMinutes: 480, // 8 hours
      passwordMinLength: 8,
      passwordRequireSpecialChar: true,
      passwordRequireNumber: true,
      maxFailedLoginAttempts: 5,
      lockoutDurationMinutes: 15,
      mfaRequiredForAdmins: false,
    };

    if (raw) {
      try {
        return { ...defaults, ...JSON.parse(raw) };
      } catch {
        // fallback
      }
    }
    return defaults;
  }

  public static async updateSecuritySettings(input: Partial<SecuritySettingsData>, actorId?: string): Promise<SecuritySettingsData> {
    const existing = await this.getSecuritySettings();

    if (input.passwordMinLength !== undefined && input.passwordMinLength < 6) {
      throw new ValidationError("Password minimum length cannot be less than 6 characters.");
    }
    if (input.maxFailedLoginAttempts !== undefined && input.maxFailedLoginAttempts < 3) {
      throw new ValidationError("Max failed login attempts must be at least 3.");
    }

    const updated: SecuritySettingsData = {
      ...existing,
      ...input,
    };

    await this.set("security.settings", JSON.stringify(updated), "SECURITY", "System Security, Session and Password Policy", actorId);
    return updated;
  }

  // =========================================================================
  // 17. USER MODULE VISIBILITY CONFIGURATION
  // =========================================================================

  public static async getUserModuleVisibility(userId: string): Promise<string[]> {
    const allModules = [
      "leads",
      "projects",
      "clients",
      "quotations",
      "finance",
      "procurement",
      "inventory",
      "employees",
      "tasks",
      "documents",
      "reports",
      "settings",
    ];

    const raw = await this.get(`user.visibility.${userId}`, "");
    if (!raw) return allModules;

    try {
      return JSON.parse(raw);
    } catch {
      return allModules;
    }
  }

  public static async updateUserModuleVisibility(userId: string, visibleModules: string[], actorId?: string): Promise<string[]> {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    await this.set(
      `user.visibility.${userId}`,
      JSON.stringify(visibleModules),
      "USERS",
      `Module Visibility Filter for User ${user.email}`,
      actorId
    );

    await AuditService.logEvent({
      userId: actorId,
      action: "USER_MODULE_VISIBILITY_UPDATED",
      entityType: "User",
      entityId: userId,
      newValues: { visibleModules },
    });

    return visibleModules;
  }

  // =========================================================================
  // 18. SETTINGS CATALOG SEARCH
  // =========================================================================

  public static async searchSettings(query: string): Promise<Array<{ key: string; category: string; description: string; value: string }>> {
    const q = query.toLowerCase().trim();
    const all = await this.getAll();

    return all
      .filter((s) => s.key.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q)))
      .map((s) => ({
        key: s.key,
        category: s.category,
        description: s.description || "",
        value: s.value,
      }));
  }
}
