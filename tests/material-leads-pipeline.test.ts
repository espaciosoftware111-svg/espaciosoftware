import { describe, it, expect } from "vitest";
import { materialLeadService } from "../src/modules/material-leads/material-lead.service";
import { MaterialsOrderService } from "../src/modules/procurement/materials-order.service";
import { websiteMaterialEnquirySchema } from "../src/validators/material-lead.schema";
import { db } from "../src/lib/db";
import { IdGeneratorService } from "../src/lib/id-generator";

describe("ESPACIO ERP — Master Material Leads Pipeline Full Lifecycle Suite", () => {
  let createdLeadId: string;
  let createdLeadRef: string;
  let vendor1Id: string;
  let vendor2Id: string;
  let linkedOrderId: string;

  it("Step 1: Website Material Request creates Material Lead with MAT-LEAD ID, SOURCE=WEBSITE, and STATUS=NEW", async () => {
    const timestamp = Date.now();
    const customerName = `Rohan Verma ${timestamp}`;
    const primaryContact = `+91 ${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const secondaryContact = `+91 ${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const email = `rohan.verma.${timestamp}@example.com`;
    const location = "Jubilee Hills, Hyderabad";

    const payload = {
      customerName,
      contactNumber1: primaryContact,
      contactNumber2: secondaryContact,
      emailAddress: email,
      projectLocation: location,
      materialPreferences: "20 sheets Premium Plywood, Century Club Prime 710",
      source: "Website",
    };

    const parsed = websiteMaterialEnquirySchema.safeParse(payload);
    expect(parsed.success).toBe(true);

    const result = await materialLeadService.ingestWebsiteMaterialEnquiry(payload);
    expect(result.materialLead).toBeDefined();
    expect(result.materialLead.materialLeadId).toMatch(/^MAT-LEAD-\d{4}-\d{4}$/);
    expect(result.materialLead.source).toBe("Website");
    expect(result.materialLead.status).toBe("NEW");
    expect(result.materialLead.customerName).toBe(customerName);
    expect(result.materialLead.primaryContact).toBe(primaryContact);
    expect(result.materialLead.secondaryContact).toBe(secondaryContact);
    expect(result.materialLead.email).toBe(email);
    expect(result.materialLead.location).toBe(location);

    createdLeadId = result.materialLead.id;
    createdLeadRef = result.materialLead.materialLeadId;
  });

  it("Step 2: Super Admin updates contact status to NOT_CONTACTED with scheduled follow-up", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const followUpDateStr = tomorrow.toISOString().split("T")[0];

    const result = await materialLeadService.updateContactStatus(createdLeadId, {
      status: "NOT_CONTACTED",
      notes: "Phone rang without response. Follow-up scheduled for tomorrow morning.",
      followUpDate: followUpDateStr,
      followUpTime: "10:30",
    });

    expect(result.status).toBe("NOT_CONTACTED");
    expect(result.followUps.length).toBeGreaterThanOrEqual(1);
    expect(result.followUps[0].notes).toContain("Phone rang without response");
    // Ensure the lead ID remains exactly the same (no duplicate records)
    expect(result.id).toBe(createdLeadId);
    expect(result.materialLeadId).toBe(createdLeadRef);
  });

  it("Step 3: Super Admin reaches customer and transitions status to CONTACTED", async () => {
    const result = await materialLeadService.updateContactStatus(createdLeadId, {
      status: "CONTACTED",
      notes: "Customer contacted successfully. Discussed requirement for premium marine plywood.",
    });

    expect(result.status).toBe("CONTACTED");
    expect(result.id).toBe(createdLeadId);
  });

  it("Step 4: Super Admin captures Material Requirements and transitions to MATERIAL_REQUIRED", async () => {
    const reqRes = await materialLeadService.addRequirement(createdLeadId, {
      materialName: "Premium Plywood 18mm",
      category: "Plywood",
      quantity: 20,
      unit: "Sheets",
      additionalRequirements: "Century Club Prime 710 Premium Grade",
      notes: "Customer requires high-quality calibrated marine grade sheets.",
    });

    expect(reqRes.success).toBe(true);
    expect(reqRes.requirements.length).toBe(1);
    expect(reqRes.requirement.materialName).toBe("Premium Plywood 18mm");
    expect(reqRes.requirement.quantity).toBe(20);
    expect(reqRes.requirement.unit).toBe("Sheets");

    // Advance status to MATERIAL_REQUIRED
    const updated = await materialLeadService.updateMaterialLead(createdLeadId, {
      status: "MATERIAL_REQUIRED",
    });
    expect(updated.status).toBe("MATERIAL_REQUIRED");
  });

  it("Step 5: Quotation is generated and sent to customer (QUOTATION_GENERATED -> QUOTATION_SENT)", async () => {
    // Generate Quotation linked to Material Lead
    const qRef = await IdGeneratorService.generate("QTN");
    const quote = await db.quotation.create({
      data: {
        referenceNo: qRef,
        lead: { connect: { id: createdLeadId } },
        title: "Material Supply - Premium Plywood Package",
        clientSnapshot: JSON.stringify({
          clientName: "Rohan Verma",
          clientPhone: "+91 9778898310",
          location: "Jubilee Hills, Hyderabad",
        }),
        subtotal: 75000,
        totalAmount: 75000,
        status: "DRAFT",
      },
    });

    expect(quote.id).toBeDefined();

    // Advance status to QUOTATION_GENERATED
    const s1 = await materialLeadService.updateMaterialLead(createdLeadId, {
      status: "QUOTATION_GENERATED",
    });
    expect(s1.status).toBe("QUOTATION_GENERATED");

    // Mark Quotation Sent
    await db.quotation.update({
      where: { id: quote.id },
      data: { status: "SENT" },
    });

    const s2 = await materialLeadService.updateMaterialLead(createdLeadId, {
      status: "QUOTATION_SENT",
    });
    expect(s2.status).toBe("QUOTATION_SENT");

    // Verify quotation appears in Material Lead profile
    const leadData = await materialLeadService.getMaterialLeadById(createdLeadId);
    expect(leadData.quotations.length).toBeGreaterThanOrEqual(1);
    expect(leadData.quotations[0].referenceNo).toBe(qRef);
  });

  it("Step 6: Customer accepts quote -> Lead marked WON", async () => {
    const updated = await materialLeadService.updateMaterialLead(createdLeadId, {
      status: "WON",
    });
    expect(updated.status).toBe("WON");
  });

  it("Step 7: Super Admin places order -> Creates MAT-ORD in PurchaseOrder and dispatches request to Vendor A (PENDING)", async () => {
    // Create Vendor A
    const v1Ref = await IdGeneratorService.generate("VEN");
    const vendorA = await db.vendor.create({
      data: {
        referenceNo: v1Ref,
        name: "ABC Plywood & Hardware",
        phone: "+91 9887766110",
        email: "orders@abcplywood.com",
        address: "Sanath Nagar, Hyderabad",
        categoryKey: "MATERIALS",
        status: "ACTIVE",
      },
    });
    vendor1Id = vendorA.id;

    const orderRes = await materialLeadService.placeMaterialOrder(createdLeadId, {
      vendorId: vendorA.id,
      finalVendorOrderAmount: 70000,
      expectedDeliveryDate: new Date().toISOString(),
      notes: "Urgent delivery required for site execution.",
      materials: [
        {
          materialName: "Premium Plywood 18mm",
          category: "Plywood",
          quantity: 20,
          unit: "Sheets",
          additionalRequirements: "Century Club Prime 710",
          notes: "Calibrated sheets only",
        },
      ],
    });

    expect(orderRes.success).toBe(true);
    expect(orderRes.order).toBeDefined();
    expect(orderRes.order.referenceNo).toMatch(/^MAT-ORD-\d{4}-\d{4}$/);
    expect(orderRes.order.projectId).toBeNull(); // Strictly null - Standalone material order!
    expect(orderRes.order.grandTotal).toBe(70000);
    expect(orderRes.vendorRequest).toBeDefined();
    expect(orderRes.vendorRequest.status).toBe("PENDING");
    expect(orderRes.vendorRequest.vendorName).toBe("ABC Plywood & Hardware");

    linkedOrderId = orderRes.order.id;

    const leadData = await materialLeadService.getMaterialLeadById(createdLeadId);
    expect(leadData.status).toBe("ORDER_PLACED");
    expect(leadData.vendorRequests.length).toBe(1);
    expect(leadData.vendorRequests[0].status).toBe("PENDING");
  });

  it("Step 8: Vendor A rejects request -> Status becomes VENDOR_REJECTED with reason recorded in history", async () => {
    const responseRes = await materialLeadService.recordVendorResponse(createdLeadId, {
      response: "REJECTED",
      rejectionReason: "Out of stock. Next batch arrives in 3 weeks.",
      notes: "Vendor unable to commit to required delivery timeline.",
    });

    expect(responseRes.success).toBe(true);
    expect(responseRes.response).toBe("REJECTED");
    expect(responseRes.vendorRequest.status).toBe("REJECTED");
    expect(responseRes.vendorRequest.rejectionReason).toContain("Out of stock");

    const leadData = await materialLeadService.getMaterialLeadById(createdLeadId);
    expect(leadData.status).toBe("VENDOR_REJECTED");
    expect(leadData.vendorRequests[0].status).toBe("REJECTED");
  });

  it("Step 9: Super Admin selects Vendor B -> Dispatches new request while preserving complete request history", async () => {
    // Create Vendor B
    const v2Ref = await IdGeneratorService.generate("VEN");
    const vendorB = await db.vendor.create({
      data: {
        referenceNo: v2Ref,
        name: "Supreme Plywood Distributors",
        phone: "+91 9776655443",
        email: "sales@supremeply.com",
        address: "Kukatpally, Hyderabad",
        categoryKey: "MATERIALS",
        status: "ACTIVE",
      },
    });
    vendor2Id = vendorB.id;

    const newReqRes = await materialLeadService.sendVendorRequest(createdLeadId, {
      orderId: linkedOrderId,
      vendorId: vendorB.id,
      notes: "Checking stock availability for 20 sheets 18mm Club Prime.",
    });

    expect(newReqRes.success).toBe(true);
    expect(newReqRes.vendorRequest.status).toBe("PENDING");
    expect(newReqRes.vendorRequest.vendorName).toBe("Supreme Plywood Distributors");

    const leadData = await materialLeadService.getMaterialLeadById(createdLeadId);
    expect(leadData.status).toBe("VENDOR_REQUEST");
    // Verify complete history is preserved: Vendor B (Pending) and Vendor A (Rejected)
    expect(leadData.vendorRequests.length).toBe(2);
    expect(leadData.vendorRequests[0].vendorName).toBe("Supreme Plywood Distributors");
    expect(leadData.vendorRequests[0].status).toBe("PENDING");
    expect(leadData.vendorRequests[1].vendorName).toBe("ABC Plywood & Hardware");
    expect(leadData.vendorRequests[1].status).toBe("REJECTED");
  });

  it("Step 10: Vendor B accepts order -> Order status becomes CONFIRMED and appears in Materials Order section", async () => {
    const acceptRes = await materialLeadService.recordVendorResponse(createdLeadId, {
      response: "ACCEPTED",
      notes: "Vendor confirmed stock availability. Dispatch scheduled in 2 days.",
      negotiatedAmount: 68500,
    });

    expect(acceptRes.success).toBe(true);
    expect(acceptRes.response).toBe("ACCEPTED");
    expect(acceptRes.vendorRequest.status).toBe("ACCEPTED");

    // Verify Material Lead profile shows VENDOR_ACCEPTED
    const leadData = await materialLeadService.getMaterialLeadById(createdLeadId);
    expect(leadData.status).toBe("VENDOR_ACCEPTED");
    expect(leadData.vendorRequests[0].status).toBe("ACCEPTED");

    // Verify PurchaseOrder status is CONFIRMED in Materials Order subsystem
    const confirmedOrders = await MaterialsOrderService.getConfirmedMaterialsOrders({
      page: 1,
      limit: 10,
    });

    expect(confirmedOrders.items.length).toBeGreaterThanOrEqual(1);
    const matched = confirmedOrders.items.find((o) => o.id === linkedOrderId);
    expect(matched).toBeDefined();
    expect(matched?.status).toBe("CONFIRMED");
    expect(matched?.finalVendorOrderAmount).toBe(68500);
    expect(matched?.vendor?.name).toBe("Supreme Plywood Distributors");

    // Verify getMaterialsOrderById returns full details
    const orderDetails = await MaterialsOrderService.getMaterialsOrderById(linkedOrderId);
    expect(orderDetails).toBeDefined();
    expect(orderDetails.referenceNo).toMatch(/^MAT-ORD-\d{4}-\d{4}$/);
    expect(orderDetails.customer.leadRef).toBe(createdLeadRef);
    expect(orderDetails.vendor.name).toBe("Supreme Plywood Distributors");
    expect(orderDetails.vendorRequests?.length).toBe(2);
  });

  it("Step 11: Verifies LOST branch preserves complete record without deletion", async () => {
    const lostEnquiry = {
      customerName: `Lost Test Client ${Date.now()}`,
      contactNumber1: `+91 ${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      projectLocation: "Secunderabad",
    };

    const lostLead = await materialLeadService.ingestWebsiteMaterialEnquiry(lostEnquiry);
    const lostLeadId = lostLead.materialLead.id;

    // Contacted
    await materialLeadService.updateContactStatus(lostLeadId, { status: "CONTACTED" });
    // Add requirement
    await materialLeadService.addRequirement(lostLeadId, {
      materialName: "Charcoal Louvers",
      category: "Laminates",
      quantity: 10,
      unit: "Nos",
    });
    // Mark LOST
    const lostRes = await materialLeadService.updateMaterialLead(lostLeadId, {
      status: "LOST",
      lossReason: "Client chose local retail supplier due to immediate availability.",
    });

    expect(lostRes.status).toBe("LOST");

    // Record remains completely stored for reporting & analytics
    const fetched = await materialLeadService.getMaterialLeadById(lostLeadId);
    expect(fetched).toBeDefined();
    expect(fetched.status).toBe("LOST");
    expect(fetched.requirements.length).toBe(1);
    expect(fetched.timeline.length).toBeGreaterThanOrEqual(3);
  });
});
