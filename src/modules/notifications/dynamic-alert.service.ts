import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export interface SyncResult {
  generatedCount: number;
  resolvedCount: number;
  activeAlertsCount: number;
}

export class DynamicAlertService {
  /**
   * Fast, batch-evaluated dynamic alert generator.
   * Single-query eventId lookup and createMany batch insertion.
   */
  public static async syncDynamicAlerts(userId: string): Promise<SyncResult> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (!user) return { generatedCount: 0, resolvedCount: 0, activeAlertsCount: 0 };

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Single query to retrieve all existing event IDs for this user
      const existingNotifs = await db.notification.findMany({
        where: { userId },
        select: { eventId: true },
      });

      const existingEventIdSet = new Set(
        existingNotifs.map((n) => n.eventId).filter((id): id is string => Boolean(id))
      );

      const pendingCreations: Array<{
        userId: string;
        eventId: string;
        type: string;
        category: string;
        priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
        title: string;
        message: string;
        entityType?: string | null;
        entityId?: string | null;
        actionUrl?: string | null;
        isRead: boolean;
      }> = [];

      const prefixesToResolve: string[] = [];

      const addAlert = (params: {
        eventId: string;
        type: string;
        category: string;
        priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
        title: string;
        message: string;
        entityType?: string;
        entityId?: string;
        actionUrl?: string;
      }) => {
        if (!existingEventIdSet.has(params.eventId)) {
          existingEventIdSet.add(params.eventId);
          pendingCreations.push({
            userId,
            eventId: params.eventId,
            type: params.type,
            category: params.category,
            priority: params.priority,
            title: params.title,
            message: params.message,
            entityType: params.entityType || null,
            entityId: params.entityId || null,
            actionUrl: params.actionUrl || null,
            isRead: false,
          });
        }
      };

      // ─────────────────────────────────────────────────────────────
      // Run domain queries with minimal selected fields & tight limits
      // ─────────────────────────────────────────────────────────────
      const [
        recentLeads,
        followUps,
        siteVisits,
        wonOrLostLeads,
        recentQuotations,
        activeProjects,
        recentPayments,
        recentExpenses,
        recentAdvances,
        recentVendors,
        recentPOs,
      ] = await Promise.all([
        // 1. Leads
        db.lead.findMany({
          where: { createdAt: { gte: last24Hours } },
          select: { id: true, referenceNo: true, clientName: true, sourceKey: true },
          take: 15,
        }),
        // 2. Follow-ups
        db.leadFollowUp.findMany({
          where: {
            OR: [{ status: "PENDING" }, { completedAt: { gte: last24Hours } }],
          },
          select: {
            id: true,
            status: true,
            type: true,
            followUpDate: true,
            lead: { select: { id: true, referenceNo: true, clientName: true } },
          },
          take: 20,
        }),
        // 3. Site Visits
        db.leadSiteVisit.findMany({
          select: {
            id: true,
            visitDate: true,
            location: true,
            lead: { select: { id: true, referenceNo: true, clientName: true } },
          },
          take: 15,
        }),
        // 4. Won/Lost Leads
        db.lead.findMany({
          where: { stage: { in: ["WON", "LOST"] }, updatedAt: { gte: last7Days } },
          select: {
            id: true,
            referenceNo: true,
            clientName: true,
            stage: true,
            project: { select: { id: true, referenceNo: true } },
          },
          take: 15,
        }),
        // 5. Quotations
        db.quotation.findMany({
          where: { updatedAt: { gte: last7Days } },
          select: {
            id: true,
            referenceNo: true,
            revision: true,
            status: true,
            totalAmount: true,
            lead: { select: { id: true, referenceNo: true, clientName: true } },
            project: { select: { id: true, referenceNo: true, title: true } },
          },
          take: 15,
        }),
        // 6. Active Projects
        db.project.findMany({
          where: { status: { in: ["PLANNING", "ACTIVE", "IN_PROGRESS", "ON_HOLD"] } },
          select: {
            id: true,
            referenceNo: true,
            title: true,
            stage: true,
            contractValue: true,
            revisedBudget: true,
            payments: {
              where: { status: { in: ["APPROVED", "VERIFIED"] } },
              select: { amount: true },
            },
          },
          take: 15,
        }),
        // 7. Client Payments
        db.clientPayment.findMany({
          where: { status: { in: ["APPROVED", "VERIFIED"] }, createdAt: { gte: last7Days } },
          select: {
            id: true,
            referenceNo: true,
            amount: true,
            client: { select: { fullName: true } },
            project: { select: { referenceNo: true } },
          },
          orderBy: { paymentDate: "desc" },
          take: 15,
        }),
        // 8. Expenses
        db.expense.findMany({
          where: { createdAt: { gte: last7Days } },
          select: {
            id: true,
            referenceNo: true,
            amount: true,
            description: true,
          },
          orderBy: { expenseDate: "desc" },
          take: 15,
        }),
        // 9. Petty Cash Advances
        db.employeeAdvance.findMany({
          where: { createdAt: { gte: last7Days } },
          select: {
            id: true,
            referenceNo: true,
            amount: true,
            purpose: true,
            employee: { select: { fullName: true } },
          },
          take: 15,
        }),
        // 10. Vendors
        db.vendor.findMany({
          where: { createdAt: { gte: last7Days } },
          select: { id: true, referenceNo: true, name: true, categoryKey: true },
          take: 15,
        }),
        // 11. Purchase Orders
        db.purchaseOrder.findMany({
          where: { updatedAt: { gte: last7Days } },
          select: {
            id: true,
            referenceNo: true,
            status: true,
            grandTotal: true,
            projectId: true,
            vendor: { select: { name: true } },
          },
          take: 15,
        }),
      ]);

      // ─────────────────────────────────────────────────────────────
      // Process 1: Leads & CRM
      // ─────────────────────────────────────────────────────────────
      for (const lead of recentLeads) {
        if (lead.sourceKey === "WEBSITE") {
          addAlert({
            eventId: `lead_new_web_${lead.id}`,
            type: "NEW_WEBSITE_LEAD",
            category: "LEADS",
            priority: "NORMAL",
            title: "NEW WEBSITE LEAD RECEIVED",
            message: `Website inquiry from ${lead.clientName} (${lead.referenceNo}). Immediate qualification required.`,
            entityType: "Lead",
            entityId: lead.id,
            actionUrl: `/leads?id=${lead.id}`,
          });
        } else {
          addAlert({
            eventId: `lead_new_manual_${lead.id}`,
            type: "NEW_MANUAL_LEAD",
            category: "LEADS",
            priority: "LOW",
            title: "NEW MANUAL LEAD CREATED",
            message: `New lead created for ${lead.clientName} (${lead.referenceNo}).`,
            entityType: "Lead",
            entityId: lead.id,
            actionUrl: `/leads?id=${lead.id}`,
          });
        }
      }

      // Follow-ups
      for (const fu of followUps) {
        if (fu.status === "COMPLETED") {
          prefixesToResolve.push(`lead_fu_due_${fu.id}`);
          prefixesToResolve.push(`lead_fu_overdue_${fu.id}`);
          addAlert({
            eventId: `lead_fu_completed_${fu.id}`,
            type: "FOLLOW_UP_COMPLETED",
            category: "LEADS",
            priority: "LOW",
            title: "FOLLOW-UP COMPLETED",
            message: `Follow-up with ${fu.lead.clientName} (${fu.lead.referenceNo}) was completed.`,
            entityType: "Lead",
            entityId: fu.lead.id,
            actionUrl: `/leads?id=${fu.lead.id}`,
          });
        } else if (fu.status === "PENDING") {
          const fuDate = new Date(fu.followUpDate);
          const dateStr = fuDate.toISOString().split("T")[0];

          if (fuDate < todayStart) {
            addAlert({
              eventId: `lead_fu_overdue_${fu.id}_${dateStr}`,
              type: "FOLLOW_UP_OVERDUE",
              category: "LEADS",
              priority: "URGENT",
              title: "FOLLOW-UP OVERDUE",
              message: `Urgent: Follow-up for Lead ${fu.lead.clientName} (${fu.lead.referenceNo}) is overdue.`,
              entityType: "Lead",
              entityId: fu.lead.id,
              actionUrl: `/leads?id=${fu.lead.id}`,
            });
          } else if (fuDate >= todayStart && fuDate <= todayEnd) {
            addAlert({
              eventId: `lead_fu_due_${fu.id}_${dateStr}`,
              type: "FOLLOW_UP_DUE",
              category: "LEADS",
              priority: "HIGH",
              title: "FOLLOW-UP DUE TODAY",
              message: `Follow-up with ${fu.lead.clientName} (${fu.lead.referenceNo}) is due today (${fu.type}).`,
              entityType: "Lead",
              entityId: fu.lead.id,
              actionUrl: `/leads?id=${fu.lead.id}`,
            });
          } else {
            addAlert({
              eventId: `lead_fu_sched_${fu.id}_${dateStr}`,
              type: "FOLLOW_UP_SCHEDULED",
              category: "LEADS",
              priority: "NORMAL",
              title: "FOLLOW-UP SCHEDULED",
              message: `Follow-up scheduled with ${fu.lead.clientName} (${fu.lead.referenceNo}) on ${dateStr}.`,
              entityType: "Lead",
              entityId: fu.lead.id,
              actionUrl: `/leads?id=${fu.lead.id}`,
            });
          }
        }
      }

      // Site visits
      for (const sv of siteVisits) {
        const vDate = new Date(sv.visitDate);
        const dateStr = vDate.toISOString().split("T")[0];

        if (vDate < todayStart) {
          addAlert({
            eventId: `lead_sv_overdue_${sv.id}_${dateStr}`,
            type: "SITE_VISIT_OVERDUE",
            category: "LEADS",
            priority: "URGENT",
            title: "SITE VISIT OVERDUE",
            message: `Site visit for Lead ${sv.lead.clientName} (${sv.lead.referenceNo}) was scheduled for ${dateStr}.`,
            entityType: "Lead",
            entityId: sv.lead.id,
            actionUrl: `/leads?id=${sv.lead.id}`,
          });
        } else if (vDate >= todayStart && vDate <= todayEnd) {
          addAlert({
            eventId: `lead_sv_due_${sv.id}_${dateStr}`,
            type: "SITE_VISIT_DUE",
            category: "LEADS",
            priority: "HIGH",
            title: "SITE VISIT DUE TODAY",
            message: `Site visit scheduled for today with ${sv.lead.clientName} (${sv.lead.referenceNo}).`,
            entityType: "Lead",
            entityId: sv.lead.id,
            actionUrl: `/leads?id=${sv.lead.id}`,
          });
        }
      }

      // Won / Lost
      for (const lead of wonOrLostLeads) {
        if (lead.stage === "WON") {
          addAlert({
            eventId: `lead_won_${lead.id}`,
            type: "LEAD_WON",
            category: "LEADS",
            priority: "HIGH",
            title: "LEAD WON — PROJECT CONVERTED",
            message: `Lead ${lead.clientName} (${lead.referenceNo}) won and converted into active project operations.`,
            entityType: "Lead",
            entityId: lead.id,
            actionUrl: lead.project ? `/projects?id=${lead.project.id}` : `/leads?id=${lead.id}`,
          });
        } else if (lead.stage === "LOST") {
          addAlert({
            eventId: `lead_lost_${lead.id}`,
            type: "LEAD_LOST",
            category: "LEADS",
            priority: "NORMAL",
            title: "LEAD MARKED LOST",
            message: `Lead ${lead.clientName} (${lead.referenceNo}) marked as lost.`,
            entityType: "Lead",
            entityId: lead.id,
            actionUrl: `/leads?id=${lead.id}`,
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // Process 2: Quotations
      // ─────────────────────────────────────────────────────────────
      for (const quote of recentQuotations) {
        const entityLabel = quote.project?.title || quote.lead?.clientName || "Client";
        if (quote.status === "APPROVED") {
          addAlert({
            eventId: `quote_finalized_${quote.id}_rev${quote.revision}`,
            type: "QUOTATION_FINALIZED",
            category: "QUOTATIONS",
            priority: "HIGH",
            title: "QUOTATION FINALIZED & APPROVED",
            message: `Quotation ${quote.referenceNo} (Rev ${quote.revision}) for ${entityLabel} approved (₹${quote.totalAmount.toLocaleString("en-IN")}).`,
            entityType: "Quotation",
            entityId: quote.id,
            actionUrl: `/quotations/${quote.id}`,
          });
        } else if (quote.status === "SENT") {
          addAlert({
            eventId: `quote_sent_${quote.id}_rev${quote.revision}`,
            type: "QUOTATION_SENT",
            category: "QUOTATIONS",
            priority: "NORMAL",
            title: "QUOTATION SENT TO CLIENT",
            message: `Quotation ${quote.referenceNo} sent to ${entityLabel}.`,
            entityType: "Quotation",
            entityId: quote.id,
            actionUrl: `/quotations/${quote.id}`,
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // Process 3: Projects
      // ─────────────────────────────────────────────────────────────
      for (const proj of activeProjects) {
        const totalPaid = proj.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const projectValue = proj.revisedBudget || proj.contractValue || 0;
        const balance = Math.max(0, projectValue - totalPaid);

        if (proj.stage === "CONFIRMATION_FEE_PENDING" || (projectValue > 0 && totalPaid === 0)) {
          addAlert({
            eventId: `proj_conf_fee_pend_${proj.id}`,
            type: "CONFIRMATION_FEE_PENDING",
            category: "PROJECTS",
            priority: "HIGH",
            title: "CONFIRMATION FEE PENDING",
            message: `Project ${proj.referenceNo} (${proj.title}) requires confirmation advance payment.`,
            entityType: "Project",
            entityId: proj.id,
            actionUrl: `/projects?id=${proj.id}`,
          });
        } else if (totalPaid > 0) {
          prefixesToResolve.push(`proj_conf_fee_pend_${proj.id}`);
        }

        if (proj.stage === "QUALITY_CHECK" || proj.stage === "QUALITY_CHECK_PENDING") {
          addAlert({
            eventId: `proj_qc_pending_${proj.id}`,
            type: "QUALITY_CHECK_PENDING",
            category: "PROJECTS",
            priority: "URGENT",
            title: "QUALITY CHECK PENDING",
            message: `Project ${proj.referenceNo} (${proj.title}) has reached site Quality Inspection stage.`,
            entityType: "Project",
            entityId: proj.id,
            actionUrl: `/projects?id=${proj.id}`,
          });
        } else {
          prefixesToResolve.push(`proj_qc_pending_${proj.id}`);
        }

        if (totalPaid > 0 && balance > 0) {
          addAlert({
            eventId: `proj_balance_rem_${proj.id}`,
            type: "PAYMENT_BALANCE_REMAINING",
            category: "PAYMENTS",
            priority: "NORMAL",
            title: "PAYMENT BALANCE REMAINING",
            message: `Project ${proj.referenceNo}: Paid ₹${totalPaid.toLocaleString("en-IN")}, Remaining ₹${balance.toLocaleString("en-IN")}.`,
            entityType: "Project",
            entityId: proj.id,
            actionUrl: `/finance/payments?search=${encodeURIComponent(proj.referenceNo)}`,
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // Process 4: Client Payments
      // ─────────────────────────────────────────────────────────────
      for (const pay of recentPayments) {
        const clientName = pay.client?.fullName || "Client";
        const projRef = pay.project?.referenceNo || "Direct Account";
        addAlert({
          eventId: `pay_recorded_${pay.id}`,
          type: "CLIENT_PAYMENT_RECORDED",
          category: "PAYMENTS",
          priority: "NORMAL",
          title: "CLIENT PAYMENT RECORDED",
          message: `Payment of ₹${pay.amount.toLocaleString("en-IN")} received from ${clientName} (${projRef}). Ref: ${pay.referenceNo}.`,
          entityType: "ClientPayment",
          entityId: pay.id,
          actionUrl: `/finance/payments?search=${encodeURIComponent(pay.referenceNo)}`,
        });
      }

      // ─────────────────────────────────────────────────────────────
      // Process 5: Expenses & Petty Cash
      // ─────────────────────────────────────────────────────────────
      for (const exp of recentExpenses) {
        if (exp.amount >= 50000) {
          addAlert({
            eventId: `exp_large_${exp.id}`,
            type: "LARGE_EXPENSE_RECORDED",
            category: "EXPENSES",
            priority: "HIGH",
            title: "LARGE EXPENSE RECORDED",
            message: `High-value expense voucher recorded: ₹${exp.amount.toLocaleString("en-IN")} — ${exp.description}. Ref: ${exp.referenceNo}.`,
            entityType: "Expense",
            entityId: exp.id,
            actionUrl: `/finance/expenses?search=${encodeURIComponent(exp.referenceNo)}`,
          });
        }
      }

      for (const adv of recentAdvances) {
        addAlert({
          eventId: `pc_advance_${adv.id}`,
          type: "PETTY_CASH_GIVEN",
          category: "PETTY_CASH",
          priority: "NORMAL",
          title: "PETTY CASH ADVANCE ISSUED",
          message: `Petty cash advance of ₹${adv.amount.toLocaleString("en-IN")} issued to ${adv.employee.fullName}. Ref: ${adv.referenceNo}.`,
          entityType: "EmployeeAdvance",
          entityId: adv.id,
          actionUrl: `/finance/petty-cash`,
        });
      }

      // ─────────────────────────────────────────────────────────────
      // Process 6: Vendors & Purchase Orders
      // ─────────────────────────────────────────────────────────────
      for (const v of recentVendors) {
        addAlert({
          eventId: `vendor_new_${v.id}`,
          type: "NEW_VENDOR_CREATED",
          category: "VENDORS",
          priority: "LOW",
          title: "NEW VENDOR REGISTERED",
          message: `New supplier ${v.name} (${v.referenceNo}) registered under category ${v.categoryKey}.`,
          entityType: "Vendor",
          entityId: v.id,
          actionUrl: `/procurement/vendors`,
        });
      }

      for (const po of recentPOs) {
        const isProjectMaterial = po.projectId !== null;
        const vendorName = po.vendor?.name || "Supplier";
        const targetCategory = isProjectMaterial ? "PROJECT_MATERIALS" : "MATERIALS_ORDER";

        if (po.status === "RECEIVED" || po.status === "FULFILLED") {
          addAlert({
            eventId: `po_received_${po.id}`,
            type: isProjectMaterial ? "PROJECT_MATERIAL_RECEIVED" : "MATERIAL_RECEIVED",
            category: targetCategory,
            priority: "NORMAL",
            title: isProjectMaterial ? "PROJECT MATERIAL RECEIVED" : "MATERIAL ORDER RECEIVED",
            message: `Materials for Order ${po.referenceNo} from ${vendorName} have been received and verified.`,
            entityType: "PurchaseOrder",
            entityId: po.id,
            actionUrl: isProjectMaterial ? `/procurement/project-materials` : `/procurement/materials-order`,
          });
        } else if (po.status === "CONFIRMED" || po.status === "APPROVED") {
          addAlert({
            eventId: `po_accepted_${po.id}`,
            type: "VENDOR_REQUEST_ACCEPTED",
            category: targetCategory,
            priority: "NORMAL",
            title: "VENDOR ACCEPTED MATERIAL ORDER",
            message: `Vendor ${vendorName} accepted material order ${po.referenceNo} (₹${po.grandTotal.toLocaleString("en-IN")}).`,
            entityType: "PurchaseOrder",
            entityId: po.id,
            actionUrl: isProjectMaterial ? `/procurement/project-materials` : `/procurement/materials-order`,
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // Execute batch insert and batch resolutions
      // ─────────────────────────────────────────────────────────────
      let generatedCount = 0;
      if (pendingCreations.length > 0) {
        const createRes = await (db.notification.createMany as any)({
          data: pendingCreations,
          skipDuplicates: true,
        });
        generatedCount = createRes.count;
      }

      let resolvedCount = 0;
      if (prefixesToResolve.length > 0) {
        for (const prefix of prefixesToResolve) {
          const res = await db.notification.updateMany({
            where: {
              userId,
              eventId: { startsWith: prefix },
              dismissedAt: null,
            },
            data: { isRead: true, dismissedAt: new Date() },
          });
          resolvedCount += res.count;
        }
      }

      const activeAlertsCount = await db.notification.count({
        where: { userId, isRead: false, dismissedAt: null },
      });

      return {
        generatedCount,
        resolvedCount,
        activeAlertsCount,
      };
    } catch (error: any) {
      logger.error("[DYNAMIC_ALERT_SYNC_ERROR]", { error: error?.message || error });
      return { generatedCount: 0, resolvedCount: 0, activeAlertsCount: 0 };
    }
  }
}
