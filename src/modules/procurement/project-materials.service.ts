import { db } from "@/lib/db";
import { NotFoundError, BusinessRuleError } from "@/lib/errors";
import { AuditService } from "../audit/audit.service";
import { ActivityService } from "../activity/activity.service";

export interface ProjectMaterialsFilterParams {
  search?: string;
  projectId?: string;
  vendorId?: string;
  orderType?: string;
  materialStatus?: "Pending" | "Received" | string;
  paymentStatus?: "Unpaid" | "Partial" | "Paid" | string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class ProjectMaterialsService {
  /**
   * Retrieves all confirmed Project-related Material Orders with dynamic KPIs.
   * Strictly excludes unconfirmed, pending, rejected, and non-project orders.
   */
  public static async getProjectMaterials(params: ProjectMaterialsFilterParams) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    // Base query: strictly Project-linked, confirmed/issued material orders
    const where: any = {
      projectId: { not: null },
      status: { notIn: ["DRAFT", "CANCELLED", "REJECTED"] },
    };

    if (params.projectId && params.projectId.trim() !== "") {
      where.projectId = params.projectId.trim();
    }

    if (params.vendorId && params.vendorId.trim() !== "") {
      where.vendorId = params.vendorId.trim();
    }

    if (params.orderType && params.orderType.trim() !== "") {
      where.notes = { contains: params.orderType.trim(), mode: "insensitive" };
    }

    if (params.materialStatus) {
      if (params.materialStatus === "Received") {
        where.status = { in: ["RECEIVED", "FULFILLED"] };
      } else if (params.materialStatus === "Pending") {
        where.status = { in: ["CONFIRMED", "ISSUED", "ORDERED", "APPROVED"] };
      }
    }

    if (params.startDate || params.endDate) {
      where.poDate = {};
      if (params.startDate) where.poDate.gte = new Date(params.startDate);
      if (params.endDate) where.poDate.lte = new Date(params.endDate);
    }

    if (params.search && params.search.trim() !== "") {
      const q = params.search.trim();
      where.OR = [
        { referenceNo: { contains: q, mode: "insensitive" } },
        { project: { title: { contains: q, mode: "insensitive" } } },
        { project: { referenceNo: { contains: q, mode: "insensitive" } } },
        { vendor: { name: { contains: q, mode: "insensitive" } } },
        { items: { some: { materialName: { contains: q, mode: "insensitive" } } } },
      ];
    }

    const [totalCount, allMatchingPOs] = await Promise.all([
      db.purchaseOrder.count({ where }),
      db.purchaseOrder.findMany({
        where,
        orderBy: { poDate: "desc" },
        skip,
        take: limit,
        include: {
          project: {
            select: {
              id: true,
              referenceNo: true,
              title: true,
              stage: true,
              leadId: true,
              client: { select: { id: true, fullName: true, phone: true, email: true } },
            },
          },
          vendor: {
            select: {
              id: true,
              referenceNo: true,
              name: true,
              contactPerson: true,
              phone: true,
              email: true,
              categoryKey: true,
            },
          },
          items: true,
          vendorPayments: {
            where: { status: { not: "REVERSED" } },
            select: { id: true, amount: true, paymentDate: true, paymentMethod: true, referenceNoExt: true },
          },
        },
      }),
    ]);

    // Format items with computed payment and material statuses
    const formattedOrders = allMatchingPOs.map((po) => {
      const totalPaid = po.vendorPayments.reduce((acc, pay) => acc + (pay.amount || 0), 0);
      const remainingBalance = Math.max(0, po.grandTotal - totalPaid);

      let paymentStatus: "Unpaid" | "Partial" | "Paid" = "Unpaid";
      if (remainingBalance <= 0.01 && po.grandTotal > 0) {
        paymentStatus = "Paid";
      } else if (totalPaid > 0) {
        paymentStatus = "Partial";
      }

      const isReceived = po.status === "RECEIVED" || po.status === "FULFILLED";
      const materialStatus: "Pending" | "Received" = isReceived ? "Received" : "Pending";

      let orderType = "Raw Material";
      if (po.notes?.includes("Laminate Order") || po.notes?.includes("Laminate")) {
        orderType = "Laminate";
      } else if (po.notes?.includes("General Material") || po.notes?.includes("Hardware")) {
        orderType = "Hardware & Fittings";
      }

      return {
        id: po.id,
        referenceNo: po.referenceNo,
        poDate: po.poDate,
        expectedDeliveryDate: po.expectedDeliveryDate,
        finalOrderAmount: po.grandTotal,
        subtotal: po.subtotal,
        status: po.status,
        orderType,
        materialStatus,
        paymentStatus,
        totalPaid,
        remainingBalance,
        notes: po.notes,
        project: po.project
          ? {
              ...po.project,
              client: po.project.client
                ? {
                    id: po.project.client.id,
                    name: po.project.client.fullName,
                    fullName: po.project.client.fullName,
                    phone: po.project.client.phone,
                    email: po.project.client.email,
                  }
                : null,
            }
          : null,
        vendor: po.vendor,
        items: po.items.map((i) => ({
          id: i.id,
          materialName: i.materialName,
          quantity: i.quantity,
          unitKey: i.unitKey,
          referencePrice: i.rate,
          notes: i.description,
        })),
        payments: po.vendorPayments,
      };
    });

    // Post-filter by computed paymentStatus if requested
    let finalItems = formattedOrders;
    if (params.paymentStatus) {
      finalItems = formattedOrders.filter((o) => o.paymentStatus === params.paymentStatus);
    }

    // Dynamic KPI Cards Calculation across all confirmed project material orders in system
    const allProjectOrders = await db.purchaseOrder.findMany({
      where: {
        projectId: { not: null },
        status: { notIn: ["DRAFT", "CANCELLED", "REJECTED"] },
      },
      select: {
        id: true,
        grandTotal: true,
        status: true,
        vendorPayments: {
          where: { status: { not: "REVERSED" } },
          select: { amount: true },
        },
      },
    });

    let totalMaterialOrders = allProjectOrders.length;
    let totalMaterialValue = 0;
    let materialsReceived = 0;
    let materialsPending = 0;
    let totalPaidOverall = 0;

    for (const po of allProjectOrders) {
      totalMaterialValue += po.grandTotal;
      if (po.status === "RECEIVED" || po.status === "FULFILLED") {
        materialsReceived += 1;
      } else {
        materialsPending += 1;
      }

      for (const pay of po.vendorPayments) {
        totalPaidOverall += pay.amount;
      }
    }

    const totalRemainingPayable = Math.max(0, totalMaterialValue - totalPaidOverall);

    const summaryKPIs = {
      totalMaterialOrders,
      totalMaterialValue: Number(totalMaterialValue.toFixed(2)),
      materialsReceived,
      materialsPending,
      totalRemainingPayable: Number(totalRemainingPayable.toFixed(2)),
      totalPaid: Number(totalPaidOverall.toFixed(2)),
    };

    return {
      orders: finalItems,
      summary: summaryKPIs,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Retrieves single Material Order details for the side drawer/modal view
   */
  public static async getMaterialOrderById(orderId: string) {
    const po = await db.purchaseOrder.findUnique({
      where: { id: orderId },
      include: {
        project: {
          select: {
            id: true,
            referenceNo: true,
            title: true,
            stage: true,
            leadId: true,
            client: { select: { id: true, fullName: true, phone: true, email: true } },
          },
        },
        vendor: {
          select: {
            id: true,
            referenceNo: true,
            name: true,
            contactPerson: true,
            phone: true,
            email: true,
            address: true,
            categoryKey: true,
          },
        },
        items: true,
        vendorPayments: {
          where: { status: { not: "REVERSED" } },
          orderBy: { paymentDate: "desc" },
          select: { id: true, paymentNo: true, amount: true, paymentDate: true, paymentMethod: true, referenceNoExt: true, notes: true },
        },
      },
    });

    if (!po) throw new NotFoundError("Material Order not found");

    const totalPaid = po.vendorPayments.reduce((acc, pay) => acc + (pay.amount || 0), 0);
    const remainingBalance = Math.max(0, po.grandTotal - totalPaid);

    let paymentStatus: "Unpaid" | "Partial" | "Paid" = "Unpaid";
    if (remainingBalance <= 0.01 && po.grandTotal > 0) {
      paymentStatus = "Paid";
    } else if (totalPaid > 0) {
      paymentStatus = "Partial";
    }

    const isReceived = po.status === "RECEIVED" || po.status === "FULFILLED";
    const materialStatus: "Pending" | "Received" = isReceived ? "Received" : "Pending";

    let orderType = "Raw Material Order";
    if (po.notes?.includes("Laminate Order") || po.notes?.includes("Laminate")) {
      orderType = "Laminate Order";
    } else if (po.notes?.includes("General Material") || po.notes?.includes("Hardware")) {
      orderType = "Hardware & Fittings Order";
    }

    return {
      id: po.id,
      referenceNo: po.referenceNo,
      poDate: po.poDate,
      expectedDeliveryDate: po.expectedDeliveryDate,
      finalOrderAmount: po.grandTotal,
      subtotal: po.subtotal,
      status: po.status,
      orderType,
      materialStatus,
      paymentStatus,
      totalPaid,
      remainingBalance,
      notes: po.notes,
      project: po.project
        ? {
            ...po.project,
            client: po.project.client
              ? {
                  id: po.project.client.id,
                  name: po.project.client.fullName,
                  fullName: po.project.client.fullName,
                  phone: po.project.client.phone,
                  email: po.project.client.email,
                }
              : null,
          }
        : null,
      vendor: po.vendor,
      items: po.items.map((i) => ({
        id: i.id,
        materialName: i.materialName,
        quantity: i.quantity,
        unitKey: i.unitKey,
        referencePrice: i.rate,
        notes: i.description,
      })),
      payments: po.vendorPayments,
    };
  }

  /**
   * Marks a confirmed Material Order as RECEIVED.
   * Directly advances the relevant Project Pipeline stage (Rules 15, 16, 17, 18, 19, 20).
   */
  public static async markMaterialAsReceived(orderId: string, userId: string) {
    const po = await db.purchaseOrder.findUnique({
      where: { id: orderId },
      include: {
        project: true,
        vendor: true,
        items: true,
      },
    });

    if (!po) throw new NotFoundError("Material order not found");
    if (!po.projectId || !po.project) {
      throw new BusinessRuleError("This material order is not linked to an active project.");
    }
    if (po.status === "RECEIVED" || po.status === "FULFILLED") {
      throw new BusinessRuleError("This material order is already marked as received.");
    }

    const project = po.project;
    const currentStage = project.stage;

    // Determine target next stage based on order type and current pipeline stage
    let nextStage: string | null = null;
    const isRawMaterial =
      po.notes?.toLowerCase().includes("raw material") ||
      currentStage === "RAW_MATERIAL_ORDERED" ||
      po.vendor.categoryKey === "PLYWOOD";

    const isLaminate =
      po.notes?.toLowerCase().includes("laminate") ||
      currentStage === "LAMINATE_ORDERED" ||
      po.vendor.categoryKey === "LAMINATE";

    if (isRawMaterial && (currentStage === "RAW_MATERIAL_ORDERED" || currentStage === "MATERIAL_SELECTION")) {
      nextStage = "WOOD_WORK";
    } else if (isLaminate && (currentStage === "LAMINATE_ORDERED" || currentStage === "WOOD_WORK_COMPLETED")) {
      nextStage = "LAMINATE_PASTING";
    }

    const result = await db.$transaction(async (tx) => {
      // 1. Update Material Order status to RECEIVED
      const updatedPO = await tx.purchaseOrder.update({
        where: { id: po.id },
        data: {
          status: "RECEIVED",
          notes: po.notes ? `${po.notes} | [Received on ${new Date().toLocaleDateString()}]` : `[Received on ${new Date().toLocaleDateString()}]`,
        },
      });

      // 2. Update PO line items fulfillment
      await tx.purchaseOrderItem.updateMany({
        where: { purchaseOrderId: po.id },
        data: {
          receivedQuantity: 1, // Marked received
          pendingQuantity: 0,
        },
      });

      // 3. Update Project Pipeline stage if eligible
      let updatedProject = project;
      if (nextStage && nextStage !== currentStage) {
        updatedProject = await tx.project.update({
          where: { id: project.id },
          data: { stage: nextStage },
        });

        // Record stage transition history
        await tx.projectStageHistory.create({
          data: {
            projectId: project.id,
            fromStage: currentStage,
            toStage: nextStage,
            changedById: userId,
            notes: `Material Order ${po.referenceNo} delivered and marked as RECEIVED by Super Admin.`,
          },
        });
      }

      return { updatedPO, updatedProject, advancedToStage: nextStage };
    });

    // 4. Record Audit Log
    await AuditService.logEvent({
      userId,
      action: "MATERIAL_ORDER_RECEIVED",
      entityType: "PurchaseOrder",
      entityId: po.id,
      newValues: {
        orderId: po.id,
        referenceNo: po.referenceNo,
        project: project.referenceNo,
        advancedToStage: result.advancedToStage,
      },
    });

    // 5. Record Activity Log
    await ActivityService.record({
      userId,
      entityType: "Project",
      entityId: project.id,
      type: "PROJECT",
      title: `Material Order ${po.referenceNo} Received`,
      description: result.advancedToStage
        ? `Materials received from ${po.vendor.name}. Project pipeline automatically advanced from ${currentStage} to ${result.advancedToStage}.`
        : `Materials received from ${po.vendor.name} for project ${project.referenceNo}.`,
    });

    return result;
  }
}
