import { db } from "@/lib/db";
import { BusinessRuleError, NotFoundError, ValidationError, ForbiddenError } from "@/lib/errors";
import { IdGeneratorService } from "@/lib/id-generator";
import { AuditService } from "../audit/audit.service";
import { ActivityService } from "../activity/activity.service";
import { NotificationService } from "../notifications/notification.service";
import { DuplicateDetectionService } from "./duplicate-detection.service";
import { RbacService } from "../rbac/rbac.service";
import { serverCache } from "@/lib/server-cache";
import { CreateLeadInput, UpdateLeadInput, ChangeStatusInput, WebsiteEnquiryInput, websiteEnquirySchema } from "@/validators/lead.schema";

export interface LeadFilterParams {
  status?: string;
  stage?: string;
  source?: string;
  priority?: string;
  assignedToId?: string;
  tags?: string;
  minBudget?: number;
  maxBudget?: number;
  createdFrom?: string | Date;
  createdTo?: string | Date;
  followUpFrom?: string | Date;
  followUpTo?: string | Date;
  search?: string;
  page?: number;
  limit?: number;
}

export class LeadService {
  /**
   * Helper to resolve stage aliases (e.g. ESTIMATE_SENT -> QUOTATION_SENT)
   */
  public static normalizeStage(stage?: string | null): string | undefined {
    if (!stage) return undefined;
    if (stage === "ESTIMATE_SENT") return "QUOTATION_SENT";
    return stage;
  }

  public static async checkForDuplicate(phone: string, email?: string | null, clientName?: string, location?: string | null) {
    return DuplicateDetectionService.checkDuplicates({
      phone,
      email,
      clientName,
      location,
    });
  }

  public static async createLead(input: CreateLeadInput, userId?: string) {
    const duplicateCheck = await this.checkForDuplicate(
      input.phone,
      input.email,
      input.clientName,
      input.location || input.propertyLocation
    );

    const referenceNo = await IdGeneratorService.generate("LEAD");

    // Handle Global Others rule for source
    let sourceKey = input.sourceKey || input.source || "WEBSITE";
    if (input.customSource && (sourceKey === "OTHER" || sourceKey === "OTHERS" || input.source === "OTHER")) {
      sourceKey = input.customSource.trim();
    }

    // Handle Global Others rule for property type
    let propertyTypeKey = input.propertyTypeKey || input.propertyType || "Apartment";
    if (input.customPropertyType && (propertyTypeKey === "OTHER" || propertyTypeKey === "Others" || propertyTypeKey === "OTHERS")) {
      propertyTypeKey = input.customPropertyType.trim();
    }

    // Handle Global Others rule for requirement
    let requirement = input.requirement ? input.requirement.trim() : null;
    if (input.customRequirement) {
      requirement = input.customRequirement.trim();
    } else if (input.requirementType) {
      requirement = input.requirementType.trim();
    }

    const location = (input.location || input.propertyLocation || "").trim() || null;
    const estimatedBudget = input.budget !== undefined ? input.budget : input.estimatedBudget !== undefined ? input.estimatedBudget : null;
    const priority = input.priority || "MEDIUM";
    const tags = input.tags ? input.tags.trim() : null;
    const assignedToId = input.assignedToId || null;

    // Structured metadata for website / detailed enquiries
    const websiteData = {
      requirementType: input.requirementType || requirement || "Turnkey Interiors",
      customRequirement: input.customRequirement || null,
      propertyType: input.propertyType || propertyTypeKey || "Apartment",
      customPropertyType: input.customPropertyType || null,
      spaces: Array.isArray(input.spaces) ? input.spaces : input.spaces ? [input.spaces] : ["Full Home"],
      customSpace: input.customSpace || null,
      projectLocation: location,
      propertySize: input.propertySize || null,
      customerStage: input.customerStage || "Ready To Start",
      specificRequirements: input.specificRequirements || null,
      submittedAt: new Date().toISOString(),
      source: sourceKey,
    };

    let userNotes = input.notes ? input.notes.trim() : "";
    const metadataStr = `[WEBSITE_ENQUIRY_METADATA]: ${JSON.stringify(websiteData)}`;
    const finalNotes = userNotes ? `${userNotes}\n\n${metadataStr}` : metadataStr;

    const lead = await db.lead.create({
      data: {
        referenceNo,
        clientName: input.clientName.trim(),
        phone: input.phone.trim(),
        email: input.email ? input.email.trim() : null,
        sourceKey,
        propertyTypeKey,
        location,
        estimatedBudget,
        requirement,
        priority,
        tags,
        notes: finalNotes,
        assignedToId,
        stage: "NEW",
      },
      include: {
        assignedTo: { select: { id: true, fullName: true, email: true } },
      },
    });

    // If client ID was explicitly passed, link client
    if (input.clientId && typeof input.clientId === "string" && input.clientId.trim().length > 0) {
      await db.client.update({
        where: { id: input.clientId },
        data: { leadId: lead.id },
      }).catch(() => {});
    }

    await AuditService.logEvent({
      userId,
      action: "LEAD_CREATED",
      entityType: "Lead",
      entityId: lead.id,
      newValues: {
        referenceNo: lead.referenceNo,
        clientName: lead.clientName,
        phone: lead.phone,
        sourceKey,
        priority,
        estimatedBudget,
        assignedToId,
        websiteData,
      },
    });

    await ActivityService.record({
      userId,
      entityType: "Lead",
      entityId: lead.id,
      type: "STATUS_CHANGE",
      title: `Lead ${lead.referenceNo} Created`,
      description: `New lead registered for ${lead.clientName} (${lead.phone}) via ${sourceKey} [Priority: ${priority}].`,
    });

    if (assignedToId) {
      await NotificationService.create({
        userId: assignedToId,
        type: "LEAD_ASSIGNED",
        title: `Lead Assigned: ${lead.referenceNo}`,
        message: `You have been assigned lead "${lead.clientName}" (${lead.referenceNo}).`,
        entityType: "Lead",
        entityId: lead.id,
        actionUrl: `/leads?id=${lead.id}`,
      });
    }

    serverCache.invalidate("leads:");
    serverCache.invalidate("dashboard:");

    return {
      lead,
      duplicateWarning: duplicateCheck.isDuplicate ? duplicateCheck : null,
    };
  }

  /**
   * Dedicated Ingestion Handler for Website Inbound Forms & Webhooks
   */
  public static async ingestWebsiteEnquiry(rawInput: any, options?: { allowDuplicate?: boolean }) {
    const input = websiteEnquirySchema.parse(rawInput);

    const duplicateCheck = await this.checkForDuplicate(
      input.mobileNumber,
      input.emailAddress,
      input.fullName,
      input.projectLocation
    );

    if (duplicateCheck.isDuplicate && !options?.allowDuplicate && duplicateCheck.score >= 85) {
      const match = duplicateCheck.matches[0];
      throw new BusinessRuleError(
        `A lead with this contact information already exists (${match?.referenceNo} - ${match?.clientName}). Direct duplicate submission prevented.`
      );
    }

    const referenceNo = await IdGeneratorService.generate("LEAD");

    // Resolve requirement
    const requirement = (input.customRequirement && input.customRequirement.trim().length > 0)
      ? input.customRequirement.trim()
      : input.requirementType.trim();

    // Resolve property type
    const propertyType = (input.customPropertyType && input.customPropertyType.trim().length > 0)
      ? input.customPropertyType.trim()
      : input.propertyType.trim();

    const spaces = Array.isArray(input.spaces) ? input.spaces : (input.spaces ? [input.spaces] : ["Full Home"]);
    if (input.customSpace && input.customSpace.trim().length > 0) {
      spaces.push(`Custom: ${input.customSpace.trim()}`);
    }

    const websiteData = {
      requirementType: input.requirementType,
      customRequirement: input.customRequirement || null,
      propertyType: input.propertyType,
      customPropertyType: input.customPropertyType || null,
      spaces,
      customSpace: input.customSpace || null,
      projectLocation: input.projectLocation,
      propertySize: input.propertySize || null,
      customerStage: input.customerStage || "Ready To Start",
      specificRequirements: input.specificRequirements || null,
      submittedAt: new Date().toISOString(),
      source: "WEBSITE",
    };

    const notesSummary = [
      `Website Inbound Inquiry`,
      `Requirement: ${requirement}`,
      `Property: ${propertyType} (${input.propertySize || "Size TBD"}) at ${input.projectLocation}`,
      `Selected Spaces: ${spaces.join(", ")}`,
      `Stage: ${input.customerStage || "Not Specified"}`,
      input.specificRequirements ? `Specifics: ${input.specificRequirements}` : null,
    ].filter(Boolean).join(" | ");

    const notesWithMetadata = `${notesSummary}\n\n[WEBSITE_ENQUIRY_METADATA]: ${JSON.stringify(websiteData)}`;

    const tagsArray = ["Website Inbound", requirement, propertyType];
    if (input.propertySize) tagsArray.push(input.propertySize);

    const lead = await db.lead.create({
      data: {
        referenceNo,
        clientName: input.fullName.trim(),
        phone: input.mobileNumber.trim(),
        email: input.emailAddress.trim(),
        sourceKey: "WEBSITE",
        propertyTypeKey: propertyType,
        location: input.projectLocation.trim(),
        requirement,
        priority: input.customerStage === "Ready To Start" ? "HIGH" : "MEDIUM",
        stage: "NEW",
        tags: tagsArray.join(", "),
        notes: notesWithMetadata,
      },
    });

    const enrichedLead = {
      ...lead,
      leadId: lead.referenceNo,
      source: lead.sourceKey,
      stage: "NEW_LEAD",
      websiteEnquiry: websiteData,
      metadata: { websiteEnquiry: websiteData },
    };

    await AuditService.logEvent({
      action: "WEBSITE_ENQUIRY_RECEIVED",
      entityType: "Lead",
      entityId: lead.id,
      newValues: {
        referenceNo: lead.referenceNo,
        clientName: lead.clientName,
        phone: lead.phone,
        email: lead.email,
        sourceKey: "WEBSITE",
        websiteData,
        isDuplicate: duplicateCheck.isDuplicate,
      },
    });

    await ActivityService.record({
      entityType: "Lead",
      entityId: lead.id,
      type: "STATUS_CHANGE",
      title: `Website Enquiry Received (${lead.referenceNo})`,
      description: `Visitor ${lead.clientName} submitted website enquiry for ${requirement} at ${input.projectLocation}.`,
    });

    // Notify Super Admin & Sales management
    const adminUser = await db.user.findFirst({
      where: { accessLevel: "ADMIN", status: "ACTIVE" },
      select: { id: true },
    });

    if (adminUser) {
      await NotificationService.create({
        userId: adminUser.id,
        type: "LEAD_ASSIGNED",
        title: `New Website Lead: ${lead.referenceNo}`,
        message: `Inbound website lead from ${lead.clientName} (${lead.phone}) for ${requirement} in ${input.projectLocation}.`,
        entityType: "Lead",
        entityId: lead.id,
        actionUrl: `/leads?id=${lead.id}`,
      }).catch(() => {});
    }

    serverCache.invalidate("leads:");
    serverCache.invalidate("dashboard:");

    return {
      lead: enrichedLead,
      referenceNo: lead.referenceNo,
      duplicateWarning: duplicateCheck.isDuplicate ? duplicateCheck : null,
    };
  }

  public static async getLeads(params: LeadFilterParams, actorUserId?: string) {
    const cacheKey = `leads:list:${JSON.stringify({ params, actorUserId })}`;
    const cached = serverCache.get<any>(cacheKey);
    if (cached) return cached;

    const page = Math.max(1, params.page ?? 1);
    const limit = Math.max(1, Math.min(100, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    // 1. Stage / Status filter
    const rawStage = params.status || params.stage;
    if (rawStage && rawStage !== "ALL") {
      if (rawStage === "QUOTATION_SENT") {
        where.stage = { in: ["QUOTATION_SENT", "ESTIMATE_SENT"] };
      } else if (rawStage === "ALL_ACTIVE") {
        where.stage = { notIn: ["WON", "LOST"] };
      } else {
        where.stage = { contains: rawStage, mode: "insensitive" };
      }
    }

    // 2. Source filter
    if (params.source && params.source !== "ALL") {
      where.sourceKey = { contains: params.source, mode: "insensitive" };
    }

    // 3. Priority filter
    if (params.priority && params.priority !== "ALL") {
      where.priority = { contains: params.priority, mode: "insensitive" };
    }

    // 4. Assigned staff filter
    if (params.assignedToId && params.assignedToId !== "ALL") {
      where.OR = [
        { assignedToId: params.assignedToId },
        { assignedTo: { fullName: { contains: params.assignedToId, mode: "insensitive" } } },
      ];
    }

    // 5. Tags filter
    if (params.tags) {
      where.tags = { contains: params.tags };
    }

    // 6. Budget range
    if (params.minBudget !== undefined || params.maxBudget !== undefined) {
      where.estimatedBudget = {
        ...(params.minBudget !== undefined ? { gte: params.minBudget } : {}),
        ...(params.maxBudget !== undefined ? { lte: params.maxBudget } : {}),
      };
    }

    // 7. Created date range
    if (params.createdFrom || params.createdTo) {
      where.createdAt = {
        ...(params.createdFrom ? { gte: new Date(params.createdFrom) } : {}),
        ...(params.createdTo ? { lte: new Date(params.createdTo) } : {}),
      };
    }

    // 8. Text Search
    if (params.search && params.search.trim().length > 0) {
      const q = params.search.trim();
      where.OR = [
        { referenceNo: { contains: q } },
        { clientName: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } },
        { location: { contains: q } },
        { requirement: { contains: q } },
      ];
    }

    // 9. RBAC Record-level Scoping
    if (actorUserId) {
      const isSuperAdmin = await RbacService.isSuperAdmin(actorUserId);
      const isAdmin = await RbacService.isAdmin(actorUserId);
      const hasReadAll = await RbacService.hasPermission(actorUserId, "leads:read_all");

      if (!isSuperAdmin && !isAdmin && !hasReadAll) {
        // Scope to assigned leads or created leads
        where.assignedToId = actorUserId;
      }
    }

    const [total, rawLeads] = await Promise.all([
      db.lead.count({ where }),
      db.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          assignedTo: { select: { id: true, fullName: true, email: true, phone: true } },
          project: {
            select: { id: true, referenceNo: true, title: true, stage: true, contractValue: true },
          },
          client: {
            select: { id: true, referenceNo: true, fullName: true, phone: true },
          },
        },
      }),
    ]);

    const leadIds = rawLeads.map((l) => l.id);
    const [followUps, siteVisits] = await Promise.all([
      leadIds.length > 0
        ? db.leadFollowUp.findMany({
            where: { leadId: { in: leadIds }, status: "PENDING" },
            orderBy: { followUpDate: "asc" },
            select: { id: true, leadId: true, followUpDate: true, type: true, notes: true, status: true },
          })
        : [],
      leadIds.length > 0
        ? db.leadSiteVisit.findMany({
            where: { leadId: { in: leadIds }, status: "SCHEDULED" },
            orderBy: { visitDate: "asc" },
            select: { id: true, leadId: true, visitDate: true, location: true, status: true },
          })
        : [],
    ]);

    const followUpMap = new Map<string, any>();
    for (const f of followUps) {
      if (!followUpMap.has(f.leadId)) followUpMap.set(f.leadId, f);
    }

    const siteVisitMap = new Map<string, any>();
    for (const s of siteVisits) {
      if (!siteVisitMap.has(s.leadId)) siteVisitMap.set(s.leadId, s);
    }

    // Normalize returned leads
    const leads = rawLeads.map((l) => ({
      ...l,
      stage: this.normalizeStage(l.stage),
      nextFollowUp: followUpMap.get(l.id) || null,
      nextSiteVisit: siteVisitMap.get(l.id) || null,
      latestQuotation: null,
    }));

    const result = {
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    serverCache.set(cacheKey, result, 15);
    return result;
  }

  public static async getLeadById(id: string, actorUserId?: string) {
    const lead = await db.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } },
        followUps: {
          orderBy: { followUpDate: "desc" },
          include: { assignedTo: { select: { id: true, fullName: true } } },
        },
        siteVisits: {
          orderBy: { visitDate: "desc" },
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
            parentQuotationId: true,
            createdAt: true,
            approvedAt: true,
            clientApprovedName: true,
          },
        },
        project: {
          select: { id: true, referenceNo: true, title: true, stage: true, contractValue: true, revisedBudget: true },
        },
        client: {
          select: { id: true, referenceNo: true, fullName: true, phone: true, email: true, address: true },
        },
        stageHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!lead) throw new NotFoundError("Lead record not found");

    // Scoping check for non-admin users
    if (actorUserId) {
      const isSuperAdmin = await RbacService.isSuperAdmin(actorUserId);
      const isAdmin = await RbacService.isAdmin(actorUserId);
      const hasReadAll = await RbacService.hasPermission(actorUserId, "leads:read_all");

      if (!isSuperAdmin && !isAdmin && !hasReadAll && lead.assignedToId && lead.assignedToId !== actorUserId) {
        throw new ForbiddenError("You do not have access to view this assigned lead record.");
      }
    }

    const timeline = await ActivityService.getTimeline("Lead", lead.id);

    let websiteEnquiry: any = null;
    let cleanedNotes = lead.notes || "";
    if (lead.notes && lead.notes.includes("[WEBSITE_ENQUIRY_METADATA]:")) {
      try {
        const parts = lead.notes.split("[WEBSITE_ENQUIRY_METADATA]:");
        cleanedNotes = parts[0].trim();
        const rawJson = parts[1].trim();
        websiteEnquiry = JSON.parse(rawJson);
      } catch {
        // fallback
      }
    }

    if (!websiteEnquiry) {
      websiteEnquiry = {
        requirementType: lead.requirement || "Turnkey Interiors",
        customRequirement: null,
        propertyType: lead.propertyTypeKey || "Apartment",
        customPropertyType: null,
        spaces: ["Full Home"],
        customSpace: null,
        projectLocation: lead.location || "N/A",
        propertySize: null,
        customerStage: "Ready To Start",
        specificRequirements: cleanedNotes || lead.notes || null,
        submittedAt: lead.createdAt,
        source: lead.sourceKey,
      };
    }

    const enrichedLead = {
      ...lead,
      leadId: lead.referenceNo,
      source: lead.sourceKey,
      notes: cleanedNotes,
      websiteEnquiry,
      metadata: { websiteEnquiry },
      stage: this.normalizeStage(lead.stage),
    };

    return {
      lead: enrichedLead,
      timeline,
      ...enrichedLead,
    };
  }

  public static async updateLead(id: string, input: UpdateLeadInput, userId?: string) {
    const lead = await db.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundError("Lead record not found");

    const updated = await db.lead.update({
      where: { id },
      data: {
        clientName: input.clientName ? input.clientName.trim() : undefined,
        phone: input.phone ? input.phone.trim() : undefined,
        email: input.email !== undefined ? (input.email ? input.email.trim() : null) : undefined,
        sourceKey: input.sourceKey || input.source || undefined,
        propertyTypeKey: input.propertyTypeKey || input.propertyType || undefined,
        location: input.location !== undefined ? (input.location ? input.location.trim() : null) : input.propertyLocation !== undefined ? (input.propertyLocation ? input.propertyLocation.trim() : null) : undefined,
        estimatedBudget: input.estimatedBudget !== undefined ? input.estimatedBudget : input.budget !== undefined ? input.budget : undefined,
        requirement: input.requirement !== undefined ? (input.requirement ? input.requirement.trim() : null) : undefined,
        priority: input.priority || undefined,
        tags: input.tags !== undefined ? (input.tags ? input.tags.trim() : null) : undefined,
        notes: input.notes !== undefined ? (input.notes ? input.notes.trim() : null) : undefined,
      },
      include: {
        assignedTo: { select: { id: true, fullName: true, email: true } },
      },
    });

    await AuditService.logEvent({
      userId,
      action: "LEAD_UPDATED",
      entityType: "Lead",
      entityId: id,
      oldValues: lead,
      newValues: updated,
    });

    await ActivityService.record({
      userId,
      entityType: "Lead",
      entityId: id,
      type: "STATUS_CHANGE",
      title: `Lead Details Updated`,
      description: `Updated contact/property attributes for ${updated.clientName}.`,
    });

    serverCache.invalidate("leads:");
    serverCache.invalidate("dashboard:");
    return updated;
  }

  public static async changeStatus(id: string, input: ChangeStatusInput, userId?: string) {
    const lead = await db.lead.findUnique({
      where: { id },
      include: { quotations: true },
    });

    if (!lead) throw new NotFoundError("Lead record not found");

    const targetStage = input.status;

    // 1. Quotation Stage Validation
    if (targetStage === "ESTIMATE_SENT" || targetStage === "QUOTATION_SENT") {
      const hasSentOrApprovedQuote = lead.quotations.some((q) => q.status === "APPROVED" || q.status === "SENT" || q.status === "READY_TO_SEND");
      if (!hasSentOrApprovedQuote && lead.quotations.length === 0) {
        throw new BusinessRuleError("Cannot advance to Quotation Sent without at least one Quotation record created.");
      }
    }

    // 2. Won Validation
    if (targetStage === "WON") {
      const hasApprovedQuote = lead.quotations.some((q) => q.status === "APPROVED");
      if (!hasApprovedQuote) {
        throw new BusinessRuleError("Cannot mark lead as Won without at least one Approved Quotation.");
      }
    }

    // 3. Lost Validation
    if (targetStage === "LOST" && !input.lossReason) {
      throw new ValidationError("A valid loss reason is mandatory when marking a lead as Lost.");
    }

    const oldStage = lead.stage;

    const updated = await db.lead.update({
      where: { id },
      data: {
        stage: targetStage,
        lossReasonKey: targetStage === "LOST" ? input.lossReason : null,
      },
    });

    // Record stage history
    await db.leadStageHistory.create({
      data: {
        leadId: id,
        fromStage: oldStage,
        toStage: targetStage,
        changedById: userId || null,
        notes: input.reopenReason
          ? `Reopened from Lost. Reason: ${input.reopenReason}`
          : input.lossReason
          ? `Marked Lost: ${input.lossReason}`
          : input.notes || null,
      },
    });

    await AuditService.logEvent({
      userId,
      action: "LEAD_STATUS_CHANGED",
      entityType: "Lead",
      entityId: id,
      oldValues: { stage: oldStage },
      newValues: { stage: targetStage, lossReason: input.lossReason, reopenReason: input.reopenReason },
    });

    await ActivityService.record({
      userId,
      entityType: "Lead",
      entityId: id,
      type: "STATUS_CHANGE",
      title: `Stage Changed: ${oldStage} → ${targetStage}`,
      description: input.lossReason
        ? `Loss Reason: ${input.lossReason}`
        : input.reopenReason
        ? `Reopen Reason: ${input.reopenReason}`
        : undefined,
    });

    serverCache.invalidate("leads:");
    serverCache.invalidate("dashboard:");
    return updated;
  }

  public static async assignLead(id: string, assignedToId: string, userId?: string) {
    const lead = await db.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundError("Lead record not found");

    const newAssignee = await db.user.findUnique({ where: { id: assignedToId } });
    if (!newAssignee) throw new NotFoundError("Assignee user account not found");

    const oldAssigneeId = lead.assignedToId;

    const updated = await db.lead.update({
      where: { id },
      data: { assignedToId },
      include: {
        assignedTo: { select: { id: true, fullName: true, email: true } },
      },
    });

    await AuditService.logEvent({
      userId,
      action: "LEAD_ASSIGNED",
      entityType: "Lead",
      entityId: id,
      oldValues: { assignedToId: oldAssigneeId },
      newValues: { assignedToId },
    });

    await ActivityService.record({
      userId,
      entityType: "Lead",
      entityId: id,
      type: "STATUS_CHANGE",
      title: `Lead Assigned to ${newAssignee.fullName}`,
      description: `Assigned on ${new Date().toLocaleDateString()}`,
    });

    await NotificationService.create({
      userId: assignedToId,
      type: "LEAD_ASSIGNED",
      title: `Lead Assigned: ${lead.referenceNo}`,
      message: `You have been assigned lead "${lead.clientName}" (${lead.referenceNo}).`,
      entityType: "Lead",
      entityId: lead.id,
      actionUrl: `/leads`,
    });

    return updated;
  }

  public static async linkExistingClient(leadId: string, clientId: string, userId?: string) {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundError("Lead not found");

    const client = await db.client.findUnique({ where: { id: clientId } });
    if (!client) throw new NotFoundError("Client not found");

    await db.client.update({
      where: { id: clientId },
      data: { leadId },
    });

    await AuditService.logEvent({
      userId,
      action: "CLIENT_LINKED_TO_LEAD",
      entityType: "Lead",
      entityId: leadId,
      newValues: { clientId, clientName: client.fullName },
    });

    await ActivityService.record({
      userId,
      entityType: "Lead",
      entityId: leadId,
      type: "STATUS_CHANGE",
      title: `Linked to Existing Client: ${client.fullName}`,
      description: `Client Reference: ${client.referenceNo}`,
    });

    return { success: true, client };
  }

  public static async getPipelineMetrics(actorUserId?: string) {
    const cacheKey = `leads:metrics:${actorUserId || "all"}`;
    const cached = serverCache.get<any>(cacheKey);
    if (cached) return cached;

    const where: Record<string, unknown> = {};

    if (actorUserId) {
      const isSuperAdmin = await RbacService.isSuperAdmin(actorUserId);
      const isAdmin = await RbacService.isAdmin(actorUserId);
      const hasReadAll = await RbacService.hasPermission(actorUserId, "leads:read_all");

      if (!isSuperAdmin && !isAdmin && !hasReadAll) {
        where.assignedToId = actorUserId;
      }
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const [
      totalLeads,
      activeLeads,
      wonLeads,
      lostLeads,
      followUpsDue,
      siteVisitsScheduled,
      quotationsSent,
      inNegotiation,
      activeLeadsList,
      wonLeadsList,
      stageGroupCounts,
      sourceGroupCounts,
    ] = await Promise.all([
      db.lead.count({ where }),
      db.lead.count({ where: { ...where, stage: { notIn: ["WON", "PROJECT_CREATED", "LOST"] } } }),
      db.lead.count({ where: { ...where, stage: { in: ["WON", "PROJECT_CREATED"] } } }),
      db.lead.count({ where: { ...where, stage: "LOST" } }),
      db.leadFollowUp.count({
        where: {
          status: "PENDING",
          followUpDate: { lte: today },
          lead: where,
        },
      }),
      db.leadSiteVisit.count({
        where: {
          status: "SCHEDULED",
          lead: where,
        },
      }),
      db.lead.count({
        where: {
          ...where,
          stage: { in: ["QUOTATION_SENT", "ESTIMATE_SENT"] },
        },
      }),
      db.lead.count({ where: { ...where, stage: "NEGOTIATION" } }),
      db.lead.findMany({
        where: { ...where, stage: { notIn: ["WON", "PROJECT_CREATED", "LOST"] } },
        select: { estimatedBudget: true },
      }),
      db.lead.findMany({
        where: { ...where, stage: { in: ["WON", "PROJECT_CREATED"] } },
        select: { estimatedBudget: true, quotations: { where: { status: "APPROVED" }, select: { totalAmount: true } } },
      }),
      db.lead.groupBy({
        by: ["stage"],
        where,
        _count: { _all: true },
        _sum: { estimatedBudget: true },
      }),
      db.lead.groupBy({
        by: ["sourceKey"],
        where,
        _count: { _all: true },
      }),
    ]);

    const pipelineExpectedValue = activeLeadsList.reduce((sum, l) => sum + (l.estimatedBudget || 0), 0);
    const wonValue = wonLeadsList.reduce((sum, l) => {
      const approvedTotal = l.quotations[0]?.totalAmount;
      return sum + (approvedTotal !== undefined ? approvedTotal : (l.estimatedBudget || 0));
    }, 0);

    const conversionRate = (wonLeads + lostLeads > 0)
      ? Math.round((wonLeads / (wonLeads + lostLeads)) * 100)
      : totalLeads > 0
      ? Math.round((wonLeads / totalLeads) * 100)
      : 0;

    const result = {
      totalLeads,
      activeLeads,
      wonLeads,
      lostLeads,
      followUpsDue,
      siteVisitsScheduled,
      quotationsSent,
      inNegotiation,
      conversionRate,
      pipelineExpectedValue,
      wonValue,
      byStage: stageGroupCounts.map((g) => ({
        stage: this.normalizeStage(g.stage),
        count: g._count._all,
        value: g._sum.estimatedBudget || 0,
      })),
      bySource: sourceGroupCounts.map((g) => ({
        source: g.sourceKey,
        count: g._count._all,
      })),
    };

    serverCache.set(cacheKey, result, 30);
    return result;
  }

  /**
   * Lead Source ROI Tracking Calculation
   */
  public static async getLeadSourceRoi() {
    const cacheKey = `leads:roi`;
    const cached = serverCache.get<any>(cacheKey);
    if (cached) return cached;

    const [sources, leadsBySource, wonLeadsBySource, marketingExpenses] = await Promise.all([
      db.leadSourceConfig.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
      }),
      db.lead.groupBy({
        by: ["sourceKey"],
        _count: { _all: true },
        _sum: { estimatedBudget: true },
      }),
      db.lead.findMany({
        where: { stage: { in: ["WON", "PROJECT_CREATED"] } },
        select: {
          sourceKey: true,
          estimatedBudget: true,
          quotations: { where: { status: "APPROVED" }, select: { totalAmount: true } },
          project: { select: { contractValue: true } },
        },
      }),
      db.expense.findMany({
        where: {
          status: "APPROVED",
          OR: [
            { categoryKey: "MARKETING" },
            { categoryKey: "ADVERTISING" },
            { description: { contains: "MARKETING" } },
            { description: { contains: "ADS" } },
          ],
        },
        select: { amount: true, description: true, categoryKey: true },
      }),
    ]);

    const leadCountMap = new Map<string, { total: number; totalBudget: number }>();
    leadsBySource.forEach((item) => {
      leadCountMap.set(item.sourceKey, {
        total: item._count._all,
        totalBudget: item._sum.estimatedBudget || 0,
      });
    });

    const wonValueMap = new Map<string, { count: number; revenue: number }>();
    wonLeadsBySource.forEach((lead) => {
      const existing = wonValueMap.get(lead.sourceKey) || { count: 0, revenue: 0 };
      const contractVal = lead.project?.contractValue || lead.quotations[0]?.totalAmount || lead.estimatedBudget || 0;
      wonValueMap.set(lead.sourceKey, {
        count: existing.count + 1,
        revenue: existing.revenue + contractVal,
      });
    });

    // Calculate marketing spend per source if descriptions mention the source key, otherwise distribute evenly or 0
    const sourceStats = sources.map((source) => {
      const leadData = leadCountMap.get(source.key) || { total: 0, totalBudget: 0 };
      const wonData = wonValueMap.get(source.key) || { count: 0, revenue: 0 };

      // Calculate source-specific spend
      const directSpend = marketingExpenses
        .filter((e) => e.description?.toUpperCase().includes(source.key.toUpperCase()) || e.description?.toUpperCase().includes(source.name.toUpperCase()))
        .reduce((sum, e) => sum + e.amount, 0);

      const totalLeads = leadData.total;
      const wonLeads = wonData.count;
      const wonRevenue = wonData.revenue;
      const spend = directSpend;

      const conversionRatePct = totalLeads > 0 ? Number(((wonLeads / totalLeads) * 100).toFixed(1)) : 0;
      const costPerLead = spend > 0 && totalLeads > 0 ? Number((spend / totalLeads).toFixed(0)) : 0;
      const costPerAcquisition = spend > 0 && wonLeads > 0 ? Number((spend / wonLeads).toFixed(0)) : 0;
      const netProfit = wonRevenue - spend;
      const roiPct = spend > 0 ? Number((((wonRevenue - spend) / spend) * 100).toFixed(1)) : null;

      return {
        sourceKey: source.key,
        sourceName: source.name,
        totalLeads,
        wonLeads,
        conversionRatePct,
        wonRevenue,
        spend,
        costPerLead,
        costPerAcquisition,
        netProfit,
        roiPct,
      };
    });

    const totalLeadsAll = sourceStats.reduce((s, x) => s + x.totalLeads, 0);
    const totalWonAll = sourceStats.reduce((s, x) => s + x.wonLeads, 0);
    const totalRevenueAll = sourceStats.reduce((s, x) => s + x.wonRevenue, 0);
    const totalSpendAll = sourceStats.reduce((s, x) => s + x.spend, 0);
    const overallConversionPct = totalLeadsAll > 0 ? Number(((totalWonAll / totalLeadsAll) * 100).toFixed(1)) : 0;
    const overallRoiPct = totalSpendAll > 0 ? Number((((totalRevenueAll - totalSpendAll) / totalSpendAll) * 100).toFixed(1)) : null;

    const result = {
      summary: {
        totalLeads: totalLeadsAll,
        totalWon: totalWonAll,
        totalRevenue: totalRevenueAll,
        totalSpend: totalSpendAll,
        overallConversionPct,
        overallRoiPct,
      },
      sources: sourceStats,
    };

    serverCache.set(cacheKey, result, 60);
    return result;
  }

  public static async deleteLead(id: string, userId?: string) {
    const lead = await db.lead.findUnique({
      where: { id },
      include: { quotations: true, project: true },
    });

    if (!lead) throw new NotFoundError("Lead record not found");

    if (lead.project) {
      throw new BusinessRuleError("Cannot delete lead linked to an existing project. Use archive instead.");
    }

    if (lead.quotations.length > 0) {
      throw new BusinessRuleError("Cannot delete lead with linked quotation history.");
    }

    await db.lead.delete({ where: { id } });

    await AuditService.logEvent({
      userId,
      action: "LEAD_DELETED",
      entityType: "Lead",
      entityId: id,
      oldValues: { referenceNo: lead.referenceNo, clientName: lead.clientName },
    });

    return { success: true, message: `Lead ${lead.referenceNo} removed` };
  }
}

export const leadService = LeadService;
