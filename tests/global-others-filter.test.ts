import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { LeadService } from "@/modules/leads/lead.service";
import { PaymentService } from "@/modules/payments/payment.service";
import { ProjectService } from "@/modules/projects/project.service";
import { IdGeneratorService } from "@/lib/id-generator";

describe("ESPACIO ERP — Global 'Others' Filter System Strict Test Suite", () => {
  let testLeadId: string;
  let testProjectId: string;
  let testPaymentId: string;

  beforeEach(async () => {
    // Seed a dynamic lead for filter testing
    const leadRef = await IdGeneratorService.generate("LEAD");
    const lead = await db.lead.create({
      data: {
        referenceNo: leadRef,
        clientName: `Test Client For Others Filter ${Date.now().toString().slice(-4)}`,
        phone: `+919888${Math.floor(100000 + Math.random() * 900000)}`,
        email: `others.filter.${Date.now()}@espacio-test.internal`,
        stage: "CONTACTED",
        sourceKey: "CUSTOM_CAMPAIGN_2026",
        propertyTypeKey: "VILLA",
        priority: "URGENT",
        requirement: "Luxury Villa Interior Execution",
        location: "Jubilee Hills, Hyderabad",
      },
    });
    testLeadId = lead.id;

    // Seed a dynamic project
    const projRef = await IdGeneratorService.generate("PROJ");
    const project = await db.project.create({
      data: {
        referenceNo: projRef,
        title: `Villa Project Others Filter Test ${Date.now().toString().slice(-4)}`,
        stage: "WOOD_WORK",
        status: "ON_HOLD",
        priority: "HIGH",
        contractValue: 7500000,
        city: "Hyderabad",
      },
    });
    testProjectId = project.id;

    // Seed a dynamic payment
    const payRef = await IdGeneratorService.generate("PAY");
    const payment = await db.clientPayment.create({
      data: {
        referenceNo: payRef,
        referenceNoExt: `TXN-OTHERS-${Date.now()}`,
        amount: 150000,
        paymentMethod: "SPECIAL_ESCROW_GATEWAY",
        status: "PENDING_AUDIT_REVIEW",
        projectId: testProjectId,
        paymentDate: new Date(),
        notes: "Custom payment gateway testing for others filter",
      },
    });
    testPaymentId = payment.id;
  });

  it("TEST 1: Filters leads dynamically by custom 'Others' source without database mutation", async () => {
    // Filter with custom source string
    const result = await LeadService.getLeads({
      source: "CUSTOM_CAMPAIGN_2026",
    });

    expect(result.leads.length).toBeGreaterThanOrEqual(1);
    const matched = result.leads.find((l: any) => l.id === testLeadId);
    expect(matched).toBeDefined();
    expect(matched?.sourceKey).toBe("CUSTOM_CAMPAIGN_2026");

    // Case-insensitive substring match verification
    const caseInsensitiveResult = await LeadService.getLeads({
      source: "custom_campaign",
    });
    const matchedCase = caseInsensitiveResult.leads.find((l: any) => l.id === testLeadId);
    expect(matchedCase).toBeDefined();

    // Verify non-destructive guarantee (record is not mutated)
    const dbRecord = await db.lead.findUnique({ where: { id: testLeadId } });
    expect(dbRecord?.sourceKey).toBe("CUSTOM_CAMPAIGN_2026");
  });

  it("TEST 2: Filters leads dynamically by custom 'Others' stage/status", async () => {
    const result = await LeadService.getLeads({
      status: "contacted",
    });

    expect(result.leads.length).toBeGreaterThanOrEqual(1);
    const matched = result.leads.find((l: any) => l.id === testLeadId);
    expect(matched).toBeDefined();
    expect(matched?.stage).toBe("CONTACTED");
  });

  it("TEST 3: Filters payments dynamically by custom 'Others' payment method", async () => {
    const result = await PaymentService.getPayments({
      paymentMethod: "SPECIAL_ESCROW_GATEWAY",
    });

    expect(result.payments.length).toBeGreaterThanOrEqual(1);
    const matched = result.payments.find((p: any) => p.id === testPaymentId);
    expect(matched).toBeDefined();
    expect(matched?.paymentMethod).toBe("SPECIAL_ESCROW_GATEWAY");

    // Case-insensitive partial search
    const partialResult = await PaymentService.getPayments({
      paymentMethod: "escrow_gateway",
    });
    const matchedPartial = partialResult.payments.find((p: any) => p.id === testPaymentId);
    expect(matchedPartial).toBeDefined();
  });

  it("TEST 4: Filters payments dynamically by custom 'Others' status", async () => {
    const result = await PaymentService.getPayments({
      status: "PENDING_AUDIT_REVIEW",
    });

    expect(result.payments.length).toBeGreaterThanOrEqual(1);
    const matched = result.payments.find((p: any) => p.id === testPaymentId);
    expect(matched).toBeDefined();
    expect(matched?.status).toBe("PENDING_AUDIT_REVIEW");
  });

  it("TEST 5: Filters projects dynamically by custom 'Others' status and stage", async () => {
    const result = await ProjectService.getProjects({
      status: "on_hold",
      stage: "wood_work",
    });

    expect(result.projects.length).toBeGreaterThanOrEqual(1);
    const matched = result.projects.find((p: any) => p.id === testProjectId);
    expect(matched).toBeDefined();
    expect(matched?.status).toBe("ON_HOLD");
    expect(matched?.stage).toBe("WOOD_WORK");
  });

  it("TEST 6: Multi-filter compatibility applies multiple 'Others' filters simultaneously", async () => {
    const result = await LeadService.getLeads({
      source: "CUSTOM_CAMPAIGN",
      priority: "URGENT",
      status: "CONTACTED",
    });

    expect(result.leads.length).toBeGreaterThanOrEqual(1);
    const matched = result.leads.find((l: any) => l.id === testLeadId);
    expect(matched).toBeDefined();
  });

  it("TEST 7: Empty custom value gracefully defaults to unfiltered dataset", async () => {
    const result = await LeadService.getLeads({
      source: "",
      status: "",
    });

    expect(result.leads.length).toBeGreaterThanOrEqual(1);
  });
});
