import { describe, it, expect, beforeAll } from "vitest";
import { db } from "../src/lib/db";
import { CalendarService } from "../src/modules/calendar/calendar.service";
import { IdGeneratorService } from "../src/lib/id-generator";

describe("CALENDAR MODULE — Strict Dynamic Multi-System Integration Suite", () => {
  let testUser: { id: string; fullName: string; email: string };
  let testLead: any;
  let testProject: any;
  let testVendor: any;

  beforeAll(async () => {
    // 1. Fetch or create test user
    let user = await db.user.findFirst();
    if (!user) {
      user = await db.user.create({
        data: {
          email: "calendar.admin@espacio.test",
          fullName: "Calendar Administrator",
          passwordHash: "hash123",
          status: "ACTIVE",
          accessLevel: "ADMIN",
        },
      });
    }
    testUser = user;

    // 2. Fetch or create lead for appointments
    testLead = await db.lead.findFirst();
    if (!testLead) {
      const code = await IdGeneratorService.generate("LEAD");
      testLead = await db.lead.create({
        data: {
          referenceNo: code,
          clientName: "Calendar Test Client",
          phone: "9876543210",
          email: "calendar.test@example.com",
          stage: "NEW",
          sourceKey: "WEBSITE",
          propertyTypeKey: "APARTMENT",
          assignedToId: testUser.id,
        },
      });
    }

    // 3. Fetch or create project
    testProject = await db.project.findFirst();
    if (!testProject) {
      let client = await db.client.findFirst();
      if (!client) {
        const cliRef = await IdGeneratorService.generate("CLI");
        client = await db.client.create({
          data: {
            referenceNo: cliRef,
            fullName: "Calendar Client Profile",
            phone: "9876543210",
            email: "calendar.client@example.com",
          },
        });
      }

      const pCode = await IdGeneratorService.generate("PROJ");
      testProject = await db.project.create({
        data: {
          referenceNo: pCode,
          title: "Calendar Test Luxury Villa",
          clientId: client.id,
          stage: "EXECUTION",
          contractValue: 500000,
          targetCompletionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // 4. Fetch or create vendor
    testVendor = await db.vendor.findFirst();
    if (!testVendor) {
      const vCode = await IdGeneratorService.generate("VEN");
      testVendor = await db.vendor.create({
        data: {
          referenceNo: vCode,
          name: "Calendar Test Hardware Vendor",
          phone: "9123456780",
          categoryKey: "HARDWARE",
          status: "ACTIVE",
        },
      });
    }
  });

  it("1. Successfully aggregates Lead Follow-ups into Calendar Events", async () => {
    const today = new Date();
    const followUpDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30, 0);

    const followUp = await db.leadFollowUp.create({
      data: {
        leadId: testLead.id,
        followUpDate,
        type: "CALL",
        notes: "Strict Calendar Test Follow-Up Discussion",
        status: "PENDING",
        assignedToId: testUser.id,
      },
    });

    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const events = await CalendarService.getCalendarEvents({
      startDate,
      endDate,
      category: "FOLLOW_UPS",
    });

    expect(events.length).toBeGreaterThanOrEqual(1);
    const matched = events.find((e) => e.id === `lfu_${followUp.id}`);
    expect(matched).toBeDefined();
    expect(matched?.category).toBe("FOLLOW_UPS");
    expect(matched?.title).toContain("Follow-up (CALL)");
    expect(matched?.clientName).toBe(testLead.clientName);
  });

  it("2. Successfully aggregates Site Visits into Calendar Events", async () => {
    const today = new Date();
    const visitDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 14, 0, 0);

    const visit = await db.leadSiteVisit.create({
      data: {
        leadId: testLead.id,
        visitDate,
        location: "Kondapur Site Apt 402",
        notes: "Site visit for structural measurement",
        status: "SCHEDULED",
        assignedToId: testUser.id,
      },
    });

    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const events = await CalendarService.getCalendarEvents({
      startDate,
      endDate,
      category: "SITE_VISITS",
    });

    const matched = events.find((e) => e.id === `lsv_${visit.id}`);
    expect(matched).toBeDefined();
    expect(matched?.category).toBe("SITE_VISITS");
    expect(matched?.location).toBe("Kondapur Site Apt 402");
    expect(matched?.notes).toContain("structural measurement");
  });

  it("3. Successfully aggregates Tasks (To-Dos) into Calendar Events", async () => {
    const today = new Date();
    const dueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0, 0);
    const ref = await IdGeneratorService.generate("TSK");

    const task = await db.task.create({
      data: {
        referenceNo: ref,
        title: "Submit Electrical Layout to Factory",
        description: "Verify modular electrical points",
        dueAt: dueDate,
        priority: "HIGH",
        status: "TO_DO",
        assigneeId: testUser.id,
        createdById: testUser.id,
        projectId: testProject?.id,
      },
    });

    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const events = await CalendarService.getCalendarEvents({
      startDate,
      endDate,
      category: "TASKS",
    });

    const matched = events.find((e) => e.id === `tsk_${task.id}`);
    expect(matched).toBeDefined();
    expect(matched?.category).toBe("TASKS");
    expect(matched?.priority).toBe("HIGH");
    expect(matched?.title).toBe("Submit Electrical Layout to Factory");
  });

  it("4. Successfully aggregates Purchase Order Material Deliveries into Calendar Events", async () => {
    const today = new Date();
    const expectedDeliveryDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2);
    const poRef = await IdGeneratorService.generate("PO");

    const po = await db.purchaseOrder.create({
      data: {
        referenceNo: poRef,
        vendorId: testVendor.id,
        projectId: testProject?.id,
        grandTotal: 45000,
        status: "SENT",
        expectedDeliveryDate,
        createdById: testUser.id,
      },
    });

    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const events = await CalendarService.getCalendarEvents({
      startDate,
      endDate,
      category: "DELIVERIES",
    });

    const matched = events.find((e) => e.id === `po_${po.id}`);
    expect(matched).toBeDefined();
    expect(matched?.category).toBe("DELIVERIES");
    expect(matched?.title).toContain(po.referenceNo);
  });

  it("5. Computes live dynamic KPIs accurately", async () => {
    const kpis = await CalendarService.getCalendarKPIs();

    expect(kpis).toHaveProperty("todayAppointments");
    expect(kpis).toHaveProperty("pendingFollowUps");
    expect(kpis).toHaveProperty("scheduledSiteVisits");
    expect(kpis).toHaveProperty("tasksDueToday");
    expect(kpis).toHaveProperty("expectedDeliveries");

    expect(typeof kpis.todayAppointments).toBe("number");
    expect(typeof kpis.pendingFollowUps).toBe("number");
    expect(typeof kpis.scheduledSiteVisits).toBe("number");
    expect(typeof kpis.tasksDueToday).toBe("number");
    expect(typeof kpis.expectedDeliveries).toBe("number");
  });

  it("6. Creates a new quick task via createCalendarEvent", async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const result = await CalendarService.createCalendarEvent(
      {
        title: "Review Kitchen Hardware Mockup",
        eventType: "TASK",
        date: tomorrow.toISOString(),
        time: "10:30",
        notes: "Inspect soft-close hinges quality",
        priority: "URGENT",
        assignedToId: testUser.id,
      },
      testUser.id
    );

    expect(result).toBeDefined();
    expect(result.eventType).toBe("TASK");
    expect((result.item as any).title).toBe("Review Kitchen Hardware Mockup");
    expect((result.item as any).priority).toBe("URGENT");
  });

  it("7. Creates a new quick site visit via createCalendarEvent", async () => {
    const visitDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

    const result = await CalendarService.createCalendarEvent(
      {
        title: "Site Inspection for Modular Wardrobes",
        eventType: "SITE_VISIT",
        date: visitDate.toISOString(),
        time: "15:00",
        leadId: testLead.id,
        location: "Villa 22, Green Valley",
        notes: "Take wall levelling and plumb checks",
        priority: "NORMAL",
        assignedToId: testUser.id,
      },
      testUser.id
    );

    expect(result).toBeDefined();
    expect(result.eventType).toBe("SITE_VISIT");
    expect((result.item as any).location).toBe("Villa 22, Green Valley");
  });

  it("8. Filters events with text search and category constraints", async () => {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const searchResults = await CalendarService.getCalendarEvents({
      startDate,
      endDate,
      search: "Electrical Layout",
    });

    expect(searchResults.length).toBeGreaterThanOrEqual(1);
    expect(searchResults.some((e) => e.title.includes("Electrical Layout"))).toBe(true);
  });
});
