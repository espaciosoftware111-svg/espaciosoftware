import { NextRequest } from "next/server";
import { QuotationService } from "@/modules/quotations/quotation.service";
import { CompanyService } from "@/modules/settings/company.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Strictly client-facing (redacts internal cost, margins, and internal notes)
    const quote = await QuotationService.getQuotationById(id, undefined, true);
    const company = await CompanyService.getCompanyProfile();

    const clientName = quote.client?.fullName || quote.lead?.clientName || "Valued Client";
    const clientPhone = quote.client?.phone || quote.lead?.phone || "N/A";
    const clientEmail = quote.client?.email || quote.lead?.email || "N/A";
    const clientAddress = quote.client?.address || quote.lead?.location || quote.project?.siteAddress || "N/A";

    const formattedDate = new Date(quote.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const validityDateStr = quote.validityDate
      ? new Date(quote.validityDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "30 Days from Issue Date";

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>QUOTATION - ${quote.referenceNo} - ${clientName}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 40px;
      color: #0f172a;
      background: #ffffff;
      font-size: 13px;
      line-height: 1.5;
    }
    .container { max-width: 900px; margin: 0 auto; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #059669;
      padding-bottom: 20px;
      margin-bottom: 25px;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #047857;
      margin-bottom: 4px;
    }
    .brand-tagline {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
      margin-bottom: 8px;
    }
    .quote-title {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      text-align: right;
      margin-bottom: 4px;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 700;
      border-radius: 4px;
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px 20px;
    }
    .meta-box h4 {
      margin: 0 0 8px 0;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #047857;
    }
    .meta-row {
      display: flex;
      margin-bottom: 4px;
    }
    .meta-label { width: 110px; color: #64748b; font-weight: 500; }
    .meta-value { font-weight: 600; color: #1e293b; }
    
    .room-section { margin-bottom: 25px; }
    .room-header {
      background: #0f172a;
      color: #ffffff;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 700;
      border-radius: 6px 6px 0 0;
      display: flex;
      justify-content: space-between;
    }
    .room-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
      border-top: none;
      margin-bottom: 10px;
    }
    .room-table th {
      background: #f1f5f9;
      color: #475569;
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      padding: 8px 10px;
      text-align: left;
      border-bottom: 1px solid #cbd5e1;
    }
    .room-table td {
      padding: 10px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
      vertical-align: top;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-variant-numeric: tabular-nums; font-family: inherit; }
    
    .totals-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
      margin-bottom: 30px;
    }
    .totals-table {
      width: 380px;
      border-collapse: collapse;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
    }
    .totals-table td {
      padding: 8px 14px;
      border-bottom: 1px solid #e2e8f0;
    }
    .totals-table tr.grand-total {
      background: #047857;
      color: #ffffff;
      font-size: 15px;
      font-weight: 800;
    }
    .totals-table tr.grand-total td {
      padding: 12px 14px;
      border-bottom: none;
    }
    
    .terms-conditions-luxury-card {
      background: #FAF5EB;
      border: 1px solid #DEC6AA;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .terms-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #6A4A2D;
    }
    .terms-header-divider {
      width: 100%;
      height: 1px;
      background: #DEC6AA;
      margin-top: 8px;
      margin-bottom: 10px;
    }
    .terms-rows-container {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }
    .terms-row-item {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 14px;
      align-items: baseline;
      font-size: 11px;
      line-height: 1.35;
    }
    .terms-row-left {
      display: flex;
      align-items: baseline;
      gap: 8px;
      white-space: nowrap;
    }
    .terms-num {
      font-weight: 700;
      color: #C89B3C;
      font-variant-numeric: tabular-nums;
      min-width: 18px;
    }
    .terms-sep {
      color: #DEC6AA;
    }
    .terms-term-name {
      font-weight: 700;
      color: #6A4A2D;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .terms-desc {
      color: #4A3A2C;
    }

    .warranty-support-luxury-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .warranty-luxury-card,
    .support-luxury-card {
      background: #FAF5EB;
      border: 1px solid #DEC6AA;
      border-radius: 8px;
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
    }
    .warranty-card-body {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 11px;
      line-height: 1.35;
      margin-top: 2px;
    }
    .warranty-spec-row {
      display: grid;
      grid-template-columns: 130px 14px 1fr;
      align-items: baseline;
    }
    .warranty-spec-label {
      font-weight: 600;
      color: #3A2818;
    }
    .warranty-spec-colon {
      text-align: center;
      color: #8A7A6C;
    }
    .warranty-spec-value {
      color: #4A3A2C;
    }
    .support-card-body {
      font-size: 11px;
      line-height: 1.35;
      margin-top: 2px;
    }
    .support-subtext {
      margin: 0 0 6px 0;
      color: #6A5A4C;
    }
    .support-contact-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .support-contact-item {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #3A2818;
      font-weight: 600;
      font-size: 11px;
    }

    .important-luxury-card {
      background: #FAF5EB;
      border: 1px solid #DEC6AA;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 24px;
      page-break-inside: avoid;
    }
    .important-bullets-list {
      margin: 0;
      padding-left: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 11px;
      line-height: 1.4;
      color: #4A3A2C;
    }
    
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
    .sig-box {
      border-top: 1px dashed #94a3b8;
      padding-top: 10px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }

    .no-print-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      z-index: 9999;
    }
    .btn-print {
      background: #059669;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-print:hover { background: #047857; }
    
    @page {
      size: A4 portrait;
      margin: 0 !important;
    }
    @media print {
      .no-print-bar { display: none !important; }
      body { padding: 15mm 15mm 15mm 15mm !important; margin: 0 !important; }
      .container { max-width: 100% !important; }
      .room-section { page-break-inside: avoid; }
      .totals-wrapper { page-break-inside: avoid; }
      .signature-grid { page-break-inside: avoid; }
    }
  </style>
</head>
<body style="padding-top: 70px;">
  <div class="no-print-bar">
    <div>
      <strong>ESPACIO Quotation:</strong> ${quote.referenceNo} (Rev ${quote.revision}) &mdash; Total: ₹${quote.totalAmount.toLocaleString("en-IN")}
    </div>
    <div>
      <button class="btn-print" onclick="window.print()">Print / Download PDF</button>
    </div>
  </div>

  <div class="container">
    <div class="header">
      <div>
        <div class="brand-title">${company.companyName}</div>
        <div class="brand-tagline">Architectural & Luxury Interior Solutions</div>
        <div style="color: #475569; font-size: 11px;">
          ${company.addressLine || ""}, ${company.city || ""} ${company.postalCode || ""}<br>
          GSTIN: <strong>${company.gstin || "29ABCDE1234F1ZH"}</strong> | Email: ${company.email || "hello@theespacio.in"}<br>
          Phone: ${company.phone || "+91 98765 43210"}
        </div>
      </div>
      <div>
        <div class="quote-title">COMMERCIAL ESTIMATE</div>
        <div style="text-align: right; margin-bottom: 6px;">
          <span class="badge">${quote.status}</span>
        </div>
        <div style="text-align: right; font-size: 12px; color: #475569;">
          <strong>Quote Ref:</strong> ${quote.referenceNo}<br>
          <strong>Revision:</strong> Version ${quote.revision}<br>
          <strong>Issue Date:</strong> ${formattedDate}
        </div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <h4>To</h4>
        <div class="meta-row"><span class="meta-label">To:</span><span class="meta-value">${clientName}</span></div>
        <div class="meta-row"><span class="meta-label">Phone:</span><span class="meta-value">${clientPhone}</span></div>
        <div class="meta-row"><span class="meta-label">Email:</span><span class="meta-value">${clientEmail}</span></div>
        <div class="meta-row"><span class="meta-label">Location:</span><span class="meta-value">${clientAddress}</span></div>
      </div>
      <div class="meta-box">
        <h4>Project Details</h4>
        <div class="meta-row"><span class="meta-label">Quotation Title:</span><span class="meta-value">${quote.title}</span></div>
        ${
          quote.project
            ? `<div class="meta-row"><span class="meta-label">Project Ref:</span><span class="meta-value">${quote.project.referenceNo} (${quote.project.title})</span></div>`
            : quote.lead
            ? `<div class="meta-row"><span class="meta-label">Lead Ref:</span><span class="meta-value">${quote.lead.referenceNo}</span></div>`
            : ""
        }
        <div class="meta-row"><span class="meta-label">Prepared By:</span><span class="meta-value">${quote.createdBy?.fullName || "ESPACIO Design Team"}</span></div>
      </div>
    </div>

    <!-- Room-wise BOQ Tables -->
    ${quote.roomGroups
      .map(
        (group, gIdx) => `
      <div class="room-section">
        <div class="room-header">
          <span>${gIdx + 1}. ${group.room.toUpperCase()}</span>
          <span class="font-mono">Subtotal: ₹${group.subtotal.toLocaleString("en-IN")}</span>
        </div>
        <table class="room-table">
          <thead>
            <tr>
              <th style="width: 30px;">#</th>
              <th>Description & Specifications</th>
              <th style="width: 100px;">Trade</th>
              <th style="width: 75px;" class="text-center">Qty / Area</th>
              <th style="width: 60px;" class="text-center">Unit</th>
              <th style="width: 85px;" class="text-right">Rate (₹)</th>
              <th style="width: 75px;" class="text-right">Disc (₹)</th>
              <th style="width: 95px;" class="text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${group.items
              .map(
                (item, idx) => `
              <tr>
                <td class="text-center" style="color: #64748b;">${idx + 1}</td>
                <td>
                  <strong>${item.itemDescription}</strong>
                  ${item.specifications ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${item.specifications}</div>` : ""}
                  ${item.length && item.height ? `<div style="font-size: 10px; color: #047857; margin-top: 2px;">Dim: ${item.length} ft × ${item.height} ft</div>` : ""}
                </td>
                <td style="font-size: 11px; color: #475569;">${item.category}</td>
                <td class="text-center font-mono">${item.quantity}</td>
                <td class="text-center" style="font-size: 11px;">${item.unitKey}</td>
                <td class="text-right font-mono">${item.unitRate.toLocaleString("en-IN")}</td>
                <td class="text-right font-mono" style="color: ${item.discountAmount > 0 ? "#dc2626" : "#64748b"};">
                  ${item.discountAmount > 0 ? `-${item.discountAmount.toLocaleString("en-IN")}` : "0"}
                </td>
                <td class="text-right font-mono" style="font-weight: 700;">
                  ₹${item.totalAmount.toLocaleString("en-IN")}
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `
      )
      .join("")}

    <!-- Financial Totals Summary -->
    <div class="totals-wrapper">
      <table class="totals-table">
        <tr>
          <td style="color: #475569;">BOQ Gross Subtotal:</td>
          <td class="text-right font-mono">₹${quote.subtotal.toLocaleString("en-IN")}</td>
        </tr>
        ${
          quote.discountAmount > 0
            ? `
          <tr>
            <td style="color: #dc2626;">Quotation Discount ${quote.discountType === "PERCENTAGE" ? `(${quote.discountValue}%)` : ""}:</td>
            <td class="text-right font-mono" style="color: #dc2626; font-weight: 600;">-₹${quote.discountAmount.toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="font-weight: 600;">Taxable Amount:</td>
            <td class="text-right font-mono" style="font-weight: 600;">₹${Math.max(0, quote.subtotal - quote.discountAmount).toLocaleString("en-IN")}</td>
          </tr>`
            : ""
        }
        ${
          quote.taxAmount > 0
            ? `
          <tr>
            <td style="color: #475569;">GST (${quote.taxRate}%):</td>
            <td class="text-right font-mono">₹${quote.taxAmount.toLocaleString("en-IN")}</td>
          </tr>`
            : ""
        }
        ${
          quote.adjustmentAmount !== 0
            ? `
          <tr>
            <td style="color: #475569;">Commercial Adjustment ${quote.adjustmentReason ? `(${quote.adjustmentReason})` : ""}:</td>
            <td class="text-right font-mono">${quote.adjustmentAmount > 0 ? "+" : ""}₹${quote.adjustmentAmount.toLocaleString("en-IN")}</td>
          </tr>`
            : ""
        }
        <tr class="grand-total">
          <td>Grand Total:</td>
          <td class="text-right font-mono">₹${quote.totalAmount.toLocaleString("en-IN")}</td>
        </tr>
      </table>
    </div>

    <!-- 1. Standard Terms & Conditions Luxury Container -->
    <div class="terms-conditions-luxury-card">
      <div class="terms-card-header">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6A4A2D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
        <span>STANDARD TERMS & CONDITIONS</span>
      </div>
      <div class="terms-header-divider"></div>
      <div class="terms-rows-container">
        <div class="terms-row-item">
          <div class="terms-row-left">
            <span class="terms-num">01</span>
            <span class="terms-sep">|</span>
            <span class="terms-term-name">VALIDITY</span>
          </div>
          <div class="terms-row-right">
            <span class="terms-desc">Quotation is valid until the mentioned Valid Till date.</span>
          </div>
        </div>
        <div class="terms-row-item">
          <div class="terms-row-left">
            <span class="terms-num">02</span>
            <span class="terms-sep">|</span>
            <span class="terms-term-name">SCOPE</span>
          </div>
          <div class="terms-row-right">
            <span class="terms-desc">Only the items and specifications mentioned in the quotation are included.</span>
          </div>
        </div>
        <div class="terms-row-item">
          <div class="terms-row-left">
            <span class="terms-num">03</span>
            <span class="terms-sep">|</span>
            <span class="terms-term-name">CHANGES & ADDITIONAL WORK</span>
          </div>
          <div class="terms-row-right">
            <span class="terms-desc">Any additions, alterations or changes requested after quotation approval will be charged separately.</span>
          </div>
        </div>
        <div class="terms-row-item">
          <div class="terms-row-left">
            <span class="terms-num">04</span>
            <span class="terms-sep">|</span>
            <span class="terms-term-name">PAYMENT</span>
          </div>
          <div class="terms-row-right">
            <span class="terms-desc">Payments are to be made according to the agreed milestone schedule.</span>
          </div>
        </div>
        <div class="terms-row-item">
          <div class="terms-row-left">
            <span class="terms-num">05</span>
            <span class="terms-sep">|</span>
            <span class="terms-term-name">TIMELINE</span>
          </div>
          <div class="terms-row-right">
            <span class="terms-desc">Estimated timelines may vary depending on approvals, payments, material availability and site-related conditions.</span>
          </div>
        </div>
        <div class="terms-row-item">
          <div class="terms-row-left">
            <span class="terms-num">06</span>
            <span class="terms-sep">|</span>
            <span class="terms-term-name">FINAL SPECIFICATIONS</span>
          </div>
          <div class="terms-row-right">
            <span class="terms-desc">Final measurements, material specifications, hardware selections and quantities will be confirmed before production.</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Warranty Coverage & Post-Project Support Cards -->
    <div class="warranty-support-luxury-row">
      <div class="warranty-luxury-card">
        <div class="terms-card-header">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6A4A2D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
          <span>WARRANTY COVERAGE</span>
        </div>
        <div class="terms-header-divider"></div>
        <div class="warranty-card-body">
          <div class="warranty-spec-row">
            <span class="warranty-spec-label">Structural Warranty</span>
            <span class="warranty-spec-colon">:</span>
            <span class="warranty-spec-value">5 Years</span>
          </div>
          <div class="warranty-spec-row">
            <span class="warranty-spec-label">Hardware Warranty</span>
            <span class="warranty-spec-colon">:</span>
            <span class="warranty-spec-value">As per applicable manufacturer / Espacio warranty terms</span>
          </div>
        </div>
      </div>

      <div class="support-luxury-card">
        <div class="terms-card-header">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6A4A2D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"></path></svg>
          <span>POST-PROJECT SUPPORT</span>
        </div>
        <div class="terms-header-divider"></div>
        <div class="support-card-body">
          <p class="support-subtext">For service and support after project completion:</p>
          <div class="support-contact-list">
            <div class="support-contact-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6A4A2D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
              <span>${company.email || "support@theespacio.in"}</span>
            </div>
            <div class="support-contact-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6A4A2D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              <span>${company.phone || "+91 90000 80000"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Important Luxury Card -->
    <div class="important-luxury-card">
      <div class="terms-card-header">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6A4A2D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>
        <span>IMPORTANT</span>
      </div>
      <div class="terms-header-divider"></div>
      <div class="important-card-body">
        <ul class="important-bullets-list">
          <li>Final production will commence only after design, measurements, materials, finishes and quotation details are confirmed.</li>
          <li>Any additional work outside the approved quotation will be separately quoted and approved before execution.</li>
        </ul>
      </div>
    </div>

    <!-- Signatures -->
    <div class="signature-grid">
      <div>
        <div style="height: 50px;"></div>
        <div class="sig-box">
          <strong>Authorized Signatory</strong><br>
          For ${company.companyName}
        </div>
      </div>
      <div>
        <div style="height: 50px;"></div>
        <div class="sig-box">
          <strong>Client Acceptance & Sign-off</strong><br>
          ${clientName}
        </div>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    return new Response(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (err: any) {
    return new Response(err.message || "Failed to generate Quotation document", {
      status: err.statusCode || 500,
    });
  }
}
