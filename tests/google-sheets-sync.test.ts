import { describe, it, expect, afterAll } from "vitest";
import { db } from "@/lib/db";
import { GoogleSheetsSyncService } from "@/modules/integrations/google-sheets.service";

describe("ESPACIO ERP — Google Sheets Live Sync Integration Test Suite", () => {
  const testPhone = `+917${Date.now().toString().slice(-9)}`;
  const testMatPhone = `+916${Date.now().toString().slice(-9)}`;
  let createdLeadId: string | null = null;
  let createdMatLeadId: string | null = null;

  afterAll(async () => {
    if (createdLeadId) {
      await db.lead.delete({ where: { id: createdLeadId } }).catch(() => null);
    }
    if (createdMatLeadId) {
      await db.materialLead.delete({ where: { id: createdMatLeadId } }).catch(() => null);
    }
  });

  it("1. Parses RFC 4180 CSV rows with commas inside quotes and trimmed keys", () => {
    const rawCsv = `DATE AND TIME,Customer Name,Primary Phone,Email Address,Requirement / Space,Stage / Budget\n"24/10/2026, 14:30","Aarav Sharma","+919876543210","aarav@example.com","Full 3BHK Interior, Living & Modular Kitchen","₹18,50,000"`;
    const rows = GoogleSheetsSyncService.parseCsv(rawCsv);

    expect(rows).toHaveLength(1);
    expect(rows[0]["Customer Name"]).toBe("Aarav Sharma");
    expect(rows[0]["Primary Phone"]).toBe("+919876543210");
    expect(rows[0]["Requirement / Space"]).toBe("Full 3BHK Interior, Living & Modular Kitchen");
    expect(rows[0]["Stage / Budget"]).toBe("₹18,50,000");
  });

  it("2. Syncs interior lead row into db.lead with LEAD prefix, NEW stage, and deduplication", async () => {
    const sampleLeadRow = {
      "DATE AND TIME": new Date().toISOString(),
      "Customer Name": "Sheet Test Customer",
      "Primary Phone": testPhone,
      "Email Address": `sheet_customer_${Date.now()}@test.com`,
      "Project Location": "HSR Layout, Bangalore",
      "Requirement / Space": "4BHK Complete Villa Interior",
      "Property Type / Scope": "VILLA",
      "Stage / Budget": "₹25,00,000",
      "Notes / Details": "Form submitted via website portfolio page",
      "Source / Form Type": "WEBSITE_INBOUND",
    };

    // First ingestion: must create lead
    const result1 = await GoogleSheetsSyncService.syncLeadsFromSheet([sampleLeadRow]);
    expect(result1.imported).toBe(1);

    const savedLead = await db.lead.findFirst({
      where: { phone: testPhone },
    });
    expect(savedLead).toBeDefined();
    expect(savedLead?.clientName).toBe("Sheet Test Customer");
    expect(savedLead?.referenceNo).toMatch(/^LEAD-\d{4}-\d{4}$/);
    expect(savedLead?.stage).toBe("NEW");
    expect(savedLead?.sourceKey).toBe("WEBSITE");
    expect(savedLead?.estimatedBudget).toBe(2500000);
    createdLeadId = savedLead!.id;

    // Second ingestion with same row: must be skipped (Idempotency)
    const result2 = await GoogleSheetsSyncService.syncLeadsFromSheet([sampleLeadRow]);
    expect(result2.imported).toBe(0);
    expect(result2.skipped).toBe(1);
  });

  it("3. Syncs materials lead row into db.materialLead with MAT-LEAD prefix, NEW stage, and deduplication", async () => {
    const sampleMatRow = {
      "DATE AND TIME": new Date().toISOString(),
      "Customer Name": "Greenply Builder Corp",
      "Primary Phone": testMatPhone,
      "Email Address": `procurement_${Date.now()}@builder.test`,
      "Project Location": "Whitefield, Bangalore",
      "Material / Catalogue Details": "Century Club Prime Marine Plywood 19mm",
      "Quantity / Requirement": "50 Sheets",
      "Stage / Budget": "₹1,20,000",
      "Notes / Details": "Delivery required at site next week",
      "Source / Form Type": "WEBSITE_CATALOG",
    };

    // First ingestion: must create material lead
    const result1 = await GoogleSheetsSyncService.syncMaterialLeadsFromSheet([sampleMatRow]);
    expect(result1.imported).toBe(1);

    const savedMatLead = await db.materialLead.findFirst({
      where: { primaryContact: testMatPhone },
    });
    expect(savedMatLead).toBeDefined();
    expect(savedMatLead?.customerName).toBe("Greenply Builder Corp");
    expect(savedMatLead?.referenceNo).toMatch(/^MAT-LEAD-\d{4}-\d{4}$/);
    expect(savedMatLead?.stage).toBe("NEW");
    expect(savedMatLead?.sourceKey).toBe("WEBSITE");
    expect(savedMatLead?.requirement).toBe("Century Club Prime Marine Plywood 19mm");
    createdMatLeadId = savedMatLead!.id;

    // Second ingestion with same row: must be skipped (Idempotency)
    const result2 = await GoogleSheetsSyncService.syncMaterialLeadsFromSheet([sampleMatRow]);
    expect(result2.imported).toBe(0);
    expect(result2.skipped).toBe(1);
  });
});
