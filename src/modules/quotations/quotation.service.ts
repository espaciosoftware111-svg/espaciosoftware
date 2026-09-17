import { db } from "@/lib/db";
import {
  AppError,
  BusinessRuleError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/errors";
import { IdGeneratorService } from "@/lib/id-generator";
import { AuditService } from "../audit/audit.service";
import { ActivityService } from "../activity/activity.service";
import { NotificationService } from "../notifications/notification.service";
import { RbacService } from "../rbac/rbac.service";
import { serverCache } from "@/lib/server-cache";
import { ConcurrentActionGuard } from "@/lib/action-guard";
import {
  CreateQuotationInput,
  UpdateQuotationInput,
  UpdateQuotationStatusInput,
  ApproveQuotationInput,
  QuotationItemInput,
} from "@/validators/quotation.schema";

export interface QuotationFilterParams {
  search?: string;
  status?: string;
  quotationType?: string;
  leadId?: string;
  projectId?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export class QuotationService {
  /**
   * Helper: Round number to 2 decimal places
   */
  private static round2(val: number): number {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

  /**
   * Centralized Calculation Engine for Quotation Totals & Margins
   */
  public static calculateTotals(
    items: QuotationItemInput[],
    discountType?: string | null,
    discountValue: number = 0,
    taxRate: number = 0,
    adjustmentAmount: number = 0
  ) {
    let subtotal = 0;
    let totalInternalCost = 0;

    const processedItems = items.map((item, index) => {
      const length = item.length || null;
      const height = item.height || null;

      // Quantity calculation: If length & height provided and unit is SQFT, area = length * height
      let quantity = item.quantity;
      if (length && height && item.unitKey === "SQFT" && (!quantity || quantity === 1)) {
        quantity = this.round2(length * height);
      }

      const itemRate = item.unitRate || 0;
      const itemDisc = Math.max(0, item.discountAmount || 0);
      const grossAmount = this.round2(quantity * itemRate);
      const lineTotal = Math.max(0, this.round2(grossAmount - itemDisc));

      subtotal += lineTotal;

      if (item.internalCostRate) {
        totalInternalCost += this.round2(quantity * item.internalCostRate);
      }

      return {
        ...item,
        length,
        height,
        quantity,
        discountAmount: itemDisc,
        totalAmount: lineTotal,
        sortOrder: item.sortOrder ?? index,
      };
    });

    subtotal = this.round2(subtotal);

    // Quotation-level discount
    let discountAmount = 0;
    if (discountType === "PERCENTAGE" && discountValue > 0) {
      discountAmount = this.round2((subtotal * Math.min(100, discountValue)) / 100);
    } else if (discountType === "FIXED" && discountValue > 0) {
      discountAmount = Math.min(subtotal, this.round2(discountValue));
    }

    const taxableAmount = Math.max(0, this.round2(subtotal - discountAmount));
    const taxAmount = taxRate > 0 ? this.round2((taxableAmount * taxRate) / 100) : 0;
    const finalAdjustment = this.round2(adjustmentAmount || 0);
    const totalAmount = Math.max(0, this.round2(taxableAmount + taxAmount + finalAdjustment));

    // Internal margin calculations
    const estimatedMargin = this.round2(taxableAmount - totalInternalCost);
    const marginPercentage = taxableAmount > 0 ? this.round2((estimatedMargin / taxableAmount) * 100) : 0;

    return {
      items: processedItems,
      subtotal,
      discountAmount,
      taxableAmount,
      taxAmount,
      adjustmentAmount: finalAdjustment,
      totalAmount,
      totalInternalCost: this.round2(totalInternalCost),
      estimatedMargin,
      marginPercentage,
    };
  }

  /**
   * List quotations with filtering, search, pagination, and RBAC pricing masking
   */
  public static async getQuotations(filters: QuotationFilterParams = {}, actorId?: string) {
    const cacheKey = `quotations:list:${JSON.stringify({ filters, actorId })}`;
    const cached = serverCache.get<any>(cacheKey);
    if (cached) return cached;

    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 25));
    const skip = (page - 1) * limit;

    let canManagePricing = false;
    if (actorId) {
      const isSuper = await RbacService.isUserSuperAdmin(actorId);
      const hasPricing = await RbacService.hasPermission(actorId, "quotations:manage_pricing");
      canManagePricing = isSuper || hasPricing;
    }

    const where: any = {};

    if (filters.status && filters.status !== "ALL") {
      where.status = filters.status;
    }
    if (filters.leadId) {
      where.leadId = filters.leadId;
    }
    if (filters.projectId) {
      where.projectId = filters.projectId;
    }
    if (filters.clientId) {
      where.clientId = filters.clientId;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    if (filters.search) {
      const q = filters.search.trim();
      where.OR = [
        { referenceNo: { contains: q } },
        { title: { contains: q } },
        { lead: { clientName: { contains: q } } },
        { client: { fullName: { contains: q } } },
        { project: { title: { contains: q } } },
        { project: { referenceNo: { contains: q } } },
      ];
    }

    const [quotations, total, totalDraft, totalApproved, totalSent] = await Promise.all([
      db.quotation.findMany({
        where,
        include: {
          lead: { select: { id: true, referenceNo: true, clientName: true, phone: true, stage: true } },
          client: { select: { id: true, referenceNo: true, fullName: true, phone: true, email: true } },
          project: { select: { id: true, referenceNo: true, title: true, stage: true } },
          createdBy: { select: { id: true, fullName: true, email: true } },
          approvedBy: { select: { id: true, fullName: true, email: true } },
          payments: {
            where: { status: { in: ["RECORDED", "VERIFIED"] } },
            select: { amount: true },
          },
          _count: { select: { items: true, childRevisions: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.quotation.count({ where }),
      db.quotation.count({ where: { status: "DRAFT" } }),
      db.quotation.count({ where: { status: "APPROVED" } }),
      db.quotation.count({ where: { status: { in: ["SENT", "NEGOTIATION"] } } }),
    ]);

    const enrichedQuotations = quotations.map((q) => {
      let parsedSnapshot: any = {};
      try {
        if (q.clientSnapshot) {
          parsedSnapshot = JSON.parse(q.clientSnapshot);
        }
      } catch {
        parsedSnapshot = {};
      }

      const qType =
        parsedSnapshot.quotationType ||
        (q.project ? "PROJECT" : q.lead ? "LEAD" : q.title.toUpperCase().includes("MATERIAL") ? "MATERIAL" : "LEAD");
      const customTitle = parsedSnapshot.customTitle || q.title;
      const actualPaymentTotal = (q.payments || []).reduce((acc: number, p: any) => acc + p.amount, 0);
      const snapshotAdvance = Number(parsedSnapshot.advancePaid || 0);
      const advancePaid = Math.max(actualPaymentTotal, snapshotAdvance);
      const balanceDue = Math.max(0, this.round2(q.totalAmount - advancePaid));

      return {
        ...q,
        quotationType: qType,
        customTitle,
        advancePaid,
        balanceDue,
        showSignature: parsedSnapshot.showSignature !== false,
      };
    });

    const filteredQuotations =
      filters.quotationType && filters.quotationType !== "ALL"
        ? enrichedQuotations.filter((q) => q.quotationType === filters.quotationType)
        : enrichedQuotations;

    const result = {
      quotations: filteredQuotations,
      pagination: {
        page,
        limit,
        total: filters.quotationType && filters.quotationType !== "ALL" ? filteredQuotations.length : total,
        totalPages: Math.ceil((filters.quotationType && filters.quotationType !== "ALL" ? filteredQuotations.length : total) / limit),
      },
      metrics: {
        totalQuotations: total,
        totalDraft,
        totalApproved,
        totalActivePipeline: totalSent,
      },
    };

    serverCache.set(cacheKey, result, 15);
    return result;
  }

  /**
   * Retrieve complete quotation profile with grouped room BOQ and revision history
   */
  public static async getQuotationById(id: string, actorId?: string, isClientFacing: boolean = false) {
    const quotation = await db.quotation.findUnique({
      where: { id },
      include: {
        lead: {
          select: {
            id: true,
            referenceNo: true,
            clientName: true,
            phone: true,
            email: true,
            location: true,
            propertyTypeKey: true,
            stage: true,
          },
        },
        client: {
          select: {
            id: true,
            referenceNo: true,
            fullName: true,
            phone: true,
            email: true,
            address: true,
            city: true,
            state: true,
            gstin: true,
          },
        },
        project: {
          select: {
            id: true,
            referenceNo: true,
            title: true,
            stage: true,
            contractValue: true,
            siteAddress: true,
          },
        },
        createdBy: { select: { id: true, fullName: true, email: true } },
        approvedBy: { select: { id: true, fullName: true, email: true } },
        parentQuotation: {
          select: {
            id: true,
            referenceNo: true,
            revision: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
        childRevisions: {
          select: {
            id: true,
            referenceNo: true,
            revision: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
          orderBy: { revision: "asc" },
        },
        payments: {
          where: { status: { in: ["RECORDED", "VERIFIED"] } },
          select: { id: true, referenceNo: true, amount: true, status: true, paymentDate: true, paymentMethod: true },
          orderBy: { paymentDate: "desc" },
        },
        items: {
          orderBy: [{ room: "asc" }, { sortOrder: "asc" }],
        },
      },
    });

    if (!quotation) {
      throw new NotFoundError("Quotation not found");
    }

    let canManagePricing = false;
    if (actorId) {
      const isSuper = await RbacService.isUserSuperAdmin(actorId);
      const hasPricing = await RbacService.hasPermission(actorId, "quotations:manage_pricing");
      canManagePricing = isSuper || hasPricing;
    }

    // Client facing or unauthorized view: Redact internal notes & internal cost rates
    const sanitizeInternal = isClientFacing || !canManagePricing;

    const sanitizedItems = quotation.items.map((item) => ({
      ...item,
      internalCostRate: sanitizeInternal ? undefined : item.internalCostRate,
    }));

    // Group items room-wise
    const roomGroups: Record<
      string,
      {
        room: string;
        subtotal: number;
        items: typeof sanitizedItems;
      }
    > = {};

    for (const item of sanitizedItems) {
      const roomName = item.room || "General";
      if (!roomGroups[roomName]) {
        roomGroups[roomName] = {
          room: roomName,
          subtotal: 0,
          items: [],
        };
      }
      roomGroups[roomName].items.push(item);
      roomGroups[roomName].subtotal = this.round2(roomGroups[roomName].subtotal + item.totalAmount);
    }

    let parsedSnapshot: any = {};
    try {
      if (quotation.clientSnapshot) {
        parsedSnapshot = JSON.parse(quotation.clientSnapshot);
      }
    } catch {
      parsedSnapshot = {};
    }

    const qType =
      parsedSnapshot.quotationType ||
      (quotation.project ? "PROJECT" : quotation.lead ? "LEAD" : quotation.title.toUpperCase().includes("MATERIAL") ? "MATERIAL" : "LEAD");
    const customTitle = parsedSnapshot.customTitle || quotation.title;
    const actualPayments = (quotation.payments || []).reduce((acc: number, p: any) => acc + p.amount, 0);
    const snapshotAdvance = Number(parsedSnapshot.advancePaid || 0);
    const advancePaid = Math.max(actualPayments, snapshotAdvance);
    const paymentType = parsedSnapshot.paymentType || "Advance Payment";
    const previousPayments = Number(parsedSnapshot.previousPayments || 0);
    const currentPayment = Number(parsedSnapshot.currentPayment !== undefined ? parsedSnapshot.currentPayment : snapshotAdvance);
    const totalPaid = Math.max(actualPayments, previousPayments + currentPayment, snapshotAdvance);
    const balanceDue = Math.max(0, this.round2(quotation.totalAmount - totalPaid));

    return {
      ...quotation,
      quotationType: qType,
      customTitle,
      advancePaid,
      paymentType,
      previousPayments,
      currentPayment,
      totalPaid,
      balanceDue,
      showSignature: parsedSnapshot.showSignature !== false,
      snapshotMetadata: parsedSnapshot,
      internalNotes: sanitizeInternal ? undefined : quotation.internalNotes,
      items: sanitizedItems,
      roomGroups: Object.values(roomGroups),
    };
  }

  /**
   * Create new quotation with auto-fill from Lead/Client/Project, calculation, and audit
   */
  public static async createQuotation(input: CreateQuotationInput, actorId?: string) {
    const lockKey = `QUOTATION:CREATE:${actorId || "SYS"}:${input.leadId || input.projectId || input.clientId || "GEN"}:${(input.title || "").trim()}`;
    return ConcurrentActionGuard.executeWithLock(lockKey, async () => {
    if (actorId) {
      const hasWrite = await RbacService.hasPermission(actorId, "quotations:write");
      const isAdmin = await RbacService.isUserAdmin(actorId);
      if (!hasWrite && !isAdmin) {
        throw new ForbiddenError("Insufficient permissions to create quotations");
      }
    }

    // 1. Snapshot client details if linked to Lead, Client or Project
    let clientId = input.clientId || null;
    let clientSnapshotObj: any = {};

    if (input.leadId) {
      const lead = await db.lead.findUnique({
        where: { id: input.leadId },
        include: { client: true },
      });
      if (lead) {
        clientSnapshotObj = {
          clientName: lead.clientName,
          phone: lead.phone,
          email: lead.email,
          location: lead.location,
          propertyTypeKey: lead.propertyTypeKey,
          source: "LEAD",
        };
        if (!clientId && lead.client) {
          clientId = lead.client.id;
        }
      }
    } else if (input.projectId) {
      const project = await db.project.findUnique({
        where: { id: input.projectId },
        include: { client: true },
      });
      if (project) {
        clientSnapshotObj = {
          projectTitle: project.title,
          siteAddress: project.siteAddress,
          clientName: project.client?.fullName,
          phone: project.client?.phone,
          email: project.client?.email,
          source: "PROJECT",
        };
        if (!clientId && project.clientId) {
          clientId = project.clientId;
        }
      }
    } else if (clientId) {
      const client = await db.client.findUnique({ where: { id: clientId } });
      if (client) {
        clientSnapshotObj = {
          clientName: client.fullName,
          phone: client.phone,
          email: client.email,
          address: client.address,
          city: client.city,
          source: "CLIENT",
        };
      }
    }

    // Merge full custom metadata into snapshot
    if (input.clientSnapshot) {
      try {
        const parsed = typeof input.clientSnapshot === "string" ? JSON.parse(input.clientSnapshot) : input.clientSnapshot;
        clientSnapshotObj = { ...clientSnapshotObj, ...parsed };
      } catch {
        // ignore parse error
      }
    }
    clientSnapshotObj.quotationType = input.quotationType || (input.projectId ? "PROJECT" : input.leadId ? "LEAD" : "MATERIAL");
    clientSnapshotObj.customTitle = input.customTitle || input.title || "Interior Design & Execution Quotation";
    clientSnapshotObj.showSignature = input.showSignature !== undefined ? input.showSignature : true;
    clientSnapshotObj.advancePaid = Number(input.advancePaid || 0);
    clientSnapshotObj.paymentType = input.paymentType || "Advance Payment";
    clientSnapshotObj.previousPayments = Number(input.previousPayments || 0);
    clientSnapshotObj.currentPayment = Number(input.currentPayment !== undefined ? input.currentPayment : (input.advancePaid || 0));

    // 2. Authoritative financial calculations
    const calc = this.calculateTotals(
      input.items,
      input.discountType,
      input.discountValue,
      input.taxRate,
      input.adjustmentAmount
    );

    const defaultValidity = input.validityDate
      ? new Date(input.validityDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default

    const finalTitle = input.customTitle || input.title || "Interior Design & Execution Quotation";

    let result: any;
    let attempts = 0;
    while (attempts < 5) {
      const referenceNo = await IdGeneratorService.generate("Q", attempts);
      try {
        result = await db.$transaction(async (tx) => {
          const quotation = await tx.quotation.create({
            data: {
              referenceNo,
              title: finalTitle,
              leadId: input.leadId || null,
              projectId: input.projectId || null,
              clientId,
              createdById: actorId || null,
              validityDate: defaultValidity,
              status: "DRAFT",
              revision: 1,
              subtotal: calc.subtotal,
              discountType: input.discountType || null,
              discountValue: input.discountValue || 0,
              discountAmount: calc.discountAmount,
              adjustmentAmount: calc.adjustmentAmount,
              adjustmentReason: input.adjustmentReason || null,
              taxRate: input.taxRate || 0,
              taxAmount: calc.taxAmount,
              totalAmount: calc.totalAmount,
              termsAndConditions: input.termsAndConditions || null,
              notes: input.notes || null,
              internalNotes: input.internalNotes || null,
              clientSnapshot: JSON.stringify(clientSnapshotObj),
              items: {
                create: calc.items.map((item, idx) => ({
                  room: item.room || "General",
                  category: item.category,
                  itemType: item.itemType || "CUSTOM",
                  materialId: item.materialId || null,
                  itemDescription: item.itemDescription,
                  specifications: item.specifications || null,
                  length: item.length || null,
                  height: item.height || null,
                  quantity: item.quantity,
                  unitKey: item.unitKey,
                  unitRate: item.unitRate,
                  internalCostRate: item.internalCostRate || null,
                  discountAmount: item.discountAmount || 0,
                  totalAmount: item.totalAmount,
                  sortOrder: idx,
                })),
              },
            },
            include: {
              items: true,
              lead: true,
              client: true,
              project: true,
            },
          });

          // Advance Lead stage if created for Lead
          if (input.leadId) {
            const linkedLead = await tx.lead.findUnique({ where: { id: input.leadId } });
            if (linkedLead) {
              const earlyStages = ["NEW", "NOT_CONTACTED", "CONTACTED", "FOLLOW_UP_SCHEDULED", "SITE_VISIT_SCHEDULED", "REQUIREMENTS_GATHERING"];
              if (earlyStages.includes(linkedLead.stage)) {
                const targetStage = "QUOTATION_IN_PROGRESS";
                await tx.lead.update({
                  where: { id: input.leadId },
                  data: { stage: targetStage },
                });
                await tx.leadStageHistory.create({
                  data: {
                    leadId: input.leadId,
                    fromStage: linkedLead.stage,
                    toStage: targetStage,
                    changedById: actorId || null,
                    notes: `Quotation ${referenceNo} created in Quotation Studio`,
                  },
                });
              }
            }
          }

          return quotation;
        });
        break;
      } catch (err: any) {
        if (err?.code === "P2002" && (err?.message?.includes("referenceNo") || err?.meta?.target?.includes("referenceNo")) && attempts < 4) {
          attempts++;
          continue;
        }
        throw err;
      }
    }

    serverCache.invalidate("leads:");

    // 4. Audit & Activity logging
    await AuditService.logEvent({
      userId: actorId,
      action: "QUOTATION_CREATED",
      entityType: "Quotation",
      entityId: result.id,
      newValues: {
        referenceNo: result.referenceNo,
        totalAmount: result.totalAmount,
        itemCount: result.items.length,
        leadId: result.leadId,
        projectId: result.projectId,
      },
    });

    await ActivityService.record({
      userId: actorId,
      entityType: "Quotation",
      entityId: result.id,
      type: "CREATION",
      title: `Quotation Draft Created: ${result.referenceNo}`,
      description: `Quotation for ₹${result.totalAmount.toLocaleString("en-IN")} with ${result.items.length} BOQ line items.`,
    });

    serverCache.invalidate("quotations:");

    return result;
    });
  }

  /**
   * Update existing editable quotation
   */
  public static async updateQuotation(id: string, input: UpdateQuotationInput, actorId?: string) {
    const lockKey = `QUOTATION:UPDATE:${id}:${actorId || "SYS"}`;
    return ConcurrentActionGuard.executeWithLock(lockKey, async () => {
    const existing = await db.quotation.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      throw new NotFoundError("Quotation not found");
    }

    if (existing.status === "APPROVED" || existing.status === "SUPERSEDED") {
      throw new BusinessRuleError(
        `Cannot directly edit quotation in status [${existing.status}]. Create a new revision version instead.`
      );
    }

    if (actorId) {
      const hasWrite = await RbacService.hasPermission(actorId, "quotations:write");
      const isAdmin = await RbacService.isUserAdmin(actorId);
      if (!hasWrite && !isAdmin) {
        throw new ForbiddenError("Insufficient permissions to edit quotation");
      }
    }

    // Determine items to calculate
    const itemsInput: QuotationItemInput[] = input.items && input.items.length > 0
      ? input.items
      : existing.items.map((i) => ({
          room: i.room,
          category: i.category,
          itemType: i.itemType as "CUSTOM" | "CATALOG",
          materialId: i.materialId,
          itemDescription: i.itemDescription,
          specifications: i.specifications,
          length: i.length,
          height: i.height,
          quantity: i.quantity,
          unitKey: i.unitKey as any,
          unitRate: i.unitRate,
          internalCostRate: i.internalCostRate,
          discountAmount: i.discountAmount,
          sortOrder: i.sortOrder,
        }));

    const discountType = input.discountType !== undefined ? input.discountType : existing.discountType;
    const discountValue = input.discountValue !== undefined ? input.discountValue : existing.discountValue;
    const taxRate = input.taxRate !== undefined ? input.taxRate : existing.taxRate;
    const adjustmentAmount = input.adjustmentAmount !== undefined ? input.adjustmentAmount : existing.adjustmentAmount;

    const calc = this.calculateTotals(itemsInput, discountType, discountValue, taxRate, adjustmentAmount);

    const updated = await db.$transaction(async (tx) => {
      // If new items provided, replace them
      if (input.items && input.items.length > 0) {
        await tx.quotationItem.deleteMany({ where: { quotationId: id } });
        await tx.quotationItem.createMany({
          data: calc.items.map((item, idx) => ({
            quotationId: id,
            room: item.room || "General",
            category: item.category,
            itemType: item.itemType || "CUSTOM",
            materialId: item.materialId || null,
            itemDescription: item.itemDescription,
            specifications: item.specifications || null,
            length: item.length || null,
            height: item.height || null,
            quantity: item.quantity,
            unitKey: item.unitKey,
            unitRate: item.unitRate,
            internalCostRate: item.internalCostRate || null,
            discountAmount: item.discountAmount || 0,
            totalAmount: item.totalAmount,
            sortOrder: idx,
          })),
        });
      }

      let updatedSnapshotObj: any = {};
      try {
        if (existing.clientSnapshot) {
          updatedSnapshotObj = JSON.parse(existing.clientSnapshot);
        }
      } catch {
        updatedSnapshotObj = {};
      }

      if (input.clientSnapshot) {
        try {
          const parsed = typeof input.clientSnapshot === "string" ? JSON.parse(input.clientSnapshot) : input.clientSnapshot;
          updatedSnapshotObj = { ...updatedSnapshotObj, ...parsed };
        } catch {
          // ignore
        }
      }

      if (input.quotationType) updatedSnapshotObj.quotationType = input.quotationType;
      if (input.customTitle) updatedSnapshotObj.customTitle = input.customTitle;
      if (input.showSignature !== undefined) updatedSnapshotObj.showSignature = input.showSignature;
      if (input.advancePaid !== undefined) updatedSnapshotObj.advancePaid = Number(input.advancePaid);
      if (input.paymentType !== undefined) updatedSnapshotObj.paymentType = input.paymentType;
      if (input.previousPayments !== undefined) updatedSnapshotObj.previousPayments = Number(input.previousPayments);
      if (input.currentPayment !== undefined) updatedSnapshotObj.currentPayment = Number(input.currentPayment);

      const updatedTitle = (input.customTitle || input.title || existing.title || "Interior Design & Execution Quotation") as string;

      return tx.quotation.update({
        where: { id },
        data: {
          title: updatedTitle,
          leadId: input.leadId !== undefined ? input.leadId : existing.leadId,
          projectId: input.projectId !== undefined ? input.projectId : existing.projectId,
          clientId: input.clientId !== undefined ? input.clientId : existing.clientId,
          validityDate: input.validityDate ? new Date(input.validityDate) : existing.validityDate,
          subtotal: calc.subtotal,
          discountType: discountType || null,
          discountValue: discountValue || 0,
          discountAmount: calc.discountAmount,
          adjustmentAmount: calc.adjustmentAmount,
          adjustmentReason: input.adjustmentReason !== undefined ? input.adjustmentReason : existing.adjustmentReason,
          taxRate: taxRate || 0,
          taxAmount: calc.taxAmount,
          totalAmount: calc.totalAmount,
          termsAndConditions: input.termsAndConditions !== undefined ? input.termsAndConditions : existing.termsAndConditions,
          notes: input.notes !== undefined ? input.notes : existing.notes,
          internalNotes: input.internalNotes !== undefined ? input.internalNotes : existing.internalNotes,
          clientSnapshot: JSON.stringify(updatedSnapshotObj),
        },
        include: { items: true },
      });
    });

    await AuditService.logEvent({
      userId: actorId,
      action: "QUOTATION_UPDATED",
      entityType: "Quotation",
      entityId: id,
      newValues: {
        referenceNo: updated.referenceNo,
        totalAmount: updated.totalAmount,
      },
    });

    serverCache.invalidate("quotations:");

    return updated;
    });
  }

  /**
   * Create a new version/revision of an existing quotation (e.g. V1 -> V2)
   */
  public static async createRevision(id: string, notes?: string, actorId?: string) {
    const parent = await db.quotation.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!parent) {
      throw new NotFoundError("Quotation not found");
    }

    if (actorId) {
      const hasWrite = await RbacService.hasPermission(actorId, "quotations:write");
      const isAdmin = await RbacService.isUserAdmin(actorId);
      if (!hasWrite && !isAdmin) {
        throw new ForbiddenError("Insufficient permissions to revise quotation");
      }
    }

    const nextRevision = parent.revision + 1;
    // Generate next reference with revision indicator or separate sequence
    const nextReferenceNo = `${parent.referenceNo.split("-V")[0]}-V${nextRevision}`;

    const newQuotation = await db.$transaction(async (tx) => {
      // Mark parent as superseded if not approved
      if (parent.status !== "APPROVED") {
        await tx.quotation.update({
          where: { id: parent.id },
          data: { status: "SUPERSEDED" },
        });
      }

      return tx.quotation.create({
        data: {
          referenceNo: nextReferenceNo,
          title: parent.title,
          leadId: parent.leadId,
          projectId: parent.projectId,
          clientId: parent.clientId,
          createdById: actorId || parent.createdById,
          validityDate: parent.validityDate,
          status: "DRAFT",
          revision: nextRevision,
          parentQuotationId: parent.id,
          subtotal: parent.subtotal,
          discountType: parent.discountType,
          discountValue: parent.discountValue,
          discountAmount: parent.discountAmount,
          adjustmentAmount: parent.adjustmentAmount,
          adjustmentReason: parent.adjustmentReason,
          taxRate: parent.taxRate,
          taxAmount: parent.taxAmount,
          totalAmount: parent.totalAmount,
          termsAndConditions: parent.termsAndConditions,
          notes: notes || parent.notes,
          internalNotes: parent.internalNotes,
          clientSnapshot: parent.clientSnapshot,
          items: {
            create: parent.items.map((i, idx) => ({
              room: i.room,
              category: i.category,
              itemType: i.itemType,
              materialId: i.materialId,
              itemDescription: i.itemDescription,
              specifications: i.specifications,
              length: i.length,
              height: i.height,
              quantity: i.quantity,
              unitKey: i.unitKey,
              unitRate: i.unitRate,
              internalCostRate: i.internalCostRate,
              discountAmount: i.discountAmount,
              totalAmount: i.totalAmount,
              sortOrder: idx,
            })),
          },
        },
        include: { items: true },
      });
    });

    await AuditService.logEvent({
      userId: actorId,
      action: "QUOTATION_REVISED",
      entityType: "Quotation",
      entityId: newQuotation.id,
      newValues: {
        referenceNo: newQuotation.referenceNo,
        parentQuotationId: parent.id,
        revision: nextRevision,
      },
    });

    await ActivityService.record({
      userId: actorId,
      entityType: "Quotation",
      entityId: newQuotation.id,
      type: "STATUS_CHANGE",
      title: `Quotation Revision ${nextRevision} Created`,
      description: `Created revision ${newQuotation.referenceNo} from parent ${parent.referenceNo}.`,
    });

    serverCache.invalidate("quotations:");

    return newQuotation;
  }

  /**
   * Update quotation status with lifecycle rules and audit trail
   */
  public static async updateStatus(id: string, input: UpdateQuotationStatusInput, actorId?: string) {
    const quotation = await db.quotation.findUnique({ where: { id } });
    if (!quotation) {
      throw new NotFoundError("Quotation not found");
    }

    if (quotation.status === "APPROVED" && input.status !== "APPROVED") {
      throw new BusinessRuleError("Cannot change status of an Approved quotation directly. Create a revision.");
    }

    if (input.status === "APPROVED") {
      return this.approveQuotation(id, { approvalNotes: input.notes }, actorId);
    }

    const dataToUpdate: any = {
      status: input.status,
      notes: input.notes || quotation.notes,
    };

    if (input.status === "SENT") {
      dataToUpdate.sentAt = new Date();
    }

    const updated = await db.quotation.update({
      where: { id },
      data: dataToUpdate,
    });

    await AuditService.logEvent({
      userId: actorId,
      action: "QUOTATION_STATUS_CHANGED",
      entityType: "Quotation",
      entityId: id,
      oldValues: { status: quotation.status },
      newValues: { status: input.status, notes: input.notes },
    });

    await ActivityService.record({
      userId: actorId,
      entityType: "Quotation",
      entityId: id,
      type: "STATUS_CHANGE",
      title: `Quotation Status: ${input.status}`,
      description: `Quotation ${quotation.referenceNo} transitioned to ${input.status}.`,
    });

    // Update linked Lead stage to QUOTATION_SENT when sent
    if ((input.status === "SENT" || input.status === "READY_TO_SEND") && quotation.leadId) {
      const linkedLead = await db.lead.findUnique({ where: { id: quotation.leadId } });
      if (linkedLead && linkedLead.stage !== "WON" && linkedLead.stage !== "LOST" && linkedLead.stage !== "QUOTATION_SENT") {
        await db.lead.update({
          where: { id: quotation.leadId },
          data: { stage: "QUOTATION_SENT" },
        });
        await db.leadStageHistory.create({
          data: {
            leadId: quotation.leadId,
            fromStage: linkedLead.stage,
            toStage: "QUOTATION_SENT",
            changedById: actorId || null,
            notes: `Quotation ${quotation.referenceNo} marked as ${input.status}`,
          },
        });
        serverCache.invalidate("leads:");
      }
    }

    serverCache.invalidate("quotations:");

    return updated;
  }

  /**
   * Approve Quotation (Explicit Client / Manager Sign-off)
   * Locks financial fields, records approval metadata, updates linked Lead/Project, and sends notifications.
   */
  public static async approveQuotation(id: string, input: ApproveQuotationInput, actorId?: string) {
    if (actorId) {
      const hasApprove = await RbacService.hasPermission(actorId, "quotations:approve");
      const isAdmin = await RbacService.isUserAdmin(actorId);
      if (!hasApprove && !isAdmin) {
        throw new ForbiddenError("Insufficient permissions to approve quotations");
      }
    }

    const quotation = await db.quotation.findUnique({
      where: { id },
      include: {
        lead: true,
        project: true,
      },
    });

    if (!quotation) {
      throw new NotFoundError("Quotation not found");
    }

    if (quotation.status === "APPROVED") {
      return quotation;
    }

    if (quotation.status === "CANCELLED" || quotation.status === "SUPERSEDED") {
      throw new BusinessRuleError(`Cannot approve a quotation with status [${quotation.status}].`);
    }

    const approved = await db.$transaction(async (tx) => {
      // 1. Update quotation status to APPROVED
      const q = await tx.quotation.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedById: actorId || null,
          clientApprovedName: input.clientApprovedName || null,
          approvalNotes: input.approvalNotes || null,
        },
      });

      // 2. Update linked Lead stage and value if applicable
      if (quotation.leadId) {
        await tx.lead.update({
          where: { id: quotation.leadId },
          data: {
            stage: "WON",
            estimatedBudget: quotation.totalAmount,
          },
        });
      }

      // 3. Update linked Project contractValue and revisedBudget if applicable
      if (quotation.projectId) {
        await tx.project.update({
          where: { id: quotation.projectId },
          data: {
            contractValue: quotation.totalAmount,
            revisedBudget: quotation.totalAmount,
          },
        });
      }

      return q;
    });

    // 4. Audit & Activity
    await AuditService.logEvent({
      userId: actorId,
      action: "QUOTATION_APPROVED",
      entityType: "Quotation",
      entityId: id,
      newValues: {
        referenceNo: approved.referenceNo,
        approvedAmount: approved.totalAmount,
        approvedById: actorId,
        clientApprovedName: input.clientApprovedName,
      },
    });

    await ActivityService.record({
      userId: actorId,
      entityType: "Quotation",
      entityId: id,
      type: "APPROVAL",
      title: `Quotation Approved: ${approved.referenceNo}`,
      description: `Quotation officially approved for ₹${approved.totalAmount.toLocaleString("en-IN")}.`,
    });

    // 5. Notify creator
    if (approved.createdById) {
      await NotificationService.create({
        userId: approved.createdById,
        title: "Quotation Approved",
        message: `Quotation ${approved.referenceNo} for ₹${approved.totalAmount.toLocaleString("en-IN")} has been approved.`,
        category: "PROJECT",
        priority: "HIGH",
        type: "QUOTATION_APPROVED",
        entityType: "Quotation",
        entityId: approved.id,
      });
    }

    serverCache.invalidate("quotations:");
    return approved;
  }

  /**
   * Delete Draft Quotation
   */
  public static async deleteQuotation(id: string, actorId?: string) {
    const quotation = await db.quotation.findUnique({ where: { id } });
    if (!quotation) {
      throw new NotFoundError("Quotation not found");
    }

    if (quotation.status !== "DRAFT") {
      throw new BusinessRuleError(`Cannot delete a non-draft quotation in status [${quotation.status}].`);
    }

    if (actorId) {
      const hasWrite = await RbacService.hasPermission(actorId, "quotations:write");
      const isAdmin = await RbacService.isUserAdmin(actorId);
      if (!hasWrite && !isAdmin) {
        throw new ForbiddenError("Insufficient permissions to delete quotation");
      }
    }

    await db.quotation.delete({ where: { id } });

    await AuditService.logEvent({
      userId: actorId,
      action: "QUOTATION_DELETED",
      entityType: "Quotation",
      entityId: id,
      oldValues: { referenceNo: quotation.referenceNo, totalAmount: quotation.totalAmount },
    });

    serverCache.invalidate("quotations:");

    return { success: true };
  }
}
