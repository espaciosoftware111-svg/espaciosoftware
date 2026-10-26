import { db } from "@/lib/db";
import { BusinessRuleError, NotFoundError, ForbiddenError, ValidationError } from "@/lib/errors";
import { IdGeneratorService } from "@/lib/id-generator";
import { AuditService } from "../audit/audit.service";
import { ActivityService } from "../activity/activity.service";
import { NotificationService } from "../notifications/notification.service";
import { DuplicateDetectionService } from "../leads/duplicate-detection.service";
import { RbacService } from "../rbac/rbac.service";
import { serverCache } from "@/lib/server-cache";
import { TrashService } from "../trash/trash.service";
import { verifyPassword } from "@/lib/auth";
import {
  CreateMaterialLeadInput,
  UpdateMaterialLeadInput,
  websiteMaterialEnquirySchema,
  createMaterialLeadSchema,
  MaterialRequirementItem,
  MaterialFollowUpItem,
} from "@/validators/material-lead.schema";

export interface MaterialLeadFilterParams {
  search?: string;
  status?: string;
  source?: string;
  location?: string;
  dateFrom?: string | Date;
  dateTo?: string | Date;
  page?: number;
  limit?: number;
}

export interface VendorRequestRecord {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorPhone?: string | null;
  requestedAt?: string;
  sentAt?: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  respondedAt?: string | null;
  notes?: string | null;
  rejectionReason?: string | null;
  finalAmount?: number | null;
  orderAmount?: number | null;
}

export class MaterialLeadService {
  /**
   * Helper: Normalize material lead stage/status
   */
  public static normalizeStatus(status?: string | null): string {
    if (!status) return "NEW";
    const s = status.toUpperCase().replace(/\s+/g, "_");
    if (s === "NOT_CONTACTED" || s === "UNCONTACTED") return "NOT_CONTACTED";
    if (s === "CONTACTED") return "CONTACTED";
    if (s === "MATERIAL_REQUIRED" || s === "REQUIREMENT" || s === "REQUIREMENTS") return "MATERIAL_REQUIRED";
    if (s === "REQUIREMENT_DISCUSSED") return "REQUIREMENT_DISCUSSED";
    if (s === "QUOTATION_IN_PROGRESS" || s === "QUOTATION_PROGRESS") return "QUOTATION_IN_PROGRESS";
    if (s === "QUOTATION_GENERATED") return "QUOTATION_GENERATED";
    if (s === "QUOTATION_SENT" || s === "ESTIMATE_SENT") return "QUOTATION_SENT";
    if (s === "WON") return "WON";
    if (s === "CONFIRMATION_FEE" || s === "CONFIRMATION_FEE_PAID" || s === "BOOKING_CONFIRMED" || s === "FEE_PAID") return "CONFIRMATION_FEE_PAID";
    if (s === "LOST") return "LOST";
    if (s === "ORDER_PLACED" || s === "ORDER_CREATED") return "ORDER_PLACED";
    if (s === "VENDOR_REQUEST" || s === "VENDOR_REQUESTED") return "VENDOR_REQUEST";
    if (s === "VENDOR_ACCEPTED") return "VENDOR_ACCEPTED";
    if (s === "VENDOR_REJECTED") return "VENDOR_REJECTED";
    if (s === "ORDER_CONFIRMED" || s === "CONFIRMED" || s === "ORDERED" || s === "MATERIALS_ORDER") return "ORDER_CONFIRMED";
    if (s === "ORDER_COMPLETED" || s === "COMPLETED") return "ORDER_COMPLETED";
    if (s === "ON_HOLD") return "ON_HOLD";
    if (s === "CANCELLED") return "CANCELLED";
    return status;
  }

  /**
   * Helper: Parse JSON safely with fallback
   */
  private static parseJsonSafely<T>(raw: string | null | undefined, fallback: T): T {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  /**
   * Check duplicate contact details for material leads
   */
  public static async checkForDuplicate(phone: string, email?: string | null, customerName?: string, location?: string | null) {
    return DuplicateDetectionService.checkMaterialLeadDuplicates({
      phone,
      email,
      customerName,
      location,
    });
  }

  /**
   * 1. Ingest Inbound Website Material Request / Unlock Catalog Submissions
   */
  public static async ingestWebsiteMaterialEnquiry(rawInput: any, options?: { allowDuplicate?: boolean }) {
    const input = websiteMaterialEnquirySchema.parse(rawInput);

    const duplicateCheck = await this.checkForDuplicate(
      input.primaryContact,
      input.email,
      input.customerName,
      input.location
    );

    if (duplicateCheck.isDuplicate && !options?.allowDuplicate && duplicateCheck.score >= 85) {
      const match = duplicateCheck.matches[0];
      throw new BusinessRuleError(
        `A lead with this contact information already exists (${match?.referenceNo} - ${match?.clientName}). Direct duplicate submission prevented.`
      );
    }

    const referenceNo = await IdGeneratorService.generate("MAT-LEAD");
    const sourceKey = input.source || "Website";

    const websiteData = {
      customerName: input.customerName,
      contactNumber1: input.primaryContact,
      contactNumber2: input.secondaryContact || null,
      emailAddress: input.email || null,
      projectLocation: input.location,
      source: sourceKey,
      customSource: input.customSource || null,
      materialPreferences: input.materialPreferences || null,
      submittedAt: new Date().toISOString(),
    };

    const initialNotes = [
      `Website Material Request / Catalog Unlock`,
      `Customer: ${input.customerName}`,
      `Primary Contact: ${input.primaryContact}`,
      input.secondaryContact ? `Secondary Contact: ${input.secondaryContact}` : null,
      input.email ? `Email: ${input.email}` : null,
      `Location: ${input.location}`,
      input.materialPreferences ? `Preferences: ${input.materialPreferences}` : null,
    ].filter(Boolean).join(" | ");

    const lead = await db.materialLead.create({
      data: {
        referenceNo,
        customerName: input.customerName.trim(),
        primaryContact: input.primaryContact.trim(),
        secondaryContact: input.secondaryContact ? input.secondaryContact.trim() : null,
        email: input.email ? input.email.trim() : null,
        sourceKey,
        customSource: input.customSource || null,
        propertyTypeKey: "MATERIAL_SUPPLY",
        location: input.location.trim(),
        requirement: "Materials Order & Supply",
        priority: "MEDIUM",
        stage: "NEW",
        status: "NEW",
        tags: "Material Lead, Catalog Request, Website Inbound",
        notes: initialNotes,
        requirements: input.requirements ? JSON.stringify(input.requirements) : null,
        websiteData: JSON.stringify(websiteData),
      },
    });

    await AuditService.logEvent({
      action: "WEBSITE_MATERIAL_ENQUIRY_RECEIVED",
      entityType: "MaterialLead",
      entityId: lead.id,
      newValues: {
        referenceNo: lead.referenceNo,
        customerName: lead.customerName,
        primaryContact: lead.primaryContact,
        secondaryContact: lead.secondaryContact,
        email: lead.email,
        location: lead.location,
        source: sourceKey,
        websiteData,
      },
    });

    await ActivityService.record({
      entityType: "MaterialLead",
      entityId: lead.id,
      type: "STATUS_CHANGE",
      title: `Material Lead Created (${lead.referenceNo})`,
      description: `Visitor ${lead.customerName} submitted Material Request from ${input.location} via ${sourceKey}.`,
    });

    // Notify Super Admin & Sales Management
    const adminUser = await db.user.findFirst({
      where: { accessLevel: "ADMIN", status: "ACTIVE" },
      select: { id: true },
    });

    if (adminUser) {
      await NotificationService.create({
        userId: adminUser.id,
        type: "LEAD_ASSIGNED",
        title: `New Material Lead: ${lead.referenceNo}`,
        message: `Inbound Material Request from ${lead.customerName} (${lead.primaryContact}) in ${input.location}.`,
        entityType: "MaterialLead",
        entityId: lead.id,
        actionUrl: `/material-leads?id=${lead.id}`,
      }).catch(() => {});
    }

    serverCache.invalidate("material_leads:");

    const parsedRequirements = this.parseJsonSafely<MaterialRequirementItem[]>(lead.requirements, []);
    const parsedWebsiteData = this.parseJsonSafely<any>(lead.websiteData, null);

    return {
      materialLead: {
        id: lead.id,
        materialLeadId: lead.referenceNo,
        referenceNo: lead.referenceNo,
        customerName: lead.customerName,
        clientName: lead.customerName,
        primaryContact: lead.primaryContact,
        phone: lead.primaryContact,
        secondaryContact: lead.secondaryContact,
        email: lead.email,
        location: lead.location,
        projectLocation: lead.location,
        source: lead.sourceKey,
        sourceKey: lead.sourceKey,
        status: "NEW",
        stage: "NEW",
        priority: lead.priority,
        notes: lead.notes,
        requirements: parsedRequirements,
        websiteData: parsedWebsiteData,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
      },
      referenceNo: lead.referenceNo,
      duplicateWarning: duplicateCheck.isDuplicate ? duplicateCheck : null,
    };
  }

  /**
   * 2. Manual Material Lead Creation
   */
  public static async createMaterialLead(input: CreateMaterialLeadInput, userId?: string) {
    const validated = createMaterialLeadSchema.parse(input);

    const duplicateCheck = await this.checkForDuplicate(
      validated.primaryContact,
      validated.email,
      validated.customerName,
      validated.location
    );

    const referenceNo = await IdGeneratorService.generate("MAT-LEAD");

    // Handle Global Others custom source
    let sourceKey = validated.sourceKey || validated.source || "WEBSITE";
    if (validated.customSource && (sourceKey.toUpperCase() === "OTHER" || sourceKey.toUpperCase() === "OTHERS")) {
      sourceKey = validated.customSource.trim();
    }

    const lead = await db.materialLead.create({
      data: {
        referenceNo,
        customerName: validated.customerName.trim(),
        primaryContact: validated.primaryContact.trim(),
        secondaryContact: validated.secondaryContact ? validated.secondaryContact.trim() : null,
        email: validated.email ? validated.email.trim() : null,
        sourceKey,
        customSource: validated.customSource ? validated.customSource.trim() : null,
        propertyTypeKey: "MATERIAL_SUPPLY",
        location: validated.location.trim(),
        requirement: "Materials Order & Supply",
        priority: validated.priority || "MEDIUM",
        stage: this.normalizeStatus(validated.status || "NEW"),
        status: this.normalizeStatus(validated.status || "NEW"),
        tags: "Material Lead, Manual Creation",
        notes: validated.notes ? validated.notes.trim() : null,
        assignedToId: validated.assignedToId || null,
        requirements: validated.requirements ? JSON.stringify(validated.requirements) : null,
      },
      include: {
        assignedTo: { select: { id: true, fullName: true, email: true } },
      },
    });

    await AuditService.logEvent({
      userId,
      action: "MATERIAL_LEAD_CREATED",
      entityType: "MaterialLead",
      entityId: lead.id,
      newValues: {
        referenceNo: lead.referenceNo,
        customerName: lead.customerName,
        primaryContact: lead.primaryContact,
        secondaryContact: lead.secondaryContact,
        email: lead.email,
        location: lead.location,
        source: sourceKey,
        status: lead.stage,
      },
    });

    await ActivityService.record({
      userId,
      entityType: "MaterialLead",
      entityId: lead.id,
      type: "STATUS_CHANGE",
      title: `Material Lead Created (${lead.referenceNo})`,
      description: `Registered Material Lead for ${lead.customerName} (${lead.primaryContact}) via ${sourceKey}.`,
    });

    serverCache.invalidate("material_leads:");

    const parsedRequirements = this.parseJsonSafely<MaterialRequirementItem[]>(lead.requirements, []);

    return {
      materialLead: {
        id: lead.id,
        materialLeadId: lead.referenceNo,
        referenceNo: lead.referenceNo,
        customerName: lead.customerName,
        clientName: lead.customerName,
        primaryContact: lead.primaryContact,
        phone: lead.primaryContact,
        secondaryContact: lead.secondaryContact,
        email: lead.email,
        location: lead.location,
        projectLocation: lead.location,
        source: lead.sourceKey,
        sourceKey: lead.sourceKey,
        status: this.normalizeStatus(lead.stage),
        stage: this.normalizeStatus(lead.stage),
        priority: lead.priority,
        notes: lead.notes,
        requirements: parsedRequirements,
        assignedTo: lead.assignedTo,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
      },
      referenceNo: lead.referenceNo,
    };
  }

  /**
   * 3. List Material Leads with Search, Filters, Pagination, and Dynamic KPIs
   */
  public static async getMaterialLeads(params: MaterialLeadFilterParams, actorUserId?: string) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.max(1, Math.min(100, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      AND: [
        {
          OR: [
            { tags: null },
            { tags: { not: { contains: "[FROZEN_ARCHIVED]" } } },
          ],
        },
        {
          OR: [
            { lossReason: null },
            { lossReason: { not: "FROZEN_ARCHIVED" } },
          ],
        },
      ],
    };

    // 1. Search filter
    if (params.search && params.search.trim().length > 0) {
      const q = params.search.trim();
      where.OR = [
        { referenceNo: { contains: q } },
        { customerName: { contains: q } },
        { primaryContact: { contains: q } },
        { email: { contains: q } },
        { location: { contains: q } },
        { sourceKey: { contains: q } },
        { notes: { contains: q } },
      ];
    }

    // 2. Status filter
    if (params.status && params.status !== "ALL") {
      where.stage = { contains: params.status };
    }

    // 3. Source filter
    if (params.source && params.source !== "ALL") {
      const s = params.source.toUpperCase().trim();
      if (s === "WEBSITE") {
        where.OR = [
          { sourceKey: { contains: "WEBSITE" } },
          { sourceKey: { contains: "Website" } },
          { sourceKey: { contains: "website" } },
          { sourceKey: { contains: "ONLINE" } },
        ];
      } else if (s === "INSTAGRAM") {
        where.OR = [
          { sourceKey: { contains: "INSTAGRAM" } },
          { sourceKey: { contains: "Instagram" } },
          { sourceKey: { contains: "instagram" } },
          { sourceKey: { contains: "SOCIAL" } },
          { sourceKey: { contains: "Social" } },
          { sourceKey: { contains: "META" } },
        ];
      } else if (s === "MANUAL" || s === "DIRECT" || s === "WALK_IN" || s === "DIRECT_VISIT") {
        where.OR = [
          { sourceKey: { contains: "MANUAL" } },
          { sourceKey: { contains: "Manual" } },
          { sourceKey: { contains: "DIRECT" } },
          { sourceKey: { contains: "Direct" } },
          { sourceKey: { contains: "WALK" } },
          { sourceKey: { contains: "Walk" } },
          { sourceKey: { contains: "STUDIO" } },
          { sourceKey: { contains: "OTHER" } },
        ];
      } else if (s === "REFERRAL") {
        where.OR = [
          { sourceKey: { contains: "REFERRAL" } },
          { sourceKey: { contains: "Referral" } },
        ];
      } else if (s === "WHATSAPP") {
        where.OR = [
          { sourceKey: { contains: "WHATSAPP" } },
          { sourceKey: { contains: "WhatsApp" } },
          { sourceKey: { contains: "whatsapp" } },
        ];
      } else if (s === "PHONE_CALL" || s === "PHONE") {
        where.OR = [
          { sourceKey: { contains: "PHONE" } },
          { sourceKey: { contains: "Phone" } },
          { sourceKey: { contains: "CALL" } },
        ];
      } else {
        where.sourceKey = { contains: params.source };
      }
    }

    // 4. Location filter
    if (params.location && params.location !== "ALL") {
      where.location = { contains: params.location };
    }

    // 5. Date Range filter
    if (params.dateFrom || params.dateTo) {
      const createdAtRange: Record<string, Date> = {};
      if (params.dateFrom) createdAtRange.gte = new Date(params.dateFrom);
      if (params.dateTo) createdAtRange.lte = new Date(params.dateTo);
      where.createdAt = createdAtRange;
    }

    // RBAC Scoping
    if (actorUserId) {
      const isSuperAdmin = await RbacService.isSuperAdmin(actorUserId);
      const isAdmin = await RbacService.isAdmin(actorUserId);
      const hasReadAll = await RbacService.hasPermission(actorUserId, "leads:read_all");

      if (!isSuperAdmin && !isAdmin && !hasReadAll) {
        where.assignedToId = actorUserId;
      }
    }

    const [total, rawLeads, allMaterialLeads] = await Promise.all([
      db.materialLead.count({ where }),
      db.materialLead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          assignedTo: { select: { id: true, fullName: true, email: true, phone: true } },
          quotations: {
            select: { id: true, referenceNo: true, totalAmount: true, status: true, createdAt: true },
          },
          followUps: {
            where: { status: "PENDING" },
            orderBy: { followUpDate: "asc" },
            take: 1,
          },
        },
      }),
      // KPI aggregation over all material leads
      db.materialLead.findMany({
        select: {
          id: true,
          stage: true,
          quotations: { select: { id: true, status: true } },
        },
      }),
    ]);

    // Compute Dynamic KPIs
    const totalMaterialLeads = allMaterialLeads.length;
    let activeMaterialLeads = 0;
    let quotationsSentCount = 0;
    let convertedOrderedCount = 0;

    allMaterialLeads.forEach((l) => {
      const normStage = this.normalizeStatus(l.stage);
      const isTerminal = normStage === "ORDER_COMPLETED" || normStage === "LOST" || normStage === "CANCELLED";
      if (!isTerminal) {
        activeMaterialLeads++;
      }
      if (
        normStage === "QUOTATION_SENT" ||
        l.quotations.some((q) => q.status === "SENT" || q.status === "APPROVED")
      ) {
        quotationsSentCount++;
      }
      if (
        normStage === "ORDER_CONFIRMED" ||
        normStage === "ORDER_COMPLETED" ||
        normStage === "ORDER_PLACED" ||
        normStage === "VENDOR_ACCEPTED" ||
        l.quotations.some((q) => q.status === "APPROVED")
      ) {
        convertedOrderedCount++;
      }
    });

    const items = rawLeads.map((lead) => {
      const parsedRequirements = this.parseJsonSafely<MaterialRequirementItem[]>(lead.requirements, []);
      const parsedWebsiteData = this.parseJsonSafely<any>(lead.websiteData, null);

      return {
        id: lead.id,
        materialLeadId: lead.referenceNo,
        referenceNo: lead.referenceNo,
        customerName: lead.customerName,
        clientName: lead.customerName,
        primaryContact: lead.primaryContact,
        phone: lead.primaryContact,
        secondaryContact: lead.secondaryContact,
        email: lead.email,
        location: lead.location || "N/A",
        projectLocation: lead.location || "N/A",
        source: lead.sourceKey,
        sourceKey: lead.sourceKey,
        requirement: lead.requirement || "Materials Order & Supply",
        status: this.normalizeStatus(lead.stage),
        stage: this.normalizeStatus(lead.stage),
        priority: lead.priority,
        notes: lead.notes,
        requirements: parsedRequirements,
        websiteData: parsedWebsiteData,
        assignedTo: lead.assignedTo,
        quotationsCount: lead.quotations.length,
        nextFollowUp: lead.followUps[0] || null,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
      };
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        kpi: {
          totalMaterialLeads,
          activeMaterialLeads,
          quotationsSent: quotationsSentCount,
          convertedOrdered: convertedOrderedCount,
        },
      },
    };
  }

  /**
   * 4. Retrieve Material Lead by ID with all Tab Data
   */
  public static async getMaterialLeadById(id: string, actorUserId?: string) {
    const lead = await db.materialLead.findFirst({
      where: {
        OR: [{ id }, { referenceNo: id }],
      },
      include: {
        assignedTo: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } },
        followUps: {
          orderBy: { followUpDate: "desc" },
          include: { assignedTo: { select: { id: true, fullName: true } } },
        },
        quotations: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            referenceNo: true,
            title: true,
            totalAmount: true,
            subtotal: true,
            discountAmount: true,
            taxAmount: true,
            status: true,
            revision: true,
            createdAt: true,
            approvedAt: true,
            clientApprovedName: true,
            gstInvoices: {
              select: {
                id: true,
                invoiceNo: true,
                invoiceDate: true,
                grandTotal: true,
                paidAmount: true,
                outstandingAmount: true,
                status: true,
                notes: true,
                createdAt: true,
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            referenceNo: true,
            amount: true,
            paymentDate: true,
            paymentMethod: true,
            status: true,
            referenceNoExt: true,
            notes: true,
            gstInvoiceId: true,
            createdAt: true,
            gstInvoice: {
              select: {
                id: true,
                invoiceNo: true,
                invoiceDate: true,
                grandTotal: true,
                paidAmount: true,
                outstandingAmount: true,
                status: true,
                notes: true,
                createdAt: true,
              },
            },
          },
        },
        stageHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!lead) throw new NotFoundError("Material Lead record not found");

    if (actorUserId) {
      const isSuperAdmin = await RbacService.isSuperAdmin(actorUserId);
      const isAdmin = await RbacService.isAdmin(actorUserId);
      const hasReadAll = await RbacService.hasPermission(actorUserId, "leads:read_all");

      if (!isSuperAdmin && !isAdmin && !hasReadAll && lead.assignedToId && lead.assignedToId !== actorUserId) {
        throw new ForbiddenError("You do not have access to view this assigned material lead.");
      }
    }

    const timeline = await ActivityService.getTimeline("MaterialLead", lead.id);

    // Fetch linked materials orders / purchase orders if any
    const purchaseOrders = await db.purchaseOrder.findMany({
      where: {
        OR: [
          { notes: { contains: lead.referenceNo } },
          { notes: { contains: lead.id } },
          ...(lead.customerName ? [{ notes: { contains: lead.customerName } }] : []),
        ],
      },
      select: {
        id: true,
        referenceNo: true,
        vendorId: true,
        vendor: { select: { id: true, name: true, phone: true, categoryKey: true } },
        grandTotal: true,
        status: true,
        poDate: true,
        notes: true,
        vendorPayments: {
          select: {
            id: true,
            amount: true,
            status: true,
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }).catch(() => []);

    // Fetch linked GST invoices directly linked to quotations, payments, or client
    const quoteIds = (lead.quotations || []).map((q) => q.id);
    const linkedGstInvoices = await db.gstInvoice.findMany({
      where: {
        OR: [
          ...(quoteIds.length > 0 ? [{ quotationId: { in: quoteIds } }] : []),
          { notes: { contains: lead.referenceNo } },
          { customerName: { equals: lead.customerName } },
        ],
      },
      select: {
        id: true,
        invoiceNo: true,
        invoiceDate: true,
        quotationId: true,
        customerName: true,
        taxableAmount: true,
        cgstAmount: true,
        sgstAmount: true,
        igstAmount: true,
        totalTax: true,
        grandTotal: true,
        paidAmount: true,
        outstandingAmount: true,
        status: true,
        notes: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }).catch(() => []);

    // Fetch linked expenses directly associated with this material lead
    const expenses = await db.expense.findMany({
      where: {
        OR: [
          { materialLeadId: lead.id },
          { notes: { contains: lead.referenceNo } },
        ],
      },
      select: {
        id: true,
        referenceNo: true,
        description: true,
        amount: true,
        categoryKey: true,
        expenseType: true,
        expenseDate: true,
        status: true,
        paymentMethod: true,
        notes: true,
        createdAt: true,
      },
      orderBy: { expenseDate: "desc" },
    }).catch(() => []);

    let computedStatus = this.normalizeStatus(lead.stage);
    const earlyStages = ["NEW", "NOT_CONTACTED", "CONTACTED", "REQUIREMENT_DISCUSSED", "MATERIAL_REQUIRED", "MATERIALS_REQUIRED", "QUOTATION_IN_PROGRESS", "QUOTATION_GENERATED", "QUOTATION_SENT", "ESTIMATE_SENT"];
    if (purchaseOrders.length > 0 || lead.linkedOrderId) {
      if (earlyStages.includes(computedStatus) || computedStatus === "WON" || computedStatus === "CONFIRMATION_FEE_PAID") {
        computedStatus = "ORDER_PLACED";
      }
    } else if ((lead.payments?.length > 0 || linkedGstInvoices.length > 0) && earlyStages.includes(computedStatus)) {
      computedStatus = "CONFIRMATION_FEE_PAID";
    }

    const parsedRequirements = this.parseJsonSafely<MaterialRequirementItem[]>(lead.requirements, []);
    const parsedWebsiteData = this.parseJsonSafely<any>(lead.websiteData, null);
    const parsedVendorRequests = this.parseJsonSafely<VendorRequestRecord[]>(lead.vendorRequests, []);

    const enrichedLead = {
      id: lead.id,
      materialLeadId: lead.referenceNo,
      referenceNo: lead.referenceNo,
      customerName: lead.customerName,
      clientName: lead.customerName,
      primaryContact: lead.primaryContact,
      phone: lead.primaryContact,
      secondaryContact: lead.secondaryContact,
      email: lead.email,
      location: lead.location || "N/A",
      projectLocation: lead.location || "N/A",
      source: lead.sourceKey,
      sourceKey: lead.sourceKey,
      requirement: lead.requirement || "Materials Order & Supply",
      status: computedStatus,
      stage: computedStatus,
      priority: lead.priority,
      notes: lead.notes,
      requirements: parsedRequirements,
      websiteData: parsedWebsiteData,
      linkedOrderId: lead.linkedOrderId,
      linkedOrderRef: lead.linkedOrderRef,
      vendorRequests: parsedVendorRequests,
      assignedTo: lead.assignedTo,
      followUps: lead.followUps,
      quotations: lead.quotations,
      invoices: linkedGstInvoices,
      payments: lead.payments || [],
      orders: purchaseOrders,
      expenses,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    };

    return {
      materialLead: enrichedLead,
      timeline,
      ...enrichedLead,
    };
  }

  /**
   * 5. Update Material Lead Details and Status
   */
  public static async updateMaterialLead(id: string, input: UpdateMaterialLeadInput, userId?: string) {
    const lead = await db.materialLead.findFirst({
      where: { OR: [{ id }, { referenceNo: id }] },
    });
    if (!lead) throw new NotFoundError("Material Lead record not found");

    const updateData: Record<string, unknown> = {};

    if (input.customerName) updateData.customerName = input.customerName.trim();
    if (input.primaryContact) updateData.primaryContact = input.primaryContact.trim();
    if (input.secondaryContact !== undefined) updateData.secondaryContact = input.secondaryContact ? input.secondaryContact.trim() : null;
    if (input.email !== undefined) updateData.email = input.email ? input.email.trim() : null;
    if (input.location) updateData.location = input.location.trim();
    if (input.priority) updateData.priority = input.priority;
    if (input.assignedToId !== undefined) updateData.assignedToId = input.assignedToId || null;
    if (input.notes !== undefined) updateData.notes = input.notes ? input.notes.trim() : null;
    if (input.tags !== undefined) updateData.tags = input.tags ? input.tags.trim() : null;
    if (input.requirements !== undefined) updateData.requirements = JSON.stringify(input.requirements);

    if (input.source) {
      let sourceKey = input.source;
      if (input.customSource && (sourceKey.toUpperCase() === "OTHER" || sourceKey.toUpperCase() === "OTHERS")) {
        sourceKey = input.customSource.trim();
      }
      updateData.sourceKey = sourceKey;
      if (input.customSource) updateData.customSource = input.customSource.trim();
    }

    const previousStatus = this.normalizeStatus(lead.stage);
    let nextStatus = previousStatus;
    if (input.status) {
      nextStatus = this.normalizeStatus(input.status);
      updateData.stage = nextStatus;
      updateData.status = nextStatus;
    }

    const updated = await db.materialLead.update({
      where: { id: lead.id },
      data: updateData,
      include: { assignedTo: { select: { id: true, fullName: true } } },
    });

    if (previousStatus !== nextStatus) {
      await db.materialLeadStageHistory.create({
        data: {
          materialLeadId: lead.id,
          fromStage: previousStatus,
          toStage: nextStatus,
          changedById: userId || null,
          notes: input.lossReason || `Material Lead status updated from ${previousStatus} to ${nextStatus}`,
        },
      }).catch(() => {});

      await ActivityService.record({
        userId,
        entityType: "MaterialLead",
        entityId: lead.id,
        type: "STATUS_CHANGE",
        title: `Status Changed to ${nextStatus}`,
        description: `Material Lead status transitioned from ${previousStatus} to ${nextStatus}.`,
      });
    }

    await AuditService.logEvent({
      userId,
      action: "MATERIAL_LEAD_UPDATED",
      entityType: "MaterialLead",
      entityId: lead.id,
      oldValues: { status: previousStatus, customerName: lead.customerName, phone: lead.primaryContact },
      newValues: { status: nextStatus, customerName: updated.customerName, phone: updated.primaryContact },
    });

    serverCache.invalidate("material_leads:");

    return this.getMaterialLeadById(lead.id);
  }

  /**
   * 6. Add Material Requirement Item
   */
  public static async addRequirement(materialLeadId: string, item: MaterialRequirementItem, userId?: string) {
    const lead = await db.materialLead.findFirst({
      where: { OR: [{ id: materialLeadId }, { referenceNo: materialLeadId }] },
    });
    if (!lead) throw new NotFoundError("Material Lead record not found");

    const existingReqs = this.parseJsonSafely<MaterialRequirementItem[]>(lead.requirements, []);
    const newRequirement: MaterialRequirementItem = {
      id: item.id || `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      materialName: item.materialName.trim(),
      category: item.category || "General",
      quantity: item.quantity || 1,
      unit: item.unit || "Units",
      additionalRequirements: item.additionalRequirements || null,
      notes: item.notes || null,
    };

    const updatedRequirements = [...existingReqs, newRequirement];

    await db.materialLead.update({
      where: { id: lead.id },
      data: { requirements: JSON.stringify(updatedRequirements) },
    });

    await ActivityService.record({
      userId,
      entityType: "MaterialLead",
      entityId: lead.id,
      type: "REQUIREMENTS_UPDATED",
      title: "Material Requirement Added",
      description: `Added ${newRequirement.quantity} ${newRequirement.unit} of ${newRequirement.materialName} (${newRequirement.category}).`,
    });

    await AuditService.logEvent({
      userId,
      action: "MATERIAL_REQUIREMENT_ADDED",
      entityType: "MaterialLead",
      entityId: lead.id,
      newValues: newRequirement,
    });

    serverCache.invalidate("material_leads:");
    return { success: true, requirement: newRequirement, requirements: updatedRequirements };
  }

  /**
   * 7. Update Material Requirement Item
   */
  public static async updateRequirement(
    materialLeadId: string,
    requirementId: string,
    updates: Partial<MaterialRequirementItem>,
    userId?: string
  ) {
    const lead = await db.materialLead.findFirst({
      where: { OR: [{ id: materialLeadId }, { referenceNo: materialLeadId }] },
    });
    if (!lead) throw new NotFoundError("Material Lead record not found");

    const existingReqs = this.parseJsonSafely<MaterialRequirementItem[]>(lead.requirements, []);
    const reqIndex = existingReqs.findIndex((r) => r.id === requirementId);
    if (reqIndex === -1) throw new NotFoundError("Material Requirement item not found");

    const updatedReq = {
      ...existingReqs[reqIndex],
      ...updates,
    };
    existingReqs[reqIndex] = updatedReq;

    await db.materialLead.update({
      where: { id: lead.id },
      data: { requirements: JSON.stringify(existingReqs) },
    });

    await ActivityService.record({
      userId,
      entityType: "MaterialLead",
      entityId: lead.id,
      type: "REQUIREMENTS_UPDATED",
      title: "Material Requirement Updated",
      description: `Updated requirement item: ${updatedReq.materialName}.`,
    });

    serverCache.invalidate("material_leads:");
    return { success: true, requirement: updatedReq, requirements: existingReqs };
  }

  /**
   * 8. Delete Material Requirement Item
   */
  public static async deleteRequirement(materialLeadId: string, requirementId: string, userId?: string) {
    const lead = await db.materialLead.findFirst({
      where: { OR: [{ id: materialLeadId }, { referenceNo: materialLeadId }] },
    });
    if (!lead) throw new NotFoundError("Material Lead record not found");

    const existingReqs = this.parseJsonSafely<MaterialRequirementItem[]>(lead.requirements, []);
    const filtered = existingReqs.filter((r) => r.id !== requirementId);

    await db.materialLead.update({
      where: { id: lead.id },
      data: { requirements: JSON.stringify(filtered) },
    });

    await ActivityService.record({
      userId,
      entityType: "MaterialLead",
      entityId: lead.id,
      type: "REQUIREMENTS_UPDATED",
      title: "Material Requirement Removed",
      description: `Removed requirement item ${requirementId}.`,
    });

    serverCache.invalidate("material_leads:");
    return { success: true, requirements: filtered };
  }

  /**
   * 9. Add Follow-Up for Material Lead
   */
  public static async addFollowUp(materialLeadId: string, followUp: MaterialFollowUpItem, userId?: string) {
    const lead = await db.materialLead.findFirst({
      where: { OR: [{ id: materialLeadId }, { referenceNo: materialLeadId }] },
    });
    if (!lead) throw new NotFoundError("Material Lead record not found");

    const createdFollowUp = await db.materialLeadFollowUp.create({
      data: {
        materialLeadId: lead.id,
        followUpDate: new Date(followUp.followUpDate),
        type: "CALL",
        notes: followUp.notes.trim(),
        status: followUp.status || "PENDING",
        assignedToId: followUp.assignedToId || userId || null,
      },
    });

    await ActivityService.record({
      userId,
      entityType: "MaterialLead",
      entityId: lead.id,
      type: "FOLLOW_UP_SCHEDULED",
      title: "Follow-Up Scheduled",
      description: `Scheduled follow-up for ${new Date(followUp.followUpDate).toLocaleDateString("en-IN")}: ${followUp.notes}`,
    });

    await AuditService.logEvent({
      userId,
      action: "MATERIAL_FOLLOWUP_ADDED",
      entityType: "MaterialLead",
      entityId: lead.id,
      newValues: createdFollowUp,
    });

    serverCache.invalidate("material_leads:");
    return { success: true, followUp: createdFollowUp };
  }

  /**
   * 10. Complete Follow-Up
   */
  public static async completeFollowUp(followUpId: string, outcomeNotes: string, userId?: string) {
    const followUp = await db.materialLeadFollowUp.findUnique({
      where: { id: followUpId },
    });
    if (!followUp) throw new NotFoundError("Follow-up record not found");

    const updated = await db.materialLeadFollowUp.update({
      where: { id: followUpId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        outcomeNotes: outcomeNotes.trim(),
      },
    });

    await ActivityService.record({
      userId,
      entityType: "MaterialLead",
      entityId: followUp.materialLeadId,
      type: "FOLLOW_UP_COMPLETED",
      title: "Follow-Up Completed",
      description: `Follow-up completed with outcome: ${outcomeNotes}`,
    });

    serverCache.invalidate("material_leads:");
    return { success: true, followUp: updated };
  }

  /**
   * 11. Delete Material Lead (Safe Deletion / Admin Password Protected)
   */
  public static async deleteMaterialLead(id: string, userId?: string, adminPassword?: string) {
    const lead = await db.materialLead.findFirst({
      where: { OR: [{ id }, { referenceNo: id }] },
      include: { quotations: true },
    });
    if (!lead) throw new NotFoundError("Material Lead record not found");

    if (userId && adminPassword) {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) throw new ForbiddenError("User not found.");
      const isValid = await verifyPassword(adminPassword, user.passwordHash);
      if (!isValid) throw new ForbiddenError("Invalid admin confirmation password.");
    }

    if (!adminPassword && lead.quotations.length > 0) {
      throw new BusinessRuleError("Cannot delete material lead with linked quotation history.");
    }

    // Unlink quotations, payments, expenses
    await db.quotation.updateMany({
      where: { materialLeadId: lead.id },
      data: { materialLeadId: null },
    });

    await db.clientPayment.updateMany({
      where: { materialLeadId: lead.id },
      data: { materialLeadId: null },
    });

    await db.expense.updateMany({
      where: { materialLeadId: lead.id },
      data: { materialLeadId: null },
    });

    await db.materialLeadFollowUp.deleteMany({ where: { materialLeadId: lead.id } });
    await db.materialLeadStageHistory.deleteMany({ where: { materialLeadId: lead.id } });

    await db.materialLead.delete({
      where: { id: lead.id },
    });

    await AuditService.logEvent({
      userId,
      action: "MATERIAL_LEAD_DELETED",
      entityType: "MaterialLead",
      entityId: lead.id,
      oldValues: { referenceNo: lead.referenceNo, customerName: lead.customerName },
    });

    serverCache.invalidate("material_leads:");
    return { success: true };
  }

  /**
   * 12. Update Contact Status (CONTACTED / NOT_CONTACTED)
   */
  public static async updateContactStatus(
    id: string,
    input: { status: "CONTACTED" | "NOT_CONTACTED"; notes?: string | null; followUpDate?: string | null; followUpTime?: string | null },
    userId?: string
  ) {
    const lead = await db.materialLead.findFirst({
      where: { OR: [{ id }, { referenceNo: id }] },
    });
    if (!lead) throw new NotFoundError("Material Lead record not found");

    const previousStatus = this.normalizeStatus(lead.stage);
    const newStatus = input.status;

    await db.materialLead.update({
      where: { id: lead.id },
      data: {
        stage: newStatus,
        status: newStatus,
        ...(input.notes ? { notes: input.notes } : {}),
      },
    });

    if (previousStatus !== newStatus) {
      await db.materialLeadStageHistory.create({
        data: {
          materialLeadId: lead.id,
          fromStage: previousStatus,
          toStage: newStatus,
          changedById: userId || null,
          notes: input.notes || `Customer marked as ${newStatus}`,
        },
      }).catch(() => {});
    }

    if (newStatus === "NOT_CONTACTED") {
      if (input.followUpDate) {
        await this.addFollowUp(
          lead.id,
          {
            followUpDate: input.followUpDate,
            followUpTime: input.followUpTime || null,
            notes: input.notes || "Follow-up required (Customer Not Contacted)",
            status: "PENDING",
          },
          userId
        );
      }

      await ActivityService.record({
        userId,
        entityType: "MaterialLead",
        entityId: lead.id,
        type: "STATUS_CHANGE",
        title: "Marked Not Contacted",
        description: input.notes || "Customer marked as Not Contacted. Follow-up is required.",
      });

      await AuditService.logEvent({
        userId,
        action: "MATERIAL_LEAD_NOT_CONTACTED",
        entityType: "MaterialLead",
        entityId: lead.id,
        oldValues: { stage: previousStatus },
        newValues: { stage: "NOT_CONTACTED", notes: input.notes },
      });
    } else {
      await ActivityService.record({
        userId,
        entityType: "MaterialLead",
        entityId: lead.id,
        type: "STATUS_CHANGE",
        title: "Customer Contacted",
        description: input.notes || "Customer successfully contacted regarding material requirements.",
      });

      await AuditService.logEvent({
        userId,
        action: "MATERIAL_LEAD_CONTACTED",
        entityType: "MaterialLead",
        entityId: lead.id,
        oldValues: { stage: previousStatus },
        newValues: { stage: "CONTACTED", notes: input.notes },
      });
    }

    serverCache.invalidate("material_leads:");
    return this.getMaterialLeadById(lead.id);
  }

  /**
   * 13. Place Material Order (WON -> ORDER PLACED -> VENDOR REQUEST)
   */
  public static async placeMaterialOrder(
    id: string,
    input: {
      quotationId?: string | null;
      vendorId?: string | null;
      isNewVendor?: boolean;
      newVendorData?: {
        name: string;
        phone: string;
        email?: string | null;
        address?: string | null;
        gstin?: string | null;
        categoryKey?: string;
        contactPerson?: string | null;
      } | null;
      finalVendorOrderAmount?: number;
      expectedDeliveryDate?: string | null;
      notes?: string | null;
      materials?: MaterialRequirementItem[];
    },
    userId?: string
  ) {
    const lead = await db.materialLead.findFirst({
      where: { OR: [{ id }, { referenceNo: id }] },
      include: { quotations: true },
    });
    if (!lead) throw new NotFoundError("Material Lead record not found");

    // Resolve or create Vendor
    let vendor: any;
    if (input.isNewVendor && input.newVendorData) {
      const vRef = await IdGeneratorService.generate("VEN");
      vendor = await db.vendor.create({
        data: {
          referenceNo: vRef,
          name: input.newVendorData.name.trim(),
          phone: input.newVendorData.phone.trim(),
          email: input.newVendorData.email ? input.newVendorData.email.trim() : null,
          address: input.newVendorData.address ? input.newVendorData.address.trim() : null,
          gstin: input.newVendorData.gstin ? input.newVendorData.gstin.trim() : null,
          categoryKey: input.newVendorData.categoryKey || "MATERIALS",
          contactPerson: input.newVendorData.contactPerson ? input.newVendorData.contactPerson.trim() : null,
          status: "ACTIVE",
        },
      });

      await AuditService.logEvent({
        userId,
        action: "VENDOR_CREATED",
        entityType: "Vendor",
        entityId: vendor.id,
        newValues: { referenceNo: vendor.referenceNo, name: vendor.name },
      });
    } else if (input.vendorId) {
      vendor = await db.vendor.findUnique({ where: { id: input.vendorId } });
      if (!vendor) throw new NotFoundError("Selected vendor record not found");
    } else {
      vendor = await db.vendor.findFirst({ where: { status: "ACTIVE" } });
      if (!vendor) {
        const vRef = await IdGeneratorService.generate("VEN");
        vendor = await db.vendor.create({
          data: {
            referenceNo: vRef,
            name: "Direct Material Supplier",
            phone: "+91 9999999999",
            categoryKey: "MATERIALS",
            status: "ACTIVE",
          },
        });
      }
    }

    const orderRef = await IdGeneratorService.generate("MAT-ORD");
    const parsedReqs = this.parseJsonSafely<MaterialRequirementItem[]>(lead.requirements, []);
    const existingVendorRequests = this.parseJsonSafely<VendorRequestRecord[]>(lead.vendorRequests, []);

    // Items to include
    const itemsSource = (input.materials && input.materials.length > 0)
      ? input.materials
      : (parsedReqs.length > 0 ? parsedReqs : [{
          materialName: "Custom Material Requirement",
          category: "General",
          quantity: 1,
          unit: "Lot",
          specifications: null,
          additionalRequirements: null,
          notes: null,
        }]);

    const orderAmount = input.finalVendorOrderAmount || (lead.quotations[0]?.totalAmount) || 1000;

    const orderNotes = JSON.stringify({
      scope: "MATERIALS_REQUIRED_LEAD",
      leadId: lead.id,
      leadRef: lead.referenceNo,
      customerName: lead.customerName,
      customerPhone: lead.primaryContact,
      customerEmail: lead.email,
      customerAddress: lead.location,
      quotationId: input.quotationId || lead.quotations[0]?.id || null,
      customNotes: input.notes || null,
    });

    const expectedDate = input.expectedDeliveryDate ? new Date(input.expectedDeliveryDate) : null;

    const purchaseOrder = await db.purchaseOrder.create({
      data: {
        referenceNo: orderRef,
        vendorId: vendor.id,
        projectId: null,
        poDate: new Date(),
        expectedDeliveryDate: expectedDate,
        currency: "INR",
        subtotal: orderAmount,
        grandTotal: orderAmount,
        status: "CONFIRMED",
        notes: orderNotes,
        items: {
          create: itemsSource.map((itm) => ({
            materialName: itm.materialName,
            description: itm.notes || itm.specifications || null,
            quantity: itm.quantity || 1,
            unitKey: itm.unit || "NOS",
            rate: orderAmount / (itemsSource.length || 1),
            lineTotal: orderAmount / (itemsSource.length || 1),
            pendingQuantity: itm.quantity || 1,
          })),
        },
      },
      include: {
        vendor: true,
        items: true,
      },
    });

    const initialVendorRequest: VendorRequestRecord = {
      id: `VR-${Date.now()}`,
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorPhone: vendor.phone || null,
      requestedAt: new Date().toISOString(),
      status: "PENDING",
      notes: input.notes || `Dispatched order request for ${orderRef}`,
    };

    const existingRequests = existingVendorRequests.filter(
      (vr) => !(vr.vendorId === vendor.id && vr.status === "PENDING")
    );
    const updatedVendorRequests = [initialVendorRequest, ...existingRequests];

    await db.materialLead.update({
      where: { id: lead.id },
      data: {
        stage: "ORDER_PLACED",
        status: "ORDER_PLACED",
        linkedOrderId: purchaseOrder.id,
        linkedOrderRef: purchaseOrder.referenceNo,
        vendorRequests: JSON.stringify(updatedVendorRequests),
      },
    });

    await db.materialLeadStageHistory.create({
      data: {
        materialLeadId: lead.id,
        fromStage: this.normalizeStatus(lead.stage),
        toStage: "ORDER_PLACED",
        changedById: userId || null,
        notes: `Material Order ${orderRef} placed with initial vendor ${vendor.name}`,
      },
    }).catch(() => {});

    await ActivityService.record({
      userId,
      entityType: "MaterialLead",
      entityId: lead.id,
      type: "ORDER_CREATED",
      title: "Material Order Placed",
      description: `Placed Material Order ${orderRef} (₹${orderAmount.toLocaleString("en-IN")}) and sent request to vendor ${vendor.name}.`,
    });

    await AuditService.logEvent({
      userId,
      action: "MATERIAL_ORDER_PLACED",
      entityType: "MaterialLead",
      entityId: lead.id,
      newValues: { orderId: purchaseOrder.id, referenceNo: orderRef, vendorName: vendor.name, amount: orderAmount },
    });

    serverCache.invalidate("material_leads:");
    serverCache.invalidate("purchase_orders:");

    return {
      success: true,
      order: purchaseOrder,
      vendorRequest: initialVendorRequest,
      materialLead: await this.getMaterialLeadById(lead.id),
    };
  }

  /**
   * 14. Send New Vendor Request
   */
  public static async sendVendorRequest(
    id: string,
    input: {
      orderId?: string | null;
      vendorId?: string | null;
      isNewVendor?: boolean;
      newVendorData?: {
        name: string;
        phone: string;
        email?: string | null;
        address?: string | null;
        gstin?: string | null;
        categoryKey?: string;
        contactPerson?: string | null;
      } | null;
      notes?: string | null;
    },
    userId?: string
  ) {
    const lead = await db.materialLead.findFirst({
      where: { OR: [{ id }, { referenceNo: id }] },
    });
    if (!lead) throw new NotFoundError("Material Lead record not found");

    let vendor: any;
    if (input.isNewVendor && input.newVendorData) {
      const vRef = await IdGeneratorService.generate("VEN");
      vendor = await db.vendor.create({
        data: {
          referenceNo: vRef,
          name: input.newVendorData.name.trim(),
          phone: input.newVendorData.phone.trim(),
          email: input.newVendorData.email ? input.newVendorData.email.trim() : null,
          address: input.newVendorData.address ? input.newVendorData.address.trim() : null,
          gstin: input.newVendorData.gstin ? input.newVendorData.gstin.trim() : null,
          categoryKey: input.newVendorData.categoryKey || "MATERIALS",
          contactPerson: input.newVendorData.contactPerson ? input.newVendorData.contactPerson.trim() : null,
          status: "ACTIVE",
        },
      });

      await AuditService.logEvent({
        userId,
        action: "VENDOR_CREATED",
        entityType: "Vendor",
        entityId: vendor.id,
        newValues: { referenceNo: vendor.referenceNo, name: vendor.name },
      });
    } else if (input.vendorId) {
      vendor = await db.vendor.findUnique({ where: { id: input.vendorId } });
      if (!vendor) throw new NotFoundError("Selected vendor record not found");
    } else {
      throw new BusinessRuleError("A valid Vendor selection or New Vendor details are required.");
    }

    const existingVendorRequests = this.parseJsonSafely<VendorRequestRecord[]>(lead.vendorRequests, []);

    const newRequest: VendorRequestRecord = {
      id: `VR-${Date.now()}`,
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorPhone: vendor.phone || null,
      requestedAt: new Date().toISOString(),
      status: "PENDING",
      notes: input.notes || `Dispatched order request to ${vendor.name}`,
    };

    const existingRequests = existingVendorRequests.filter(
      (vr) => !(vr.vendorId === vendor.id && vr.status === "PENDING")
    );
    const updatedVendorRequests = [newRequest, ...existingRequests];

    if (lead.linkedOrderId || input.orderId) {
      const targetOrderId = lead.linkedOrderId || input.orderId!;
      await db.purchaseOrder.update({
        where: { id: targetOrderId },
        data: { vendorId: vendor.id },
      }).catch(() => {});
    }

    await db.materialLead.update({
      where: { id: lead.id },
      data: {
        stage: "VENDOR_REQUEST",
        status: "VENDOR_REQUEST",
        vendorRequests: JSON.stringify(updatedVendorRequests),
      },
    });

    await db.materialLeadStageHistory.create({
      data: {
        materialLeadId: lead.id,
        fromStage: this.normalizeStatus(lead.stage),
        toStage: "VENDOR_REQUEST",
        changedById: userId || null,
        notes: `Selected new vendor ${vendor.name} and dispatched request`,
      },
    }).catch(() => {});

    await ActivityService.record({
      userId,
      entityType: "MaterialLead",
      entityId: lead.id,
      type: "VENDOR_REQUEST_SENT",
      title: "New Vendor Selected & Request Sent",
      description: `Dispatched material order request to ${vendor.name} (Status: PENDING).`,
    });

    await AuditService.logEvent({
      userId,
      action: "VENDOR_REQUEST_SENT",
      entityType: "MaterialLead",
      entityId: lead.id,
      newValues: { vendorId: vendor.id, vendorName: vendor.name },
    });

    serverCache.invalidate("material_leads:");
    return {
      success: true,
      vendorRequest: newRequest,
      materialLead: await this.getMaterialLeadById(lead.id),
    };
  }

  /**
   * 15. Record Vendor Response (ACCEPTED / REJECTED)
   */
  public static async recordVendorResponse(
    id: string,
    input: {
      response: "ACCEPTED" | "REJECTED";
      rejectionReason?: string | null;
      notes?: string | null;
      negotiatedAmount?: number | null;
    },
    userId?: string
  ) {
    const lead = await db.materialLead.findFirst({
      where: { OR: [{ id }, { referenceNo: id }] },
    });
    if (!lead) throw new NotFoundError("Material Lead record not found");

    const vendorRequests = this.parseJsonSafely<VendorRequestRecord[]>(lead.vendorRequests, []);
    const nowIso = new Date().toISOString();

    if (vendorRequests.length === 0) {
      const po = lead.linkedOrderId
        ? await db.purchaseOrder.findUnique({ where: { id: lead.linkedOrderId }, include: { vendor: true } })
        : null;
      vendorRequests.push({
        id: `VREQ-${Date.now()}`,
        vendorId: po?.vendorId || "VENDOR-DIRECT",
        vendorName: po?.vendor?.name || lead.customerName || "Material Supplier",
        vendorPhone: po?.vendor?.phone || lead.primaryContact || "",
        status: "PENDING",
        sentAt: nowIso,
        orderAmount: po ? Number(po.grandTotal) : 0,
      });
    }

    const reqIndex = vendorRequests.findIndex((r) => r.status === "PENDING");
    const targetIndex = reqIndex >= 0 ? reqIndex : 0;
    const targetReq = vendorRequests[targetIndex];

    const isAccepted = input.response === "ACCEPTED";

    if (isAccepted) {
      targetReq.status = "ACCEPTED";
      targetReq.respondedAt = nowIso;
      targetReq.notes = input.notes || targetReq.notes;
      if (input.negotiatedAmount) targetReq.finalAmount = input.negotiatedAmount;

      if (lead.linkedOrderId) {
        const updateData: Record<string, unknown> = {
          status: "CONFIRMED",
        };
        if (input.negotiatedAmount && input.negotiatedAmount > 0) {
          updateData.grandTotal = input.negotiatedAmount;
          updateData.subtotal = input.negotiatedAmount;
        }
        await db.purchaseOrder.update({
          where: { id: lead.linkedOrderId },
          data: updateData,
        }).catch(() => {});
      }

      await db.materialLead.update({
        where: { id: lead.id },
        data: {
          stage: "VENDOR_ACCEPTED",
          status: "VENDOR_ACCEPTED",
          vendorRequests: JSON.stringify(vendorRequests),
        },
      });

      await db.materialLeadStageHistory.create({
        data: {
          materialLeadId: lead.id,
          fromStage: this.normalizeStatus(lead.stage),
          toStage: "VENDOR_ACCEPTED",
          changedById: userId || null,
          notes: `Vendor ${targetReq.vendorName} accepted material order request. Order is now CONFIRMED.`,
        },
      }).catch(() => {});

      await ActivityService.record({
        userId,
        entityType: "MaterialLead",
        entityId: lead.id,
        type: "VENDOR_ACCEPTED",
        title: "Vendor Accepted — Order Confirmed",
        description: `Vendor ${targetReq.vendorName} accepted the order. Material Order status updated to CONFIRMED.`,
      });

      await AuditService.logEvent({
        userId,
        action: "MATERIAL_ORDER_CONFIRMED",
        entityType: "MaterialLead",
        entityId: lead.id,
        newValues: { vendorName: targetReq.vendorName, status: "CONFIRMED" },
      });
    } else {
      targetReq.status = "REJECTED";
      targetReq.respondedAt = nowIso;
      targetReq.rejectionReason = input.rejectionReason || input.notes || "Vendor unavailable or unable to fulfill order";

      await db.materialLead.update({
        where: { id: lead.id },
        data: {
          stage: "VENDOR_REJECTED",
          status: "VENDOR_REJECTED",
          vendorRequests: JSON.stringify(vendorRequests),
        },
      });

      await db.materialLeadStageHistory.create({
        data: {
          materialLeadId: lead.id,
          fromStage: this.normalizeStatus(lead.stage),
          toStage: "VENDOR_REJECTED",
          changedById: userId || null,
          notes: `Vendor ${targetReq.vendorName} rejected order: ${targetReq.rejectionReason}`,
        },
      }).catch(() => {});

      await ActivityService.record({
        userId,
        entityType: "MaterialLead",
        entityId: lead.id,
        type: "VENDOR_REJECTED",
        title: "Vendor Rejected Request",
        description: `Vendor ${targetReq.vendorName} rejected the order request. Reason: ${targetReq.rejectionReason}`,
      });

      await AuditService.logEvent({
        userId,
        action: "VENDOR_REJECTED",
        entityType: "MaterialLead",
        entityId: lead.id,
        newValues: { vendorName: targetReq.vendorName, reason: targetReq.rejectionReason },
      });
    }

    serverCache.invalidate("material_leads:");
    serverCache.invalidate("purchase_orders:");

    return {
      success: true,
      response: input.response,
      vendorRequest: targetReq,
      materialLead: await this.getMaterialLeadById(lead.id),
    };
  }

  /**
   * Bulk delete multiple Material Leads
   */
  public static async deleteMultipleMaterialLeads(
    leadIds: string[],
    userId?: string,
    adminPassword?: string
  ) {
    for (const id of leadIds) {
      await this.deleteMaterialLead(id, userId, adminPassword);
    }
    return { success: true, count: leadIds.length };
  }

  /**
   * Freeze / Archive or Unfreeze / Restore multiple Material Leads safely
   */
  public static async freezeMultipleMaterialLeads(
    leadIds: string[],
    freeze: boolean = true,
    reason?: string,
    actorUserId?: string
  ) {
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      throw new ValidationError("At least one material lead ID must be provided.");
    }

    const leads = await db.materialLead.findMany({
      where: { id: { in: leadIds } },
    });

    if (leads.length === 0) {
      throw new NotFoundError("None of the specified material leads were found.");
    }

    const updatedLeads = await db.$transaction(async (tx) => {
      const results = [];
      for (const l of leads) {
        let currentTags = l.tags || "";
        let newTags = currentTags;
        if (freeze) {
          if (!newTags.includes("[FROZEN_ARCHIVED]")) {
            newTags = newTags ? `${newTags}, [FROZEN_ARCHIVED]` : "[FROZEN_ARCHIVED]";
          }
        } else {
          newTags = newTags.replace(/,?\s*\[FROZEN_ARCHIVED\]/g, "").trim();
        }

        const updated = await tx.materialLead.update({
          where: { id: l.id },
          data: {
            tags: newTags,
            lossReason: freeze
              ? (reason || "FROZEN_ARCHIVED")
              : (l.lossReason === "FROZEN_ARCHIVED" ? null : l.lossReason),
          },
        });
        results.push(updated);
      }
      return results;
    });

    if (freeze) {
      for (const l of leads) {
        await (db as any).trashItem.deleteMany({
          where: { entityType: "LEAD", entityId: l.id },
        }).catch(() => null);

        await TrashService.moveToTrash({
          entityType: "LEAD",
          entityId: l.id,
          title: `${l.referenceNo} - ${l.customerName}`,
          subtitle: `Material Lead ${l.referenceNo} • Frozen / Archived`,
          category: "CRM",
          payload: {
            ...l,
            isMaterialLead: true,
            tags: l.tags ? `${l.tags}, [FROZEN_ARCHIVED]` : "[FROZEN_ARCHIVED]",
            lossReason: reason || "FROZEN_ARCHIVED",
          },
          deletedById: actorUserId,
          reason: reason || "Frozen / Archived and moved to Trash",
        }).catch((err) => console.warn("Could not archive frozen material lead to trash:", err));
      }
    } else {
      for (const l of leads) {
        await (db as any).trashItem.deleteMany({
          where: { entityType: "LEAD", entityId: l.id },
        }).catch(() => null);
      }
    }

    serverCache.invalidate("material_leads:");

    return {
      success: true,
      count: updatedLeads.length,
      frozen: freeze,
      leads: updatedLeads,
      message: freeze
        ? `Successfully frozen and archived ${updatedLeads.length} material lead(s).`
        : `Successfully unfrozen and restored ${updatedLeads.length} material lead(s).`,
    };
  }
}

export const materialLeadService = MaterialLeadService;
