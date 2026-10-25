/**
 * ESPACIO ERP & WEBSITE GOOGLE SHEETS WEBHOOK
 * Automatically synchronizes leads into Google Sheets with formatted sequential IDs:
 * - Interior / Design Leads -> ESP-LEAD-0001, ESP-LEAD-0002, etc.
 * - Materials Leads         -> ESP-MAT-0001, ESP-MAT-0002, etc.
 */

const LEADS_SHEET_NAME = "Leads";
const MATERIALS_SHEET_NAME = "Materials Leads";

const LEADS_HEADERS = [
  "DATE AND TIME",
  "Lead ID",
  "Source / Form Type",
  "Customer Name",
  "Primary Phone",
  "Secondary Phone",
  "Email Address",
  "Project Location",
  "Requirement / Space",
  "Property Type / Scope",
  "Stage / Budget",
  "Notes / Details",
  "Status"
];

const MATERIALS_HEADERS = [
  "DATE AND TIME",
  "Lead ID",
  "Source / Form Type",
  "Customer Name",
  "Primary Phone",
  "Secondary Phone",
  "Email Address",
  "Project Location",
  "Material / Catalogue Details",
  "Quantity / Requirement",
  "Stage / Budget",
  "Notes / Details",
  "Status"
];

function doPost(e) {
  try {
    let data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // 1. One-click ID normalization action
    if (data.action === "normalize_ids" || data.action === "normalize") {
      const result = normalizeExistingLeadIds();
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 2. Determine lead category (Material Lead vs Interior Lead)
    const isMaterial = Boolean(
      data.isMaterial === true ||
      (data.source && /material|catalogue|catalog/i.test(data.source)) ||
      (data.targetPrefix && data.targetPrefix.includes("MAT")) ||
      (data.catalogueMaterial && data.catalogueMaterial !== "-") ||
      (data.materialDetails && data.materialDetails !== "-")
    );

    const sheetName = isMaterial ? MATERIALS_SHEET_NAME : LEADS_SHEET_NAME;
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(isMaterial ? MATERIALS_HEADERS : LEADS_HEADERS);
      sheet.setFrozenRows(1);
    }

    // 3. Generate sequential formatted ID (ESP-LEAD-0001 or ESP-MAT-0001)
    const prefix = isMaterial ? "ESP-MAT-" : "ESP-LEAD-";
    const nextLeadId = generateNextId(sheet, prefix);

    // 4. Extract values
    const timestamp = Utilities.formatDate(new Date(), "Asia/Kolkata", "dd/MM/yyyy, hh:mm:ss a");
    const name = data.name || data.fullName || data["Customer Name"] || "Valued Client";
    const phone1 = data.phone1 || data.phone || data.mobile || data["Primary Phone"] || "";
    const phone2 = data.phone2 || data["Secondary Phone"] || "";
    const email = data.email || data["Email Address"] || "";
    const location = data.location || data["Project Location"] || "";
    const source = data.source || data["Source / Form Type"] || (isMaterial ? "Catalog Request" : "Website Form");
    const status = data.status || "NEW";

    let rowValues = [];
    if (isMaterial) {
      const materialDetails = data.materialDetails || data.catalogueMaterial || data["Material / Catalogue Details"] || "-";
      const requirement = data.requirement || data.spaces || data["Quantity / Requirement"] || "-";
      const stage = data.stage || data.timeline || data.budget || data["Stage / Budget"] || "";
      const notes = data.notes || data.message || data["Notes / Details"] || "";

      rowValues = [
        timestamp,
        nextLeadId,
        source,
        name,
        phone1,
        phone2,
        email,
        location,
        materialDetails,
        requirement,
        stage,
        notes,
        status
      ];
    } else {
      const requirement = data.requirement || data.spaces || data.serviceType || data["Requirement / Space"] || "";
      const propertyType = data.propertyType || data["Property Type / Scope"] || "-";
      const stage = data.stage || data.timeline || data.budget || data["Stage / Budget"] || "";
      const notes = data.notes || data.message || data["Notes / Details"] || "";

      rowValues = [
        timestamp,
        nextLeadId,
        source,
        name,
        phone1,
        phone2,
        email,
        location,
        requirement,
        propertyType,
        stage,
        notes,
        status
      ];
    }

    sheet.appendRow(rowValues);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      leadId: nextLeadId,
      sheet: sheetName,
      isMaterial: isMaterial,
      message: `Lead recorded successfully in ${sheetName} with ID ${nextLeadId}`,
      timestamp: timestamp
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : "";
    if (action === "normalize_ids" || action === "normalize") {
      const result = normalizeExistingLeadIds();
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const leadsSheet = ss.getSheetByName(LEADS_SHEET_NAME);
    const matSheet = ss.getSheetByName(MATERIALS_SHEET_NAME);

    return ContentService.createTextOutput(JSON.stringify({
      status: "active",
      message: "ESPACIO Leads Webhook is Live (IDs: ESP-LEAD-XXXX & ESP-MAT-XXXX)",
      spreadsheetName: ss.getName(),
      sheets: {
        leads: {
          name: LEADS_SHEET_NAME,
          exists: Boolean(leadsSheet),
          totalRows: leadsSheet ? Math.max(0, leadsSheet.getLastRow() - 1) : 0
        },
        materialsLeads: {
          name: MATERIALS_SHEET_NAME,
          exists: Boolean(matSheet),
          totalRows: matSheet ? Math.max(0, matSheet.getLastRow() - 1) : 0
        }
      },
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Calculates highest existing numerical sequence and returns next padded ID
 * (e.g. ESP-LEAD-0001, ESP-LEAD-0002... / ESP-MAT-0001, ESP-MAT-0002...)
 */
function generateNextId(sheet, prefix) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return prefix + "0001";
  }

  const idValues = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  let maxSeq = 0;

  for (let i = 0; i < idValues.length; i++) {
    const val = String(idValues[i][0] || "").trim();
    if (!val) continue;

    const match = val.match(/(?:ESP-LEAD-|ESP-MAT-|ESP-|MAT-)(\d+)/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  const nextNum = maxSeq + 1;
  return prefix + Utilities.formatString("%04d", nextNum);
}

/**
 * Utility function to immediately normalize all existing rows:
 * - Leads sheet: ESP-000001 -> ESP-LEAD-0001
 * - Materials sheet: MAT-000001 -> ESP-MAT-0001
 * Can be run directly from Google Apps Script editor or via ?action=normalize URL!
 */
function normalizeExistingLeadIds() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let updatedLeads = 0;
  let updatedMat = 0;

  // 1. Leads Sheet
  const leadsSheet = ss.getSheetByName(LEADS_SHEET_NAME);
  if (leadsSheet && leadsSheet.getLastRow() > 1) {
    const range = leadsSheet.getRange(2, 2, leadsSheet.getLastRow() - 1, 1);
    const values = range.getValues();
    for (let i = 0; i < values.length; i++) {
      const val = String(values[i][0] || "").trim();
      const match = val.match(/(?:ESP-LEAD-|ESP-)(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        const newId = "ESP-LEAD-" + Utilities.formatString("%04d", num);
        if (values[i][0] !== newId) {
          values[i][0] = newId;
          updatedLeads++;
        }
      }
    }
    range.setValues(values);
  }

  // 2. Materials Leads Sheet
  const matSheet = ss.getSheetByName(MATERIALS_SHEET_NAME);
  if (matSheet && matSheet.getLastRow() > 1) {
    const range = matSheet.getRange(2, 2, matSheet.getLastRow() - 1, 1);
    const values = range.getValues();
    for (let i = 0; i < values.length; i++) {
      const val = String(values[i][0] || "").trim();
      const match = val.match(/(?:ESP-MAT-|MAT-)(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        const newId = "ESP-MAT-" + Utilities.formatString("%04d", num);
        if (values[i][0] !== newId) {
          values[i][0] = newId;
          updatedMat++;
        }
      }
    }
    range.setValues(values);
  }

  return {
    success: true,
    updatedLeads: updatedLeads,
    updatedMaterialsLeads: updatedMat,
    message: `Normalized ${updatedLeads} Leads to ESP-LEAD-XXXX and ${updatedMat} Materials Leads to ESP-MAT-XXXX.`
  };
}

/**
 * Quick Test: Create a sample Interior Lead (ESP-LEAD-XXXX)
 * Select "testCreateInteriorLead" in the toolbar dropdown and click "Run"
 */
function testCreateInteriorLead() {
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        name: "Test Customer",
        phone: "9876543210",
        email: "test@example.com",
        location: "Hyderabad",
        source: "Website Consultation",
        requirement: "Full Home Interior"
      })
    }
  };
  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}

/**
 * Quick Test: Create a sample Material Lead (ESP-MAT-XXXX)
 * Select "testCreateMaterialLead" in the toolbar dropdown and click "Run"
 */
function testCreateMaterialLead() {
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        isMaterial: true,
        name: "Material Buyer",
        phone: "9876543211",
        email: "buyer@example.com",
        location: "Hyderabad",
        source: "Catalog Download",
        materialDetails: "Fluted Acrylic Luxe Collection"
      })
    }
  };
  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}

