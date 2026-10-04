import { db } from "@/lib/db";
import { NotFoundError, BusinessRuleError } from "@/lib/errors";
import { AuditService } from "../audit/audit.service";
import { serverCache } from "@/lib/server-cache";

export interface MoveToTrashInput {
  entityType: "LEAD" | "QUOTATION" | "INVOICE" | "PAYMENT" | "EXPENSE" | "PROJECT" | "CLIENT" | "VENDOR" | "TASK" | "OTHER";
  entityId: string;
  title: string;
  subtitle?: string;
  category?: "CRM" | "QUOTATION" | "FINANCE" | "PROJECTS" | "PROCUREMENT" | "GENERAL";
  amount?: number;
  payload: Record<string, any>;
  deletedById?: string;
  reason?: string;
}

export interface TrashFilterParams {
  category?: string; // "ALL" | "LEAD" | "QUOTATION" | "INVOICE" | "PAYMENT" | "EXPENSE" | "PROJECT" | "CLIENT" | "VENDOR"
  search?: string;
  page?: number;
  limit?: number;
}

export class TrashService {
  /**
   * Move an entity snapshot to Trash before removal from main tables.
   */
  public static async moveToTrash(input: MoveToTrashInput) {
    let category = input.category;
    if (!category) {
      if (input.entityType === "LEAD" || input.entityType === "CLIENT") category = "CRM";
      else if (input.entityType === "QUOTATION") category = "QUOTATION";
      else if (input.entityType === "INVOICE" || input.entityType === "PAYMENT" || input.entityType === "EXPENSE") category = "FINANCE";
      else if (input.entityType === "PROJECT") category = "PROJECTS";
      else if (input.entityType === "VENDOR") category = "PROCUREMENT";
      else category = "GENERAL";
    }

    let trashItem = null;
    try {
      if ((db as any).trashItem) {
        trashItem = await (db as any).trashItem.create({
          data: {
            entityType: input.entityType,
            entityId: input.entityId,
            title: input.title,
            subtitle: input.subtitle || null,
            category,
            amount: input.amount ?? null,
            deletedById: input.deletedById || null,
            deletedAt: new Date(),
            payload: JSON.stringify(input.payload),
            metadata: JSON.stringify({ deletedBy: input.deletedById, reason: input.reason }),
            reason: input.reason || null,
          },
        });
      }
    } catch {
      // Non-blocking if table is not yet migrated
    }

    if (input.deletedById) {
      await AuditService.log({
        userId: input.deletedById,
        action: "TRASH_MOVE",
        entityType: input.entityType,
        entityId: input.entityId,
        newValues: {
          trashId: trashItem.id,
          title: input.title,
          category,
          amount: input.amount,
        },
      }).catch(() => null);
    }

    serverCache.clear();
    return trashItem;
  }

  /**
   * Retrieve paginated trash items by category and search.
   */
  public static async getTrashItems(filters: TrashFilterParams = {}) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.category && filters.category !== "ALL") {
      const cat = filters.category.toUpperCase();
      if (["LEAD", "QUOTATION", "INVOICE", "PAYMENT", "EXPENSE", "PROJECT", "CLIENT", "VENDOR"].includes(cat)) {
        where.entityType = cat;
      } else {
        where.category = cat;
      }
    }

    if (filters.search && filters.search.trim().length > 0) {
      const q = filters.search.trim();
      where.OR = [
        { title: { contains: q } },
        { subtitle: { contains: q } },
        { entityType: { contains: q } },
        { reason: { contains: q } },
      ];
    }

    const [items, total] = await Promise.all([
      (db as any).trashItem.findMany({
        where,
        orderBy: { deletedAt: "desc" },
        skip,
        take: limit,
        include: {
          deletedBy: {
            select: { id: true, fullName: true, email: true },
          },
        },
      }),
      (db as any).trashItem.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get Category Count Statistics for Trash Tabs
   */
  public static async getTrashStats() {
    const [
      allCount,
      leadsCount,
      quotesCount,
      invoicesCount,
      paymentsCount,
      expensesCount,
      projectsCount,
      clientsCount,
    ] = await Promise.all([
      (db as any).trashItem.count(),
      (db as any).trashItem.count({ where: { entityType: "LEAD" } }),
      (db as any).trashItem.count({ where: { entityType: "QUOTATION" } }),
      (db as any).trashItem.count({ where: { entityType: "INVOICE" } }),
      (db as any).trashItem.count({ where: { entityType: "PAYMENT" } }),
      (db as any).trashItem.count({ where: { entityType: "EXPENSE" } }),
      (db as any).trashItem.count({ where: { entityType: "PROJECT" } }),
      (db as any).trashItem.count({ where: { entityType: "CLIENT" } }),
    ]);

    return {
      all: allCount,
      lead: leadsCount,
      quotation: quotesCount,
      invoice: invoicesCount,
      payment: paymentsCount,
      expense: expensesCount,
      project: projectsCount,
      client: clientsCount,
    };
  }

  /**
   * RESTORE an item from Trash back to its active state in the database.
   */
  public static async restoreItem(trashId: string, userId?: string) {
    const trashItem = await (db as any).trashItem.findUnique({
      where: { id: trashId },
    });

    if (!trashItem) {
      throw new NotFoundError("Trash item not found");
    }

    let payload: any = {};
    try {
      payload = JSON.parse(trashItem.payload);
    } catch {
      payload = {};
    }

    const { entityType, entityId } = trashItem;

    await db.$transaction(async (tx) => {
      // 1. Restore LEAD
      if (entityType === "LEAD") {
        const existing = await tx.lead.findUnique({ where: { id: entityId } });
        if (existing) {
          await tx.lead.update({
            where: { id: entityId },
            data: { stage: payload.stage || "NEW" },
          });
        } else {
          // Re-create Lead
          await tx.lead.create({
            data: {
              id: entityId,
              referenceNo: payload.referenceNo || `LEAD-${Date.now().toString().slice(-4)}`,
              clientName: payload.clientName || "Restored Lead",
              phone: payload.phone || "",
              email: payload.email || null,
              location: payload.location || null,
              propertyTypeKey: payload.propertyTypeKey || "APARTMENT_INTERIOR",
              sourceKey: payload.sourceKey || "DIRECT",
              stage: payload.stage || "NEW",
              priority: payload.priority || "MEDIUM",
              estimatedBudget: payload.estimatedBudget ? Number(payload.estimatedBudget) : null,
              requirement: payload.requirement || null,
              notes: payload.notes || null,
              assignedToId: payload.assignedToId || null,
              clientId: payload.clientId || null,
            },
          });
        }
      }

      // 2. Restore QUOTATION
      else if (entityType === "QUOTATION") {
        const existing = await tx.quotation.findUnique({ where: { id: entityId } });
        if (existing) {
          await tx.quotation.update({
            where: { id: entityId },
            data: { status: payload.status || "APPROVED" },
          });
        } else {
          await tx.quotation.create({
            data: {
              id: entityId,
              referenceNo: payload.referenceNo || `Q-${Date.now().toString().slice(-4)}`,
              title: payload.title || "Restored Quotation",
              status: payload.status || "APPROVED",
              totalAmount: Number(payload.totalAmount || 0),
              subtotal: Number(payload.subtotal || payload.subtotalAmount || 0),
              taxAmount: Number(payload.taxAmount || 0),
              discountAmount: Number(payload.discountAmount || 0),
              leadId: payload.leadId || null,
              projectId: payload.projectId || null,
              clientId: payload.clientId || null,
              clientSnapshot: payload.clientSnapshot || null,
              termsAndConditions: payload.termsAndConditions || null,
              items: payload.items && Array.isArray(payload.items) ? {
                create: payload.items.map((it: any) => ({
                  category: it.category || "MODULAR_WOODWORK",
                  itemType: it.itemType || "CUSTOM",
                  itemDescription: it.itemDescription || "Item",
                  specifications: it.specifications || null,
                  room: it.room || "GENERAL",
                  quantity: Number(it.quantity) || 1,
                  unitKey: it.unitKey || "NOS",
                  unitRate: Number(it.unitRate) || 0,
                  totalAmount: Number(it.totalAmount) || 0,
                }))
              } : undefined,
            },
          });
        }
      }

      // 3. Restore PAYMENT
      else if (entityType === "PAYMENT") {
        const existing = await tx.clientPayment.findUnique({ where: { id: entityId } });
        if (existing) {
          await tx.clientPayment.update({
            where: { id: entityId },
            data: { status: payload.status || "RECORDED" },
          });
        } else {
          await tx.clientPayment.create({
            data: {
              id: entityId,
              referenceNo: payload.referenceNo || `PAY-${Date.now().toString().slice(-4)}`,
              amount: Number(payload.amount || 0),
              paymentDate: payload.paymentDate ? new Date(payload.paymentDate) : new Date(),
              paymentMethod: payload.paymentMethod || "UPI",
              status: payload.status || "RECORDED",
              leadId: payload.leadId || null,
              projectId: payload.projectId || null,
              quotationId: payload.quotationId || null,
              clientId: payload.clientId || null,
              notes: payload.notes || "Restored payment",
              referenceNoExt: payload.referenceNoExt || null,
            },
          });
        }
      }

      // 4. Restore INVOICE
      else if (entityType === "INVOICE") {
        const existing = await tx.gstInvoice.findUnique({ where: { id: entityId } });
        if (existing) {
          await tx.gstInvoice.update({
            where: { id: entityId },
            data: { status: payload.status || "ISSUED" },
          });
        } else {
          await tx.gstInvoice.create({
            data: {
              id: entityId,
              invoiceNo: payload.invoiceNo || `INV-${Date.now().toString().slice(-4)}`,
              invoiceDate: payload.invoiceDate ? new Date(payload.invoiceDate) : new Date(),
              customerName: payload.customerName || "Customer",
              stateCode: payload.stateCode || "36",
              placeOfSupply: payload.placeOfSupply || "Telangana",
              isInterState: payload.isInterState || false,
              taxableAmount: Number(payload.taxableAmount || 0),
              cgstAmount: Number(payload.cgstAmount || 0),
              sgstAmount: Number(payload.sgstAmount || 0),
              igstAmount: Number(payload.igstAmount || 0),
              totalTax: Number(payload.totalTax || 0),
              roundOff: Number(payload.roundOff || 0),
              grandTotal: Number(payload.grandTotal || 0),
              paidAmount: Number(payload.paidAmount || 0),
              outstandingAmount: Number(payload.outstandingAmount || 0),
              status: payload.status || "ISSUED",
              clientId: payload.clientId || null,
              projectId: payload.projectId || null,
              quotationId: payload.quotationId || null,
              notes: payload.notes || null,
            },
          });
        }
      }

      // 5. Restore EXPENSE
      else if (entityType === "EXPENSE") {
        const existing = await tx.expense.findUnique({ where: { id: entityId } });
        if (existing) {
          await tx.expense.update({
            where: { id: entityId },
            data: { status: payload.status || "APPROVED" },
          });
        } else {
          await tx.expense.create({
            data: {
              id: entityId,
              referenceNo: payload.referenceNo || `EXP-${Date.now().toString().slice(-4)}`,
              expenseType: payload.expenseType || "PROJECT",
              description: payload.description || payload.title || "Restored Expense",
              amount: Number(payload.amount || 0),
              expenseDate: payload.expenseDate ? new Date(payload.expenseDate) : new Date(),
              paymentMethod: payload.paymentMethod || "CASH",
              categoryKey: payload.categoryKey || "GENERAL",
              status: payload.status || "APPROVED",
              leadId: payload.leadId || null,
              projectId: payload.projectId || null,
              createdById: payload.createdById || null,
              notes: payload.notes || null,
            },
          });
        }
      }

      // 6. Delete from TrashItem table
      await (tx as any).trashItem.delete({
        where: { id: trashId },
      });
    });

    serverCache.clear();

    if (userId) {
      await AuditService.log({
        userId,
        action: "RESTORE",
        entityType,
        entityId,
        newValues: {
          trashId,
          restoredAt: new Date().toISOString(),
        },
      }).catch(() => null);
    }

    return {
      success: true,
      message: `${trashItem.title || entityType} has been successfully restored to active records.`,
    };
  }

  /**
   * Permanently delete a record from Trash.
   */
  public static async permanentlyDelete(trashId: string, userId?: string) {
    const trashItem = await (db as any).trashItem.findUnique({
      where: { id: trashId },
    });

    if (!trashItem) {
      throw new NotFoundError("Trash item not found");
    }

    await (db as any).trashItem.delete({
      where: { id: trashId },
    });

    if (userId) {
      await AuditService.log({
        userId,
        action: "PERMANENT_DELETE",
        entityType: trashItem.entityType,
        entityId: trashItem.entityId,
        oldValues: {
          trashId,
          title: trashItem.title,
        },
      }).catch(() => null);
    }

    return { success: true, message: "Item permanently deleted from Trash." };
  }

  /**
   * Empty Trash (optionally by category).
   */
  public static async emptyTrash(category?: string, userId?: string) {
    const where: any = {};
    if (category && category !== "ALL") {
      const cat = category.toUpperCase();
      if (["LEAD", "QUOTATION", "INVOICE", "PAYMENT", "EXPENSE", "PROJECT", "CLIENT", "VENDOR"].includes(cat)) {
        where.entityType = cat;
      } else {
        where.category = cat;
      }
    }

    const count = await (db as any).trashItem.count({ where });

    await (db as any).trashItem.deleteMany({ where });

    if (userId) {
      await AuditService.log({
        userId,
        action: "EMPTY_TRASH",
        entityType: "TRASH",
        newValues: { count, category: category || "ALL" },
      }).catch(() => null);
    }

    return { success: true, message: `Successfully cleared ${count} item(s) from Trash.` };
  }
}
