import { db } from "@/lib/db";
import { IdGeneratorService } from "@/lib/id-generator";
import { ActivityService } from "../activity/activity.service";
import { AuditService } from "../audit/audit.service";
import { CreateCalendarEventInput } from "@/validators/calendar.schema";
import { NotFoundError, BusinessRuleError } from "@/lib/errors";

export interface CalendarFilterParams {
  startDate: Date;
  endDate: Date;
  category?: string; // ALL, FOLLOW_UPS, SITE_VISITS, TASKS, PROJECT_MILESTONES, DELIVERIES, PAYMENTS, REMINDERS
  status?: string; // ALL, PENDING, COMPLETED, OVERDUE
  search?: string;
  userId?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO String
  time?: string | null;
  sourceType:
    | "TASK"
    | "LEAD_FOLLOW_UP"
    | "SITE_VISIT"
    | "PROJECT_MILESTONE"
    | "PAYMENT_DUE"
    | "PO_DELIVERY"
    | "QUOTATION_EXPIRY"
    | "REMINDER";
  sourceId: string;
  referenceNo?: string;
  clientName?: string;
  clientPhone?: string;
  location?: string;
  assignedToName?: string;
  notes?: string;
  actionUrl: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status: string;
  category:
    | "FOLLOW_UPS"
    | "SITE_VISITS"
    | "TASKS"
    | "PROJECT_MILESTONES"
    | "DELIVERIES"
    | "PAYMENTS"
    | "REMINDERS";
  amount?: number;
}

export interface CalendarKPIData {
  todayAppointments: number;
  pendingFollowUps: number;
  scheduledSiteVisits: number;
  tasksDueToday: number;
  expectedDeliveries: number;
}

export class CalendarService {
  /**
   * Retrieves all calendar events matching date window and filters across 8 subsystems.
   */
  public static async getCalendarEvents(params: CalendarFilterParams): Promise<CalendarEvent[]> {
    const { startDate, endDate, category = "ALL", status = "ALL", search } = params;
    const events: CalendarEvent[] = [];

    const searchFilter = search && search.trim() ? search.trim().toLowerCase() : null;
    const isCategory = (cat: string) => category === "ALL" || category.toUpperCase() === cat;

    // 1. LEAD & MATERIAL LEAD FOLLOW-UPS
    if (isCategory("FOLLOW_UPS") || isCategory("CRM") || isCategory("MEETINGS")) {
      const followUps = await db.leadFollowUp.findMany({
        where: {
          followUpDate: { gte: startDate, lte: endDate },
        },
        include: {
          lead: { select: { id: true, referenceNo: true, clientName: true, phone: true, location: true, stage: true } },
          assignedTo: { select: { id: true, fullName: true } },
        },
        orderBy: { followUpDate: "asc" },
      });

      for (const f of followUps) {
        if (!f.lead) continue;
        if (
          searchFilter &&
          !f.lead.clientName.toLowerCase().includes(searchFilter) &&
          !f.lead.referenceNo.toLowerCase().includes(searchFilter) &&
          !f.notes.toLowerCase().includes(searchFilter)
        ) {
          continue;
        }

        const dateObj = new Date(f.followUpDate);
        const timeStr = `${String(dateObj.getHours()).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`;
        const isMatLead = f.lead.referenceNo.startsWith("MAT-LEAD");

        events.push({
          id: `lfu_${f.id}`,
          title: `Follow-up (${f.type || "Call"}): ${f.lead.clientName}`,
          date: f.followUpDate.toISOString(),
          time: timeStr !== "00:00" ? timeStr : null,
          sourceType: "LEAD_FOLLOW_UP",
          sourceId: f.id,
          referenceNo: f.lead.referenceNo,
          clientName: f.lead.clientName,
          clientPhone: f.lead.phone,
          location: f.lead.location || undefined,
          assignedToName: f.assignedTo?.fullName,
          notes: f.notes,
          actionUrl: isMatLead ? `/material-leads?id=${f.lead.id}` : `/leads?id=${f.lead.id}`,
          priority: "NORMAL",
          status: f.status,
          category: "FOLLOW_UPS",
        });
      }
    }

    // 2. CLIENT SITE VISITS
    if (isCategory("SITE_VISITS") || isCategory("CRM") || isCategory("MEETINGS")) {
      const siteVisits = await db.leadSiteVisit.findMany({
        where: {
          visitDate: { gte: startDate, lte: endDate },
        },
        include: {
          lead: { select: { id: true, referenceNo: true, clientName: true, phone: true, location: true } },
          assignedTo: { select: { id: true, fullName: true } },
        },
        orderBy: { visitDate: "asc" },
      });

      for (const sv of siteVisits) {
        if (!sv.lead) continue;
        if (
          searchFilter &&
          !sv.lead.clientName.toLowerCase().includes(searchFilter) &&
          !sv.lead.referenceNo.toLowerCase().includes(searchFilter) &&
          !(sv.location || "").toLowerCase().includes(searchFilter)
        ) {
          continue;
        }

        const dateObj = new Date(sv.visitDate);
        const timeStr = `${String(dateObj.getHours()).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`;
        const isMatLead = sv.lead.referenceNo.startsWith("MAT-LEAD");

        events.push({
          id: `lsv_${sv.id}`,
          title: `Site Visit: ${sv.lead.clientName}`,
          date: sv.visitDate.toISOString(),
          time: timeStr !== "00:00" ? timeStr : null,
          sourceType: "SITE_VISIT",
          sourceId: sv.id,
          referenceNo: sv.lead.referenceNo,
          clientName: sv.lead.clientName,
          clientPhone: sv.lead.phone,
          location: sv.location || sv.lead.location || "Client Site",
          assignedToName: sv.assignedTo?.fullName,
          notes: sv.notes || undefined,
          actionUrl: isMatLead ? `/material-leads?id=${sv.lead.id}` : `/leads?id=${sv.lead.id}`,
          priority: "HIGH",
          status: sv.status,
          category: "SITE_VISITS",
        });
      }
    }

    // 3. TASKS & TO-DOS
    if (isCategory("TASKS")) {
      const tasks = await db.task.findMany({
        where: {
          OR: [
            { dueAt: { gte: startDate, lte: endDate } },
            { startDate: { gte: startDate, lte: endDate } },
          ],
        },
        include: {
          project: { select: { id: true, referenceNo: true, title: true } },
          assignee: { select: { id: true, fullName: true } },
        },
      });

      for (const t of tasks) {
        const targetDate = t.dueAt || t.startDate;
        if (!targetDate) continue;

        if (
          searchFilter &&
          !t.title.toLowerCase().includes(searchFilter) &&
          !t.referenceNo.toLowerCase().includes(searchFilter) &&
          !(t.project?.title || "").toLowerCase().includes(searchFilter)
        ) {
          continue;
        }

        const dateObj = new Date(targetDate);
        const timeStr = `${String(dateObj.getHours()).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`;

        events.push({
          id: `tsk_${t.id}`,
          title: t.title,
          date: targetDate.toISOString(),
          time: timeStr !== "00:00" ? timeStr : null,
          sourceType: "TASK",
          sourceId: t.id,
          referenceNo: t.referenceNo,
          location: t.project?.title || undefined,
          assignedToName: t.assignee?.fullName,
          notes: t.description || undefined,
          actionUrl: `/tasks?id=${t.id}`,
          priority: (t.priority as any) || "NORMAL",
          status: t.status,
          category: "TASKS",
        });
      }
    }

    // 4. PROJECT MILESTONES & HANDOVERS
    if (isCategory("PROJECT_MILESTONES") || isCategory("PROJECTS")) {
      const projects = await db.project.findMany({
        where: {
          OR: [
            { handoverDate: { gte: startDate, lte: endDate } },
            { targetCompletionDate: { gte: startDate, lte: endDate } },
          ],
        },
        include: { client: { select: { fullName: true, phone: true } } },
      });

      for (const p of projects) {
        const targetDate = p.handoverDate || p.targetCompletionDate;
        if (!targetDate) continue;

        if (
          searchFilter &&
          !p.title.toLowerCase().includes(searchFilter) &&
          !p.referenceNo.toLowerCase().includes(searchFilter) &&
          !(p.client?.fullName || "").toLowerCase().includes(searchFilter)
        ) {
          continue;
        }

        events.push({
          id: `proj_${p.id}`,
          title: `Project Handover: ${p.title}`,
          date: targetDate.toISOString(),
          sourceType: "PROJECT_MILESTONE",
          sourceId: p.id,
          referenceNo: p.referenceNo,
          clientName: p.client?.fullName,
          clientPhone: p.client?.phone || undefined,
          location: p.siteAddress || p.city || "Project Site",
          actionUrl: `/projects?id=${p.id}`,
          priority: "HIGH",
          status: p.stage,
          category: "PROJECT_MILESTONES",
          amount: p.contractValue,
        });
      }
    }

    // 5. EXPECTED MATERIAL DELIVERIES (PURCHASE ORDERS & MATERIAL ORDERS)
    if (isCategory("DELIVERIES") || isCategory("PROCUREMENT")) {
      const orders = await db.purchaseOrder.findMany({
        where: {
          expectedDeliveryDate: { gte: startDate, lte: endDate },
        },
        include: {
          vendor: { select: { id: true, name: true, phone: true } },
          project: { select: { id: true, referenceNo: true, title: true } },
        },
      });

      for (const po of orders) {
        if (!po.expectedDeliveryDate) continue;
        if (
          searchFilter &&
          !po.referenceNo.toLowerCase().includes(searchFilter) &&
          !po.vendor.name.toLowerCase().includes(searchFilter)
        ) {
          continue;
        }

        const isLeadMatOrder = po.projectId === null;

        events.push({
          id: `po_${po.id}`,
          title: `Material Delivery: ${po.vendor.name} (${po.referenceNo})`,
          date: po.expectedDeliveryDate.toISOString(),
          sourceType: "PO_DELIVERY",
          sourceId: po.id,
          referenceNo: po.referenceNo,
          clientName: po.vendor.name,
          clientPhone: po.vendor.phone,
          location: po.project?.title || "Warehouse / Site",
          actionUrl: isLeadMatOrder ? `/procurement/materials-order?id=${po.id}` : `/procurement/project-materials?id=${po.id}`,
          priority: "NORMAL",
          status: po.status,
          category: "DELIVERIES",
          amount: po.grandTotal,
        });
      }
    }

    // 6. CLIENT PAYMENT DUE DATES & RECEIVABLES
    if (isCategory("PAYMENTS") || isCategory("FINANCE")) {
      const receivables = await db.clientReceivable.findMany({
        where: {
          dueDate: { gte: startDate, lte: endDate },
        },
        include: {
          client: { select: { fullName: true, phone: true } },
          project: { select: { referenceNo: true, title: true } },
        },
      });

      for (const r of receivables) {
        if (!r.dueDate) continue;
        if (
          searchFilter &&
          !r.receivableNo.toLowerCase().includes(searchFilter) &&
          !(r.client?.fullName || "").toLowerCase().includes(searchFilter)
        ) {
          continue;
        }

        const clientName = r.client?.fullName || "Client";

        events.push({
          id: `rec_${r.id}`,
          title: `Client Payment Due: ₹${r.outstandingAmount.toLocaleString("en-IN")} (${clientName})`,
          date: r.dueDate.toISOString(),
          sourceType: "PAYMENT_DUE",
          sourceId: r.id,
          referenceNo: r.receivableNo,
          clientName,
          clientPhone: r.client?.phone || undefined,
          location: r.project?.title || undefined,
          actionUrl: `/finance/payments`,
          priority: r.status === "OVERDUE" ? "URGENT" : "HIGH",
          status: r.status,
          category: "PAYMENTS",
          amount: r.outstandingAmount,
        });
      }
    }

    // 7. QUOTATIONS ISSUED / VALIDITY
    if (isCategory("QUOTATIONS") || isCategory("CRM")) {
      const quotations = await db.quotation.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: { in: ["SENT", "READY_TO_SEND", "APPROVED"] },
        },
        include: {
          lead: { select: { id: true, clientName: true, phone: true } },
        },
      });

      for (const q of quotations) {
        if (
          searchFilter &&
          !q.referenceNo.toLowerCase().includes(searchFilter) &&
          !(q.lead?.clientName || "").toLowerCase().includes(searchFilter)
        ) {
          continue;
        }

        events.push({
          id: `quo_${q.id}`,
          title: `Quotation (${q.status}): ${q.referenceNo} - ${q.lead?.clientName || "Client"}`,
          date: q.createdAt.toISOString(),
          sourceType: "QUOTATION_EXPIRY",
          sourceId: q.id,
          referenceNo: q.referenceNo,
          clientName: q.lead?.clientName,
          clientPhone: q.lead?.phone,
          actionUrl: `/quotations`,
          priority: "NORMAL",
          status: q.status,
          category: "FOLLOW_UPS",
          amount: q.totalAmount,
        });
      }
    }

    // 8. REMINDERS
    if (isCategory("REMINDERS")) {
      const reminders = await db.reminder.findMany({
        where: {
          dueAt: { gte: startDate, lte: endDate },
        },
      });

      for (const rem of reminders) {
        if (
          searchFilter &&
          !rem.title.toLowerCase().includes(searchFilter) &&
          !rem.referenceNo.toLowerCase().includes(searchFilter)
        ) {
          continue;
        }

        events.push({
          id: `rem_${rem.id}`,
          title: `Reminder: ${rem.title}`,
          date: rem.dueAt.toISOString(),
          sourceType: "REMINDER",
          sourceId: rem.id,
          referenceNo: rem.referenceNo,
          notes: rem.description || undefined,
          actionUrl: rem.actionUrl || `/notifications`,
          priority: (rem.priority as any) || "NORMAL",
          status: rem.status,
          category: "REMINDERS",
        });
      }
    }

    // Status filtering
    let filtered = events;
    if (status && status !== "ALL") {
      const s = status.toUpperCase();
      if (s === "PENDING") {
        filtered = events.filter(
          (e) =>
            e.status === "PENDING" ||
            e.status === "SCHEDULED" ||
            e.status === "TO_DO" ||
            e.status === "IN_PROGRESS" ||
            e.status === "OPEN"
        );
      } else if (s === "COMPLETED") {
        filtered = events.filter(
          (e) =>
            e.status === "COMPLETED" ||
            e.status === "DONE" ||
            e.status === "PAID" ||
            e.status === "RECEIVED" ||
            e.status === "APPROVED" ||
            e.status === "CONFIRMED"
        );
      } else if (s === "OVERDUE") {
        filtered = events.filter(
          (e) => e.status === "OVERDUE" || (new Date(e.date) < new Date() && e.status === "PENDING")
        );
      }
    }

    // Sort chronologically
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return filtered;
  }

  /**
   * Computes dynamic KPI summary across today's live operational metrics
   */
  public static async getCalendarKPIs(): Promise<CalendarKPIData> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      todayFollowUps,
      todaySiteVisits,
      todayTasks,
      todayDeliveries,
      allPendingFollowUps,
    ] = await Promise.all([
      db.leadFollowUp.count({
        where: { followUpDate: { gte: todayStart, lte: todayEnd } },
      }),
      db.leadSiteVisit.count({
        where: { visitDate: { gte: todayStart, lte: todayEnd } },
      }),
      db.task.count({
        where: {
          dueAt: { gte: todayStart, lte: todayEnd },
          status: { not: "COMPLETED" },
        },
      }),
      db.purchaseOrder.count({
        where: {
          expectedDeliveryDate: { gte: todayStart, lte: todayEnd },
          status: { not: "RECEIVED" },
        },
      }),
      db.leadFollowUp.count({
        where: { status: "PENDING" },
      }),
    ]);

    const totalTodayAppointments = todayFollowUps + todaySiteVisits + todayTasks + todayDeliveries;

    return {
      todayAppointments: totalTodayAppointments,
      pendingFollowUps: allPendingFollowUps,
      scheduledSiteVisits: todaySiteVisits,
      tasksDueToday: todayTasks,
      expectedDeliveries: todayDeliveries,
    };
  }

  /**
   * Creates a calendar event/task/appointment directly from calendar modal
   */
  public static async createCalendarEvent(input: CreateCalendarEventInput, userId?: string) {
    const targetDate = new Date(input.date);
    if (input.time && input.time.includes(":")) {
      const [h, m] = input.time.split(":").map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        targetDate.setHours(h, m, 0, 0);
      }
    }

    if (input.eventType === "LEAD_FOLLOW_UP") {
      let leadId = input.leadId;
      if (!leadId) {
        const lead = await db.lead.findFirst({ orderBy: { createdAt: "desc" } });
        if (!lead) throw new NotFoundError("No lead found to attach follow-up to.");
        leadId = lead.id;
      }

      const followUp = await db.leadFollowUp.create({
        data: {
          leadId,
          followUpDate: targetDate,
          type: "CALL",
          notes: input.notes || input.title,
          status: "PENDING",
          assignedToId: input.assignedToId || userId || null,
        },
      });

      await ActivityService.record({
        userId,
        entityType: "Lead",
        entityId: leadId,
        type: "STATUS_CHANGE",
        title: "Follow-Up Scheduled from Calendar",
        description: input.notes || input.title,
      }).catch(() => {});

      return { success: true, eventType: "LEAD_FOLLOW_UP", item: followUp };
    }

    if (input.eventType === "SITE_VISIT") {
      let leadId = input.leadId;
      if (!leadId) {
        const lead = await db.lead.findFirst({ orderBy: { createdAt: "desc" } });
        if (!lead) throw new NotFoundError("No lead found to attach site visit to.");
        leadId = lead.id;
      }

      const siteVisit = await db.leadSiteVisit.create({
        data: {
          leadId,
          visitDate: targetDate,
          location: input.location || "Client Site",
          notes: input.notes || input.title,
          status: "SCHEDULED",
          assignedToId: input.assignedToId || userId || null,
        },
      });

      await ActivityService.record({
        userId,
        entityType: "Lead",
        entityId: leadId,
        type: "STATUS_CHANGE",
        title: "Site Visit Scheduled from Calendar",
        description: `Scheduled site visit at ${input.location || "Client Site"}: ${input.title}`,
      }).catch(() => {});

      return { success: true, eventType: "SITE_VISIT", item: siteVisit };
    }

    if (input.eventType === "REMINDER") {
      let targetUserId = input.assignedToId || userId;
      if (!targetUserId) {
        const u = await db.user.findFirst({ select: { id: true } });
        targetUserId = u?.id || "";
      }

      const ref = await IdGeneratorService.generate("REM");
      const reminder = await db.reminder.create({
        data: {
          referenceNo: ref,
          userId: targetUserId,
          title: input.title,
          description: input.notes || null,
          dueAt: targetDate,
          priority: input.priority || "NORMAL",
          status: "PENDING",
        },
      });

      return { success: true, eventType: "REMINDER", item: reminder };
    }

    // Default: TASK
    let creatorId = userId;
    if (!creatorId) {
      const u = await db.user.findFirst({ select: { id: true } });
      creatorId = u?.id || "";
    }

    const ref = await IdGeneratorService.generate("TSK");
    const task = await db.task.create({
      data: {
        referenceNo: ref,
        title: input.title,
        description: input.notes || null,
        dueAt: targetDate,
        priority: input.priority || "NORMAL",
        status: "TO_DO",
        projectId: input.projectId || null,
        assigneeId: input.assignedToId || creatorId || null,
        createdById: creatorId,
      },
    });

    await AuditService.logEvent({
      userId,
      action: "TASK_CREATED",
      entityType: "Task",
      entityId: task.id,
      newValues: { referenceNo: task.referenceNo, title: task.title },
    }).catch(() => {});

    return { success: true, eventType: "TASK", item: task };
  }
}

