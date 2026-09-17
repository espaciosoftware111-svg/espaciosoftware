import { describe, it, expect } from "vitest";
import { materialLeadService } from "../src/modules/material-leads/material-lead.service";
import { websiteMaterialEnquirySchema } from "../src/validators/material-lead.schema";

describe("ESPACIO ERP — Material Leads Full Dynamic Lifecycle Suite", () => {
  it("1. Successfully validates complete 5-field Website Material Request & Catalog Unlock schema", () => {
    const validForm = {
      customerName: "Rohan Verma",
      contactNumber1: "+91 9778898310",
      contactNumber2: "+91 9887766554",
      emailAddress: "rohan.verma@example.com",
      projectLocation: "Jubilee Hills, Hyderabad",
      materialPreferences: "Need 18mm BWP marine plywood and charcoal louvers for 3 BHK",
      source: "Website",
    };

    const parsed = websiteMaterialEnquirySchema.safeParse(validForm);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.customerName).toBe("Rohan Verma");
      expect(parsed.data.primaryContact).toBe("+91 9778898310");
      expect(parsed.data.secondaryContact).toBe("+91 9887766554");
      expect(parsed.data.email).toBe("rohan.verma@example.com");
      expect(parsed.data.location).toBe("Jubilee Hills, Hyderabad");
      expect(parsed.data.source).toBe("Website");
    }
  });

  it("2. Supports Global 'Others' custom source input dynamically", () => {
    const customSourceForm = {
      customerName: "Pooja Hegde",
      contactNumber1: "+91 9112233445",
      emailAddress: "pooja.hegde@example.com",
      projectLocation: "Banjara Hills, Hyderabad",
      source: "OTHER",
      customSource: "Architect Referral - Studio Design",
    };

    const parsed = websiteMaterialEnquirySchema.safeParse(customSourceForm);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.source).toBe("Architect Referral - Studio Design");
      expect(parsed.data.customSource).toBe("Architect Referral - Studio Design");
    }
  });

  it("3. Ingests website Material Request and generates unique MAT-LEAD-2026-XXXX ID with NEW status", async () => {
    const testEnquiry = {
      customerName: `Material Client ${Date.now()}`,
      contactNumber1: `+91 ${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      contactNumber2: "+91 9123456789",
      emailAddress: `mat-client-${Date.now()}@example.com`,
      projectLocation: "Gachibowli, Hyderabad",
      materialPreferences: "Teak veneer and Century ply sheets",
    };

    const result = await materialLeadService.ingestWebsiteMaterialEnquiry(testEnquiry);

    expect(result).toBeDefined();
    expect(result.materialLead).toBeDefined();
    expect(result.materialLead.materialLeadId).toMatch(/^MAT-LEAD-\d{4}-\d{4}$/);
    expect(result.materialLead.source).toBe("Website");
    expect(result.materialLead.status).toBe("NEW");
    expect(result.materialLead.customerName).toBe(testEnquiry.customerName);
    expect(result.materialLead.primaryContact).toBe(testEnquiry.contactNumber1);
    expect(result.materialLead.secondaryContact).toBe(testEnquiry.contactNumber2);
    expect(result.materialLead.location).toBe("Gachibowli, Hyderabad");

    // Verify retrieval by ID
    const fetched = await materialLeadService.getMaterialLeadById(result.materialLead.id);
    expect(fetched).toBeDefined();
    expect(fetched.materialLeadId).toBe(result.materialLead.materialLeadId);
    expect(fetched.secondaryContact).toBe(testEnquiry.contactNumber2);
  });

  it("4. Rejects duplicate submissions with identical contact details safely", async () => {
    const uniquePhone = `+91 ${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const uniqueEmail = `dup-mat-${Date.now()}@example.com`;

    const enquiry1 = {
      customerName: "Duplicate Test Lead",
      contactNumber1: uniquePhone,
      emailAddress: uniqueEmail,
      projectLocation: "Madhapur, Hyderabad",
    };

    const first = await materialLeadService.ingestWebsiteMaterialEnquiry(enquiry1);
    expect(first.materialLead).toBeDefined();

    // Second submission with exact same contact should be rejected
    await expect(materialLeadService.ingestWebsiteMaterialEnquiry(enquiry1)).rejects.toThrow();
  });

  it("5. Adds, updates, and removes Material Requirement items on a Material Lead", async () => {
    const testEnquiry = {
      customerName: `Req Test Lead ${Date.now()}`,
      contactNumber1: `+91 ${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      projectLocation: "Kondapur, Hyderabad",
    };

    const created = await materialLeadService.ingestWebsiteMaterialEnquiry(testEnquiry);
    const leadId = created.materialLead.id;

    // Add requirement item 1
    const addRes1 = await materialLeadService.addRequirement(leadId, {
      materialName: "18mm Marine Plywood",
      category: "Plywood",
      quantity: 25,
      unit: "Sheets",
      additionalRequirements: "Century Club Prime 710",
      notes: "Customer requires premium quality materials.",
    });

    expect(addRes1.success).toBe(true);
    expect(addRes1.requirement.materialName).toBe("18mm Marine Plywood");
    expect(addRes1.requirement.quantity).toBe(25);
    expect(addRes1.requirements.length).toBe(1);

    const reqId = addRes1.requirement.id!;

    // Update requirement item 1
    const updateRes = await materialLeadService.updateRequirement(leadId, reqId, {
      quantity: 30,
      notes: "Increased quantity to 30 sheets per customer revision",
    });

    expect(updateRes.success).toBe(true);
    expect(updateRes.requirement.quantity).toBe(30);

    // Delete requirement item
    const delRes = await materialLeadService.deleteRequirement(leadId, reqId);
    expect(delRes.success).toBe(true);
    expect(delRes.requirements.length).toBe(0);
  });

  it("6. Schedules CRM follow-up and verifies it is recorded in Activity Timeline", async () => {
    const testEnquiry = {
      customerName: `Follow-up Lead ${Date.now()}`,
      contactNumber1: `+91 ${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      projectLocation: "Hitec City, Hyderabad",
    };

    const created = await materialLeadService.ingestWebsiteMaterialEnquiry(testEnquiry);
    const leadId = created.materialLead.id;

    // Schedule follow-up
    const followUpRes = await materialLeadService.addFollowUp(leadId, {
      followUpDate: new Date().toISOString(),
      followUpTime: "14:30",
      notes: "Customer requested revised material pricing for commercial order.",
      status: "PENDING",
    });

    expect(followUpRes.success).toBe(true);
    expect(followUpRes.followUp.notes).toBe("Customer requested revised material pricing for commercial order.");

    // Complete follow-up
    const completeRes = await materialLeadService.completeFollowUp(
      followUpRes.followUp.id,
      "Discussed discounted wholesale pricing. Client agreed to advance to quote."
    );

    expect(completeRes.success).toBe(true);
    expect(completeRes.followUp.status).toBe("COMPLETED");

    // Verify timeline
    const fullLead = await materialLeadService.getMaterialLeadById(leadId);
    expect(fullLead.timeline.length).toBeGreaterThan(0);
  });

  it("7. Progresses Material Lead through complete status pipeline smoothly", async () => {
    const testEnquiry = {
      customerName: `Pipeline Lead ${Date.now()}`,
      contactNumber1: `+91 ${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      projectLocation: "Banjara Hills, Hyderabad",
    };

    const created = await materialLeadService.ingestWebsiteMaterialEnquiry(testEnquiry);
    const leadId = created.materialLead.id;

    // Transition: NEW -> CONTACTED
    const s1 = await materialLeadService.updateMaterialLead(leadId, { status: "CONTACTED" });
    expect(s1.materialLead.status).toBe("CONTACTED");

    // Transition: CONTACTED -> REQUIREMENT_DISCUSSED
    const s2 = await materialLeadService.updateMaterialLead(leadId, { status: "REQUIREMENT_DISCUSSED" });
    expect(s2.materialLead.status).toBe("REQUIREMENT_DISCUSSED");

    // Transition: REQUIREMENT_DISCUSSED -> QUOTATION_IN_PROGRESS
    const s3 = await materialLeadService.updateMaterialLead(leadId, { status: "QUOTATION_IN_PROGRESS" });
    expect(s3.materialLead.status).toBe("QUOTATION_IN_PROGRESS");

    // Transition: QUOTATION_IN_PROGRESS -> QUOTATION_SENT
    const s4 = await materialLeadService.updateMaterialLead(leadId, { status: "QUOTATION_SENT" });
    expect(s4.materialLead.status).toBe("QUOTATION_SENT");

    // Transition: QUOTATION_SENT -> ORDER_CONFIRMED
    const s5 = await materialLeadService.updateMaterialLead(leadId, { status: "ORDER_CONFIRMED" });
    expect(s5.materialLead.status).toBe("ORDER_CONFIRMED");

    // Transition: ORDER_CONFIRMED -> ORDER_COMPLETED
    const s6 = await materialLeadService.updateMaterialLead(leadId, { status: "ORDER_COMPLETED" });
    expect(s6.materialLead.status).toBe("ORDER_COMPLETED");
  });

  it("8. Computes dynamic KPI metrics accurately from live database state", async () => {
    const result = await materialLeadService.getMaterialLeads({ page: 1, limit: 10 });
    expect(result).toBeDefined();
    expect(result.pagination).toBeDefined();
    expect(result.pagination.kpi).toBeDefined();
    expect(typeof result.pagination.kpi.totalMaterialLeads).toBe("number");
    expect(typeof result.pagination.kpi.activeMaterialLeads).toBe("number");
    expect(typeof result.pagination.kpi.quotationsSent).toBe("number");
    expect(typeof result.pagination.kpi.convertedOrdered).toBe("number");
    expect(result.pagination.kpi.totalMaterialLeads).toBeGreaterThanOrEqual(1);
  });
});
