import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { QuotationService } from "@/modules/quotations/quotation.service";
import { GstInvoiceService } from "@/modules/finance/gst-invoice.service";
import { PaymentService } from "@/modules/payments/payment.service";
import { ChangeOrderService } from "@/modules/projects/change-order.service";
import { IdGeneratorService } from "@/lib/id-generator";
import { ConcurrentActionGuard } from "@/lib/action-guard";

describe("ESPACIO ERP — Master Quotation Architecture (Prompt Implementation)", () => {
  let adminUser: any;
  let testClient: any;
  let testLead: any;
  let createdQuotationV1: any;
  let createdQuotationV2: any;
  let standaloneQuotation: any;

  beforeEach(() => {
    ConcurrentActionGuard.reset();
  });

  beforeAll(async () => {
    // Setup test admin user
    adminUser = await db.user.findFirst({ where: { status: "ACTIVE" } });
    if (!adminUser) {
      adminUser = await db.user.create({
        data: {
          email: `test_admin_quote_${Date.now()}@espacio.com`,
          fullName: "Quotation Test Admin",
          passwordHash: "dummyhash",
          accessLevel: "ADMIN",
        },
      });
    }

    // Setup test client
    const clientRef = await IdGeneratorService.generate("CLI");
    testClient = await db.client.create({
      data: {
        referenceNo: clientRef,
        fullName: "Vikram Malhotra",
        phone: `+919876${Math.floor(100000 + Math.random() * 900000)}`,
        email: `vikram_${Date.now()}@gmail.com`,
        address: "Flat 402, Oakwood Residency, Gachibowli",
        city: "Hyderabad",
        state: "Telangana",
        gstin: "36ABCDE1234F1Z5",
      },
    });

    // Setup test lead
    const leadRef = await IdGeneratorService.generate("LEAD");
    testLead = await db.lead.create({
      data: {
        referenceNo: leadRef,
        clientName: "Vikram Malhotra",
        phone: testClient.phone,
        email: testClient.email,
        sourceKey: "DIRECT",
        propertyTypeKey: "APARTMENT_INTERIOR",
        stage: "NEW",
        clientId: testClient.id,
      },
    });
  });

  // TEST A: Lead Quotation — Complete Interiors with Room-wise Structure
  it("TEST A: Creates a Lead Quotation (Complete Interiors) with room-wise breakdown", async () => {
    createdQuotationV1 = await QuotationService.createQuotation(
      {
        title: "Vikram Malhotra - 3BHK Complete Interiors",
        customTitle: "COMPLETE INTERIORS QUOTATION",
        quotationType: "LEAD",
        leadId: testLead.id,
        clientId: testClient.id,
        taxRate: 18,
        items: [
          {
            room: "Living Room",
            category: "MODULAR_WOODWORK",
            itemDescription: "TV Entertainment Unit with Italian marble backing",
            quantity: 1,
            unitKey: "NOS",
            unitRate: 85000,
            discountAmount: 5000,
          },
          {
            room: "Kitchen",
            category: "MODULAR_WOODWORK",
            itemDescription: "Marine Ply Kitchen Cabinets with Blum soft-close",
            quantity: 1,
            unitKey: "NOS",
            unitRate: 150000,
            discountAmount: 0,
          },
          {
            room: "Master Bedroom",
            category: "MODULAR_WOODWORK",
            itemDescription: "Floor to ceiling 4-door wardrobe with tinted glass",
            quantity: 1,
            unitKey: "NOS",
            unitRate: 120000,
            discountAmount: 0,
          },
        ],
      },
      adminUser.id
    );

    expect(createdQuotationV1).toBeDefined();
    expect(createdQuotationV1.referenceNo).toMatch(/^Q-/);
    expect(createdQuotationV1.revision).toBe(1);
    expect(createdQuotationV1.leadId).toBe(testLead.id);
    expect(createdQuotationV1.items.length).toBe(3);

    // Subtotal: (85000 - 5000) + 150000 + 120000 = 350000
    // Tax at 18%: 63000
    // Total: 413000
    expect(createdQuotationV1.subtotal).toBe(350000);
    expect(createdQuotationV1.taxAmount).toBe(63000);
    expect(createdQuotationV1.totalAmount).toBe(413000);

    const fetched = await QuotationService.getQuotationById(createdQuotationV1.id);
    expect(fetched.roomGroups.length).toBe(3);
    expect(fetched.roomGroups.map((rg: any) => rg.room)).toEqual(
      expect.arrayContaining(["Kitchen", "Living Room", "Master Bedroom"])
    );
  });

  // TEST B: Versioning & Revision (v1 -> v2)
  it("TEST B: Creates a revision (v2) without overwriting v1", async () => {
    createdQuotationV2 = await QuotationService.createRevision(
      createdQuotationV1.id,
      "Client requested additional Pooja Unit in Living Room",
      adminUser.id
    );

    expect(createdQuotationV2.revision).toBe(2);
    expect(createdQuotationV2.parentQuotationId).toBe(createdQuotationV1.id);
    expect(createdQuotationV2.referenceNo).toContain("-V2");

    // Add new room item in v2
    const updatedV2 = await QuotationService.updateQuotation(
      createdQuotationV2.id,
      {
        items: [
          ...createdQuotationV1.items.map((item: any) => ({
            room: item.room,
            category: item.category,
            itemDescription: item.itemDescription,
            quantity: item.quantity,
            unitKey: item.unitKey,
            unitRate: item.unitRate,
            discountAmount: item.discountAmount,
          })),
          {
            room: "Living Room",
            category: "MODULAR_WOODWORK",
            itemDescription: "Teak Wood Pooja Mandir Unit with CNC jali",
            quantity: 1,
            unitKey: "NOS",
            unitRate: 45000,
            discountAmount: 0,
          },
        ],
      },
      adminUser.id
    );

    // Subtotal: 350000 + 45000 = 395000; Tax 18%: 71100; Total: 466100
    expect(updatedV2.totalAmount).toBe(466100);

    // Check v1 is preserved and untouched
    const v1Refetched = await QuotationService.getQuotationById(createdQuotationV1.id);
    expect(v1Refetched.totalAmount).toBe(413000);
    expect(v1Refetched.status).toBe("SUPERSEDED");
    expect(v1Refetched.childRevisions.length).toBe(1);
  });

  // TEST C: Acceptance of Accepted Version
  it("TEST C: Approves/Accepts v2 and verifies only v2 is accepted", async () => {
    const approvedV2 = await QuotationService.approveQuotation(
      createdQuotationV2.id,
      {
        clientApprovedName: "Vikram Malhotra",
        approvalNotes: "Signed commercial quotation approved over WhatsApp",
      },
      adminUser.id
    );

    expect(approvedV2.status).toBe("APPROVED");
    expect(approvedV2.clientApprovedName).toBe("Vikram Malhotra");
  });

  // TEST D: Conversion Preconditions
  it("TEST D: Blocks conversion if Lead is not WON or Confirmation Fee is not paid", async () => {
    // Lead is not yet marked won / no confirmation payment
    await db.lead.update({
      where: { id: testLead.id },
      data: { stage: "CONTACTED" },
    });

    const eligibility = await QuotationService.getQuotationConversionEligibility(createdQuotationV2.id);
    expect(eligibility.canConvert).toBe(false);

    await expect(
      QuotationService.convertQuotationToInvoice(createdQuotationV2.id, adminUser.id)
    ).rejects.toThrow(/Cannot convert quotation/i);
  });

  // TEST E: Invoice Conversion when All 3 Conditions are Satisfied
  it("TEST E: Successfully converts accepted quotation to Invoice when Lead = Won & Confirmation Fee = Paid", async () => {
    // 1. Advance lead to WON
    await db.lead.update({
      where: { id: testLead.id },
      data: { stage: "WON" },
    });

    // 2. Record Confirmation Fee payment
    const paymentRef = await IdGeneratorService.generate("PAY");
    await db.clientPayment.create({
      data: {
        referenceNo: paymentRef,
        quotationId: createdQuotationV2.id,
        leadId: testLead.id,
        clientId: testClient.id,
        amount: 50000,
        paymentMethod: "UPI",
        referenceNoExt: `UPI-CONFIRM-${Date.now()}`,
        status: "VERIFIED",
        notes: "Project Confirmation Fee Advance",
      },
    });

    // 3. Verify eligibility is now satisfied
    const eligibility = await QuotationService.getQuotationConversionEligibility(createdQuotationV2.id);
    expect(eligibility.isAccepted).toBe(true);
    expect(eligibility.isLeadWon).toBe(true);
    expect(eligibility.isConfirmationFeePaid).toBe(true);
    expect(eligibility.canConvert).toBe(true);
    expect(eligibility.isLocked).toBe(true);

    // 4. Convert to Invoice
    const conversionResult = await QuotationService.convertQuotationToInvoice(
      createdQuotationV2.id,
      adminUser.id
    );

    expect(conversionResult.success).toBe(true);
    expect(conversionResult.invoice).toBeDefined();
    expect(conversionResult.invoice.invoiceNo).toMatch(/^INV-/);
    expect(conversionResult.invoice.customerName).toBe(testClient.fullName);
    expect(conversionResult.invoice.customerGstin).toBe(testClient.gstin);
    expect(conversionResult.invoice.grandTotal).toBe(466100);
    expect(conversionResult.invoice.paidAmount).toBe(50000); // 50,000 confirmation fee linked
    expect(conversionResult.invoice.outstandingAmount).toBe(416100);
  });

  // TEST F: Payment Installment Tracking against Invoice
  it("TEST F: Tracks client payment installments and updates outstanding balance correctly", async () => {
    const invoices = await GstInvoiceService.getInvoices({ quotationId: createdQuotationV2.id });
    const invoice = invoices[0];
    expect(invoice).toBeDefined();

    // Record next installment of 1,00,000
    const payment = await PaymentService.recordPayment(
      {
        gstInvoiceId: invoice.id,
        clientId: testClient.id,
        amount: 100000,
        paymentMethod: "BANK_TRANSFER",
        externalReference: `NEFT-STAGE1-${Date.now()}`,
        notes: "Stage 1 Woodwork installment",
      },
      adminUser.id
    );

    expect(payment.status).toBe("VERIFIED");

    // Fetch updated invoice
    const updatedInvoice = await GstInvoiceService.getInvoiceById(invoice.id);
    expect(updatedInvoice.paidAmount).toBe(150000); // 50,000 + 100,000
    expect(updatedInvoice.outstandingAmount).toBe(316100); // 466100 - 150000
    expect(updatedInvoice.status).toBe("PARTIALLY_PAID");
  });

  // TEST G: Change Orders Do Not Alter Original Invoice
  it("TEST G: Scope changes create Change Orders without altering original invoice", async () => {
    const invoices = await GstInvoiceService.getInvoices({ quotationId: createdQuotationV2.id });
    const invoice = invoices[0];
    const initialInvoiceTotal = invoice.grandTotal;

    // Create a Project from the Won Lead
    const projRef = await IdGeneratorService.generate("PROJ");
    const project = await db.project.create({
      data: {
        referenceNo: projRef,
        leadId: testLead.id,
        clientId: testClient.id,
        title: "Vikram Malhotra - Execution",
        contractValue: 466100,
        stage: "WOOD_WORK",
      },
    });

    // Create Change Order for additional scope
    const changeOrder = await ChangeOrderService.createChangeOrder(
      project.id,
      {
        title: "Foyer Paneling & Brass Inlay Upgrade",
        description: "Add acoustic paneling with brass T-profiles in entrance foyer",
        amount: 35000,
        timelineImpactDays: 3,
      },
      adminUser.id
    );

    expect(changeOrder.referenceNo).toMatch(/^CO-/);
    expect(changeOrder.amount).toBe(35000);

    // Approve Change Order
    const approvedCO = await ChangeOrderService.approveChangeOrder(changeOrder.id, adminUser.id);
    expect(approvedCO.status).toBe("APPROVED");

    // Verify original invoice remains unchanged
    const invoiceRefetched = await GstInvoiceService.getInvoiceById(invoice.id);
    expect(invoiceRefetched.grandTotal).toBe(initialInvoiceTotal);
  });

  // TEST H: Materials & Services Quotation — Standalone Structure
  it("TEST H: Creates a standalone Materials & Services Quotation with flat line items (no rooms)", async () => {
    standaloneQuotation = await QuotationService.createQuotation(
      {
        title: "Standalone Tiles & 3D Design Quote",
        customTitle: "MATERIALS & SERVICES QUOTATION",
        quotationType: "MATERIAL",
        clientId: testClient.id,
        taxRate: 18,
        items: [
          {
            room: "MATERIALS",
            category: "TILES_SUPPLY",
            itemDescription: "Kajaria 1200x600mm Glazed Vitrified Tiles",
            specifications: "Statuario Gold High Gloss finish (40 boxes)",
            quantity: 40,
            unitKey: "NOS",
            unitRate: 1800,
            discountAmount: 0,
          },
          {
            room: "MATERIALS",
            category: "SERVICES",
            itemDescription: "Workmen Provision - Tile Laying & Epoxy Grouting",
            quantity: 5,
            unitKey: "NOS",
            unitRate: 2000,
            discountAmount: 0,
          },
          {
            room: "MATERIALS",
            category: "SERVICES",
            itemDescription: "3D Interior Photorealistic Visualization & CAD Pack",
            quantity: 1,
            unitKey: "NOS",
            unitRate: 15000,
            discountAmount: 0,
          },
        ],
      },
      adminUser.id
    );

    expect(standaloneQuotation).toBeDefined();
    expect(standaloneQuotation.items.length).toBe(3);
    // Subtotal: (40*1800) + (5*2000) + 15000 = 72000 + 10000 + 15000 = 97000
    // Tax 18%: 17460
    // Grand Total: 114460
    expect(standaloneQuotation.subtotal).toBe(97000);
    expect(standaloneQuotation.taxAmount).toBe(17460);
    expect(standaloneQuotation.totalAmount).toBe(114460);
  });

  // TEST J: Standalone Quotation Approval & Invoice Conversion
  it("TEST J: Approves standalone Materials & Services quotation and converts into Invoice", async () => {
    // Approve standalone quotation
    await QuotationService.approveQuotation(
      standaloneQuotation.id,
      { clientApprovedName: "Vikram Malhotra" },
      adminUser.id
    );

    // Verify conversion eligibility (standalone only requires approval)
    const eligibility = await QuotationService.getQuotationConversionEligibility(standaloneQuotation.id);
    expect(eligibility.isAccepted).toBe(true);
    expect(eligibility.canConvert).toBe(true);

    // Convert into standalone Invoice
    const conversion = await QuotationService.convertQuotationToInvoice(
      standaloneQuotation.id,
      adminUser.id
    );

    expect(conversion.success).toBe(true);
    expect(conversion.invoice.invoiceNo).toMatch(/^INV-/);
    expect(conversion.invoice.grandTotal).toBe(114460);
  });

  // TEST K: Historical Project Quotation Compatibility
  it("TEST K: Historical Project Quotations remain viewable and preserved", async () => {
    // Create a legacy project quotation in the DB to test backward compatibility
    const legacyQRef = await IdGeneratorService.generate("Q");
    const legacyProjectQuote = await db.quotation.create({
      data: {
        referenceNo: legacyQRef,
        title: "Legacy Project Quotation 2025",
        status: "APPROVED",
        subtotal: 50000,
        totalAmount: 59000,
        taxRate: 18,
        taxAmount: 9000,
        clientSnapshot: JSON.stringify({ quotationType: "PROJECT" }),
        items: {
          create: [
            {
              room: "General",
              category: "CIVIL",
              itemDescription: "Historical Civil Demolition",
              quantity: 1,
              unitRate: 50000,
              totalAmount: 50000,
            },
          ],
        },
      },
    });

    const retrieved = await QuotationService.getQuotationById(legacyProjectQuote.id);
    expect(retrieved).toBeDefined();
    expect(retrieved.quotationType).toBe("PROJECT");
    expect(retrieved.totalAmount).toBe(59000);
  });

  // TEST L: Duplicate Conversion Guard
  it("TEST L: Duplicate conversion of the same quotation is strictly blocked", async () => {
    await expect(
      QuotationService.convertQuotationToInvoice(standaloneQuotation.id, adminUser.id)
    ).rejects.toThrow(/already been converted into Invoice/i);
  });
});
