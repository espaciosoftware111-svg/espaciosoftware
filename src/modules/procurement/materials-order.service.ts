import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { BusinessRuleError, NotFoundError } from "@/lib/errors";
import { IdGeneratorService } from "@/lib/id-generator";
import { AuditService } from "../audit/audit.service";
import { ActivityService } from "../activity/activity.service";
import {
  CreateMaterialsOrderInput,
  MaterialsOrderFilterParams,
  RecordMaterialsOrderPaymentInput,
} from "@/validators/materials-order.schema";

export interface MaterialsOrderKPIData {
  totalMaterialOrders: number;
  totalOrderValue: number;
  materialsReceived: number;
  materialsPending: number;
  totalRemainingPayable: number;
}

export class MaterialsOrderService {
  /**
   * Retrieves confirmed Material Orders specifically for Materials Required Leads / Material-only customers.
   * STRICT SEPARATION: Only fetches orders where projectId is NULL.
   * Does NOT show pending, rejected, or unconfirmed orders.
   */
  public static async getConfirmedMaterialsOrders(params: MaterialsOrderFilterParams) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    // Strict separation: projectId must be NULL
    const where: Prisma.PurchaseOrderWhereInput = {
      projectId: null,
      status: { in: ["CONFIRMED", "APPROVED", "FULFILLED", "RECEIVED"] },
    };

    // Filter by Vendor
    if (params.vendorId && params.vendorId.trim() !== "") {
      where.vendorId = params.vendorId.trim();
    }

    // Filter by Date range
    if (params.dateFrom || params.dateTo) {
      where.poDate = {};
      if (params.dateFrom) where.poDate.gte = new Date(params.dateFrom);
      if (params.dateTo) where.poDate.lte = new Date(params.dateTo);
    }

    // Filter by Material Status
    if (params.materialStatus === "Received") {
      where.status = { in: ["RECEIVED", "FULFILLED"] };
    } else if (params.materialStatus === "Pending") {
      where.status = { in: ["CONFIRMED", "APPROVED"] };
    }

    // Search query filter
    if (params.search && params.search.trim() !== "") {
      const q = params.search.trim();
      where.OR = [
        { referenceNo: { contains: q } },
        { notes: { contains: q } },
        { vendorSnapshot: { contains: q } },
        { vendor: { name: { contains: q } } },
        { items: { some: { materialName: { contains: q } } } },
      ];
    }

    // Filter by material item name
    if (params.material && params.material.trim() !== "") {
      where.items = {
        some: {
          materialName: { contains: params.material.trim() },
        },
      };
    }

    // Filter by customer name in notes/snapshot
    if (params.customer && params.customer.trim() !== "") {
      where.OR = [
        ...(where.OR || []),
        { notes: { contains: params.customer.trim() } },
        { vendorSnapshot: { contains: params.customer.trim() } },
      ];
    }

    // Execute queries in parallel
    const [totalCount, allMatchingPOs] = await Promise.all([
      db.purchaseOrder.count({ where }),
      db.purchaseOrder.findMany({
        where,
        orderBy: { poDate: "desc" },
        skip,
        take: limit,
        include: {
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

    // Format orders with computed payment and material statuses, and parse connected Lead metadata
    const formattedOrders = await Promise.all(
      allMatchingPOs.map(async (po) => {
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

        // Parse customer/lead metadata from notes/snapshot
        let customerInfo = {
          leadId: null as string | null,
          leadRef: null as string | null,
          customerName: "Materials Customer",
          phone: "—",
          email: "—",
          address: "—",
          requirement: "Materials Required",
        };

        try {
          if (po.notes && po.notes.startsWith("{") && po.notes.endsWith("}")) {
            const meta = JSON.parse(po.notes);
            if (meta.customerName) customerInfo.customerName = meta.customerName;
            if (meta.customerPhone) customerInfo.phone = meta.customerPhone;
            if (meta.customerEmail) customerInfo.email = meta.customerEmail;
            if (meta.customerAddress) customerInfo.address = meta.customerAddress;
            if (meta.leadId) customerInfo.leadId = meta.leadId;
            if (meta.leadRef) customerInfo.leadRef = meta.leadRef;
          } else if (po.notes) {
            // Regex match for legacy note string e.g. "Lead: MRL-001 | Customer: Rahul Kumar"
            const leadMatch = po.notes.match(/Lead:\s*([^\s|]+)/i);
            const custMatch = po.notes.match(/Customer:\s*([^|\n]+)/i);
            if (leadMatch) customerInfo.leadRef = leadMatch[1].trim();
            if (custMatch) customerInfo.customerName = custMatch[1].trim();
          }
        } catch {
          // ignore parse errors
        }

        // If leadId is available, look up authoritative live Lead details
        if (customerInfo.leadId) {
          const lead = await db.lead.findUnique({
            where: { id: customerInfo.leadId },
            select: { id: true, referenceNo: true, clientName: true, phone: true, email: true, location: true, requirement: true },
          });
          if (lead) {
            customerInfo.leadRef = lead.referenceNo;
            customerInfo.customerName = lead.clientName;
            customerInfo.phone = lead.phone;
            customerInfo.email = lead.email || customerInfo.email;
            customerInfo.address = lead.location || customerInfo.address;
            customerInfo.requirement = lead.requirement || customerInfo.requirement;
          }
        }

        return {
          id: po.id,
          referenceNo: po.referenceNo,
          poDate: po.poDate,
          expectedDeliveryDate: po.expectedDeliveryDate,
          finalVendorOrderAmount: po.grandTotal,
          subtotal: po.subtotal,
          status: po.status,
          materialStatus,
          paymentStatus,
          totalPaid,
          remainingBalance,
          notes: po.notes,
          customer: customerInfo,
          vendor: po.vendor,
          items: po.items.map((i) => ({
            id: i.id,
            materialName: i.materialName,
            category: "Raw Material",
            quantity: i.quantity,
            unitKey: i.unitKey,
            referencePrice: i.rate,
            notes: i.description,
          })),
          payments: po.vendorPayments,
        };
      })
    );

    // Post-filter by computed paymentStatus if requested
    let finalItems = formattedOrders;
    if (params.paymentStatus) {
      finalItems = formattedOrders.filter((o) => o.paymentStatus === params.paymentStatus);
    }
    if (params.leadId && params.leadId.trim() !== "") {
      const lid = params.leadId.trim().toLowerCase();
      finalItems = finalItems.filter(
        (o) =>
          (o.customer.leadId && o.customer.leadId.toLowerCase().includes(lid)) ||
          (o.customer.leadRef && o.customer.leadRef.toLowerCase().includes(lid))
      );
    }

    // Calculate dynamic 5 KPI cards across ALL confirmed Lead Materials Orders
    const allLeadOrders = await db.purchaseOrder.findMany({
      where: {
        projectId: null,
        status: { in: ["CONFIRMED", "APPROVED", "FULFILLED", "RECEIVED"] },
      },
      include: {
        vendorPayments: {
          where: { status: { not: "REVERSED" } },
          select: { amount: true },
        },
      },
    });

    const totalMaterialOrders = allLeadOrders.length;
    const totalOrderValue = allLeadOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const materialsReceived = allLeadOrders.filter((o) => o.status === "RECEIVED" || o.status === "FULFILLED").length;
    const materialsPending = allLeadOrders.filter((o) => o.status === "CONFIRMED" || o.status === "APPROVED").length;
    const totalPaidSum = allLeadOrders.reduce((sum, o) => {
      const orderPaid = o.vendorPayments.reduce((pSum, pay) => pSum + (pay.amount || 0), 0);
      return sum + orderPaid;
    }, 0);
    const totalRemainingPayable = Math.max(0, totalOrderValue - totalPaidSum);

    const kpi: MaterialsOrderKPIData = {
      totalMaterialOrders,
      totalOrderValue,
      materialsReceived,
      materialsPending,
      totalRemainingPayable,
    };

    return {
      items: finalItems,
      kpi,
      pagination: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Retrieves single Material Order details for Materials Required Lead drawer
   */
  public static async getMaterialsOrderById(orderId: string) {
    const po = await db.purchaseOrder.findUnique({
      where: { id: orderId },
      include: {
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
          select: {
            id: true,
            paymentNo: true,
            amount: true,
            paymentDate: true,
            paymentMethod: true,
            referenceNoExt: true,
            notes: true,
          },
        },
      },
    });

    if (!po) throw new NotFoundError("Materials Order not found");
    if (po.projectId !== null) {
      throw new BusinessRuleError("This order belongs to Project Materials and cannot be opened here.");
    }

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

    // Parse customer metadata and related lead/quotation
    let customerInfo = {
      leadId: null as string | null,
      leadRef: null as string | null,
      leadStatus: "ORDER_PLACED",
      customerName: "Materials Customer",
      phone: "—",
      secondaryContact: null as string | null,
      email: "—",
      address: "—",
      requirement: "Materials Required",
    };
    let quotationInfo: any = null;
    let vendorRequestsList: any[] = [];
    let quotationIdFromMeta: string | null = null;

    try {
      if (po.notes && po.notes.startsWith("{") && po.notes.endsWith("}")) {
        const meta = JSON.parse(po.notes);
        if (meta.customerName) customerInfo.customerName = meta.customerName;
        if (meta.customerPhone) customerInfo.phone = meta.customerPhone;
        if (meta.customerEmail) customerInfo.email = meta.customerEmail;
        if (meta.customerAddress) customerInfo.address = meta.customerAddress;
        if (meta.leadId) customerInfo.leadId = meta.leadId;
        if (meta.leadRef) customerInfo.leadRef = meta.leadRef;
        if (meta.quotationId) quotationIdFromMeta = meta.quotationId;
      }
    } catch {
      // ignore
    }

    if (customerInfo.leadId) {
      const lead = await db.lead.findUnique({
        where: { id: customerInfo.leadId },
        select: {
          id: true,
          referenceNo: true,
          clientName: true,
          phone: true,
          email: true,
          location: true,
          requirement: true,
          stage: true,
          notes: true,
          quotations: {
            select: { id: true, referenceNo: true, totalAmount: true, createdAt: true, status: true },
          },
        },
      });
      if (lead) {
        customerInfo.leadRef = lead.referenceNo;
        customerInfo.customerName = lead.clientName;
        customerInfo.phone = lead.phone;
        customerInfo.email = lead.email || customerInfo.email;
        customerInfo.address = lead.location || customerInfo.address;
        customerInfo.requirement = lead.requirement || customerInfo.requirement;
        customerInfo.leadStatus = lead.stage;

        try {
          if (lead.notes && lead.notes.includes("[MATERIAL_LEAD_METADATA]:")) {
            const parts = lead.notes.split("[MATERIAL_LEAD_METADATA]:");
            const metaJson = JSON.parse(parts[1].trim());
            if (metaJson.vendorRequests) {
              vendorRequestsList = metaJson.vendorRequests;
            }
            if (metaJson.secondaryContact) {
              customerInfo.secondaryContact = metaJson.secondaryContact;
            }
          } else if (lead.notes && lead.notes.includes("__METADATA__")) {
            const parts = lead.notes.split("__METADATA__");
            const metaJson = JSON.parse(parts[1].trim());
            if (metaJson.vendorRequests) {
              vendorRequestsList = metaJson.vendorRequests;
            }
            if (metaJson.secondaryContact) {
              customerInfo.secondaryContact = metaJson.secondaryContact;
            }
          }
        } catch {
          // ignore
        }

        if (quotationIdFromMeta) {
          const matchedQ = lead.quotations.find((q) => q.id === quotationIdFromMeta);
          if (matchedQ) quotationInfo = matchedQ;
        }
        if (!quotationInfo && lead.quotations.length > 0) {
          quotationInfo = lead.quotations[0];
        }
      }
    }

    return {
      id: po.id,
      referenceNo: po.referenceNo,
      poDate: po.poDate,
      expectedDeliveryDate: po.expectedDeliveryDate,
      finalVendorOrderAmount: po.grandTotal,
      subtotal: po.subtotal,
      status: po.status,
      materialStatus,
      paymentStatus,
      totalPaid,
      remainingBalance,
      notes: po.notes,
      customer: customerInfo,
      relatedQuotation: quotationInfo,
      vendorRequests: vendorRequestsList,
      vendor: {
        ...po.vendor,
        vendorStatus: po.status === "CONFIRMED" || po.status === "RECEIVED" ? "ACCEPTED" : "PENDING",
      },
      items: po.items.map((i) => ({
        id: i.id,
        materialName: i.materialName,
        category: "Raw Material",
        quantity: i.quantity,
        unitKey: i.unitKey,
        referencePrice: i.rate,
        notes: i.description,
      })),
      payments: po.vendorPayments,
    };
  }

  /**
   * Creates ONE connected Materials Order record upon Vendor Acceptance and Super Admin manual final amount.
   */
  public static async createConfirmedMaterialsOrder(input: CreateMaterialsOrderInput, userId?: string) {
    const vendor = await db.vendor.findUnique({ where: { id: input.vendorId } });
    if (!vendor) throw new NotFoundError("Selected vendor record not found");

    if (vendor.status === "BLOCKED" || vendor.status === "INACTIVE") {
      throw new BusinessRuleError(`Vendor ${vendor.name} is ${vendor.status} and cannot receive orders.`);
    }

    if (!input.materials || input.materials.length === 0) {
      throw new BusinessRuleError("At least one material item is required.");
    }

    // Strict Rule: finalVendorOrderAmount must be manually entered, greater than 0
    if (!input.finalVendorOrderAmount || input.finalVendorOrderAmount <= 0) {
      throw new BusinessRuleError("Super Admin must manually enter a valid Final Vendor Order Amount.");
    }

    // Verify or find lead if leadId provided
    let leadRef: string | null = null;
    if (input.leadId) {
      const lead = await db.lead.findUnique({ where: { id: input.leadId } });
      if (lead) leadRef = lead.referenceNo;
    }

    const referenceNo = await IdGeneratorService.generate("PO");

    // Package metadata preserving customer and lead connections
    const metadataObj = {
      scope: "MATERIALS_REQUIRED_LEAD",
      leadId: input.leadId || null,
      leadRef: leadRef || "MRL-DIRECT",
      customerName: input.customerName.trim(),
      customerPhone: input.customerPhone.trim(),
      customerEmail: input.customerEmail ? input.customerEmail.trim() : null,
      customerAddress: input.customerAddress ? input.customerAddress.trim() : null,
      quotationId: input.quotationId || null,
      customNotes: input.notes || null,
    };

    const vendorSnapshot = JSON.stringify({
      vendorName: vendor.name,
      vendorPhone: vendor.phone,
      vendorGstin: vendor.gstin,
      customerName: input.customerName.trim(),
      customerPhone: input.customerPhone.trim(),
    });

    const expectedDate = input.expectedDeliveryDate ? new Date(input.expectedDeliveryDate) : null;

    const po = await db.purchaseOrder.create({
      data: {
        referenceNo,
        vendorId: vendor.id,
        projectId: null, // STRICTLY NULL — Not a project order!
        poDate: new Date(),
        expectedDeliveryDate: expectedDate,
        currency: "INR",
        subtotal: input.finalVendorOrderAmount,
        grandTotal: input.finalVendorOrderAmount,
        status: "CONFIRMED", // Confirmed upon Super Admin entry
        revision: 1,
        vendorSnapshot,
        notes: JSON.stringify(metadataObj),
        createdById: userId ?? null,
        items: {
          create: input.materials.map((m) => ({
            materialName: m.materialName.trim(),
            description: m.notes ? m.notes.trim() : null,
            quantity: m.quantity,
            unitKey: m.unitKey || "NOS",
            rate: m.referencePrice || 0, // Informational Reference Price only
            discount: 0,
            taxRate: 0,
            lineTotal: (m.referencePrice || 0) * m.quantity,
            receivedQuantity: 0,
            acceptedQuantity: 0,
            rejectedQuantity: 0,
            pendingQuantity: m.quantity,
            expectedDeliveryDate: expectedDate,
          })),
        },
      },
      include: { items: true, vendor: true },
    });

    // If connected to a Lead, log activity on the Lead
    if (input.leadId) {
      await ActivityService.record({
        userId,
        entityType: "Lead",
        entityId: input.leadId,
        type: "LEAD",
        title: `Materials Order Placed`,
        description: `Confirmed Materials Order ${po.referenceNo} placed with vendor ${vendor.name} for ₹${input.finalVendorOrderAmount.toLocaleString("en-IN")}.`,
      }).catch(() => {});
    }

    // Audit trail
    await AuditService.logEvent({
      userId,
      action: "MATERIALS_ORDER_CONFIRMED",
      entityType: "PurchaseOrder",
      entityId: po.id,
      newValues: {
        referenceNo: po.referenceNo,
        vendorId: vendor.id,
        vendorName: vendor.name,
        customerName: input.customerName,
        leadId: input.leadId,
        finalVendorOrderAmount: input.finalVendorOrderAmount,
      },
    });

    return po;
  }

  /**
   * Marks a confirmed Materials Order as RECEIVED.
   * STRICT RULE: Updates the Materials Order and related Lead.
   * Explicitly DOES NOT update or advance ANY Project Pipeline!
   */
  public static async markMaterialsOrderReceived(orderId: string, userId?: string) {
    const po = await db.purchaseOrder.findUnique({
      where: { id: orderId },
      include: { items: true, vendor: true },
    });

    if (!po) throw new NotFoundError("Materials Order record not found");
    if (po.projectId !== null) {
      throw new BusinessRuleError("This order belongs to Project Materials and cannot be received here.");
    }

    if (po.status === "RECEIVED" || po.status === "FULFILLED") {
      throw new BusinessRuleError(`Materials Order ${po.referenceNo} has already been marked as Received.`);
    }

    // Update order status and items received quantity
    const updatedPo = await db.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.update({
        where: { id: orderId },
        data: {
          status: "RECEIVED",
        },
      });

      // Mark all items as received
      for (const item of po.items) {
        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: {
            receivedQuantity: item.quantity,
            acceptedQuantity: item.quantity,
            pendingQuantity: 0,
          },
        });
      }

      return order;
    });

    // Parse leadId to notify Lead activity if connected
    let connectedLeadId: string | null = null;
    try {
      if (po.notes && po.notes.startsWith("{")) {
        const meta = JSON.parse(po.notes);
        if (meta.leadId) connectedLeadId = meta.leadId;
      }
    } catch {
      // ignore
    }

    if (connectedLeadId) {
      await ActivityService.record({
        userId,
        entityType: "Lead",
        entityId: connectedLeadId,
        type: "LEAD",
        title: `Materials Order Received`,
        description: `Materials Order ${po.referenceNo} has been delivered and marked as Received.`,
      }).catch(() => {});
    }

    // Audit Log
    await AuditService.logEvent({
      userId,
      action: "MATERIALS_ORDER_RECEIVED",
      entityType: "PurchaseOrder",
      entityId: po.id,
      newValues: {
        referenceNo: po.referenceNo,
        vendorId: po.vendorId,
        vendorName: po.vendor?.name,
        leadId: connectedLeadId,
        noProjectPipelineUpdated: true,
      },
    });

    return updatedPo;
  }

  /**
   * Records a Vendor Payment against this Materials Order.
   * Creates single connected payment and expense record with zero double counting.
   */
  public static async recordPaymentForMaterialsOrder(
    orderId: string,
    input: RecordMaterialsOrderPaymentInput,
    userId?: string
  ) {
    const po = await db.purchaseOrder.findUnique({
      where: { id: orderId },
      include: { vendorPayments: { where: { status: { not: "REVERSED" } } }, vendor: true },
    });

    if (!po) throw new NotFoundError("Materials Order record not found");
    if (po.projectId !== null) {
      throw new BusinessRuleError("This order belongs to Project Materials.");
    }

    const currentPaid = po.vendorPayments.reduce((acc, pay) => acc + (pay.amount || 0), 0);
    const balanceRemaining = Math.max(0, po.grandTotal - currentPaid);

    if (input.amount > balanceRemaining + 0.01) {
      throw new BusinessRuleError(
        `Payment amount (₹${input.amount}) exceeds remaining balance of ₹${balanceRemaining.toLocaleString("en-IN")}`
      );
    }

    const paymentNo = await IdGeneratorService.generate("VPAY");
    const expenseNo = await IdGeneratorService.generate("EXP");
    const paymentDate = input.paymentDate || new Date();

    const result = await db.$transaction(async (tx) => {
      // 1. Create linked Expense in Expense Management
      const expense = await tx.expense.create({
        data: {
          referenceNo: expenseNo,
          expenseType: "BUSINESS",
          categoryKey: "MATERIAL",
          description: `Vendor payment for Materials Order ${po.referenceNo} (${po.vendor?.name})`,
          amount: input.amount,
          expenseDate: paymentDate,
          paymentMethod: input.paymentMethod,
          status: "APPROVED",
          vendorId: po.vendorId,
          projectId: null,
          notes: `Vendor payment for Materials Order ${po.referenceNo}`,
          createdById: userId ?? null,
        },
      });

      // 2. Create single connected VendorPayment
      const payment = await tx.vendorPayment.create({
        data: {
          paymentNo,
          vendorId: po.vendorId,
          purchaseOrderId: po.id,
          amount: input.amount,
          paymentDate,
          paymentMethod: input.paymentMethod,
          referenceNoExt: input.referenceNoExt ? input.referenceNoExt.trim() : null,
          notes: input.notes ? input.notes.trim() : null,
          status: "VERIFIED",
          recordedById: userId ?? null,
        },
      });

      return { payment, expense };
    });

    await AuditService.logEvent({
      userId,
      action: "VENDOR_PAYMENT_RECORDED",
      entityType: "VendorPayment",
      entityId: result.payment.id,
      newValues: {
        paymentNo: result.payment.paymentNo,
        materialsOrderId: po.id,
        referenceNo: po.referenceNo,
        amount: input.amount,
        vendorId: po.vendorId,
        expenseId: result.expense.id,
      },
    });

    return result;
  }
}
