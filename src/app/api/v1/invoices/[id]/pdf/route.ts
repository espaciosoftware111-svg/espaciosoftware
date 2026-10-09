import { NextRequest } from "next/server";
import { GstInvoiceService } from "@/modules/finance/gst-invoice.service";
import { CompanyService } from "@/modules/settings/company.service";
import { amountToWords } from "@/components/quotations/quotation-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoice = await GstInvoiceService.getInvoiceById(id);
    const company = await CompanyService.getCompanyProfile();

    const clientName = invoice.customerName || invoice.client?.fullName || "Valued Client";
    const clientPhone = invoice.client?.phone || "N/A";
    const clientEmail = invoice.client?.email || "N/A";
    const clientAddress = invoice.customerAddress || invoice.client?.address || invoice.project?.siteAddress || "N/A";
    const clientGstin = invoice.customerGstin || invoice.client?.gstin || "URP (Unregistered)";

    const formattedDate = new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const quoteRef = invoice.quotation?.referenceNo || "Direct Commercial Account";
    const quoteTotal = invoice.quotation?.totalAmount || invoice.project?.contractValue || invoice.grandTotal;

    let parsedSnapshot: any = {};
    try {
      if (invoice.quotation?.clientSnapshot) {
        parsedSnapshot = JSON.parse(invoice.quotation.clientSnapshot);
      }
    } catch {
      parsedSnapshot = {};
    }

    // Financial payment calculations
    const currentPayment = invoice.paidAmount || invoice.grandTotal || 0;
    const previousPaid = Number(parsedSnapshot.previousPayments || 0);
    const totalPaid = previousPaid + currentPayment;
    const remainingBalance = Math.max(0, quoteTotal - totalPaid);
    const amountInWordsStr = amountToWords(currentPayment);

    // Payment details
    const firstPayment = invoice.payments?.[0];
    const paymentMode = firstPayment?.paymentMethod || "BANK_TRANSFER";
    const transactionRef = firstPayment?.referenceNoExt || firstPayment?.referenceNo || "";
    const rawNote = invoice.notes?.split('|')?.[0]?.trim() || "";
    const paymentTypeLabel = rawNote || "Booking Confirmation Fee / Stage Installment";

    // Clean single-page invoice items
    const isStageOrQuotationInvoice = Boolean(invoice.quotationId || invoice.projectId || invoice.notes);
    
    const displayItems = (!isStageOrQuotationInvoice && invoice.items && invoice.items.length > 0 && invoice.items.length <= 5)
      ? invoice.items.map((it: any, idx: number) => ({
          slNo: idx + 1,
          description: it.description,
          details: "",
          hsnSac: it.hsnSacCode || "995476",
          quantity: it.quantity || 1,
          unit: it.unitKey || "NOS",
          rate: it.unitRate || it.amount || currentPayment,
          tax: (it.cgstAmount || 0) + (it.sgstAmount || 0) + (it.igstAmount || 0),
          total: it.totalAmount || currentPayment,
        }))
      : [
          {
            slNo: 1,
            description: `Interior & Architectural Fitout Services — ${paymentTypeLabel}`,
            details: `Commercial billing & receipt against Approved Quotation ${quoteRef} | Project: ${invoice.project?.title || "Interiors Fitout"}`,
            hsnSac: "995476",
            quantity: 1,
            unit: "LOT",
            rate: invoice.taxableAmount > 0 ? invoice.taxableAmount : currentPayment,
            tax: invoice.totalTax || 0,
            total: currentPayment,
          },
        ];

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>TAX INVOICE - ${invoice.invoiceNo} - ${clientName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400;1,600&family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 36px 44px;
      color: #1A1612;
      background: #FFFFFF;
      font-size: 12px;
      line-height: 1.45;
    }
    .container { max-width: 880px; margin: 0 auto; }
    
    /* Top Luxury Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2.5px solid #C89B3C;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .brand-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.3px;
      color: #1A1612;
      margin-bottom: 2px;
    }
    .brand-title span {
      color: #6A4A2D;
    }
    .brand-tagline {
      font-family: 'Outfit', sans-serif;
      font-size: 10px;
      color: #C89B3C;
      font-weight: 700;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .company-details {
      color: #6A5644;
      font-size: 10.5px;
      line-height: 1.4;
    }
    .invoice-header-right {
      text-align: right;
    }
    .invoice-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #1A1612;
      margin-bottom: 4px;
    }
    .badge {
      display: inline-block;
      padding: 3px 10px;
      font-family: 'Outfit', sans-serif;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.5px;
      border-radius: 4px;
      background: #FAF5EB;
      color: #6A4A2D;
      border: 1px solid #DEC6AA;
      margin-bottom: 6px;
    }
    .invoice-meta {
      font-size: 11px;
      color: #6A5644;
      line-height: 1.45;
    }
    .invoice-meta strong {
      color: #1A1612;
    }

    /* Metadata 2-Column Luxury Cards */
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 18px;
    }
    .meta-box {
      background: #FAF5EB;
      border: 1px solid #DEC6AA;
      border-radius: 8px;
      padding: 12px 16px;
    }
    .meta-box h4 {
      margin: 0 0 8px 0;
      font-family: 'Outfit', sans-serif;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #6A4A2D;
      font-weight: 800;
      border-bottom: 1px solid #DEC6AA;
      padding-bottom: 5px;
    }
    .meta-row {
      display: flex;
      margin-bottom: 3px;
      font-size: 11.5px;
    }
    .meta-label { width: 115px; color: #7A7064; font-weight: 500; }
    .meta-value { font-weight: 600; color: #1A1612; flex: 1; }

    /* Single page table */
    table.invoice-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #DEC6AA;
      margin-bottom: 18px;
      border-radius: 6px;
      overflow: hidden;
    }
    table.invoice-table th {
      background: #1A1612;
      color: #FFFFFF;
      font-family: 'Outfit', sans-serif;
      font-size: 10.5px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.6px;
      padding: 8px 12px;
      text-align: left;
      border-bottom: 2px solid #C89B3C;
    }
    table.invoice-table td {
      padding: 9px 12px;
      border-bottom: 1px solid #EAE4D9;
      font-size: 11.5px;
      vertical-align: middle;
      color: #1A1612;
    }
    table.invoice-table tbody tr:nth-child(even) {
      background: #FAF8F5;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-variant-numeric: tabular-nums; font-family: inherit; }

    /* Summary & Bank Details 2-Column Grid */
    .summary-grid {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 16px;
      margin-bottom: 18px;
    }
    .info-card {
      border: 1px solid #DEC6AA;
      border-radius: 8px;
      padding: 12px 16px;
      background: #FAF5EB;
      font-size: 11px;
    }
    .info-card h4 {
      margin: 0 0 6px 0;
      font-family: 'Outfit', sans-serif;
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 800;
      color: #6A4A2D;
      letter-spacing: 0.8px;
      border-bottom: 1px solid #DEC6AA;
      padding-bottom: 4px;
    }
    .info-card p {
      margin: 3px 0;
      color: #6A5644;
    }
    .info-card p strong {
      color: #1A1612;
    }

    .totals-table {
      width: 100%;
      border-collapse: collapse;
      background: #FFFFFF;
      border: 1px solid #DEC6AA;
      border-radius: 8px;
      overflow: hidden;
    }
    .totals-table td {
      padding: 6.5px 12px;
      border-bottom: 1px solid #EAE4D9;
      font-size: 11.5px;
    }
    .totals-table tr.highlight-total td {
      background: #FAF5EB;
      font-weight: 800;
      color: #6A4A2D;
      font-size: 12.5px;
      border-top: 1.5px solid #C89B3C;
      border-bottom: 1.5px solid #C89B3C;
    }

    .terms-box {
      border: 1px solid #DEC6AA;
      border-radius: 8px;
      padding: 10px 14px;
      background: #FAF5EB;
      margin-bottom: 18px;
      font-size: 10.5px;
      color: #6A5644;
      line-height: 1.45;
    }
    .terms-box strong {
      color: #6A4A2D;
    }

    /* Dual Signature Section */
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1px solid #DEC6AA;
    }
    .sig-box {
      border-top: 1px dashed #DEC6AA;
      padding-top: 8px;
      text-align: center;
      font-size: 11px;
      color: #7A7064;
    }
    .sig-box strong {
      color: #1A1612;
      font-size: 11.5px;
    }

    /* Screen Action Bar (hidden when printing) */
    .no-print-bar {
      background: #1A1612;
      color: #FFFFFF;
      padding: 10px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 999;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
      font-family: 'Outfit', sans-serif;
    }
    .btn-print {
      background: #C89B3C;
      color: #FFFFFF;
      border: none;
      padding: 7px 18px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      letter-spacing: 0.4px;
      transition: background 0.2s ease;
    }
    .btn-print:hover {
      background: #B2862E;
    }

    @media print {
      body { padding: 0 !important; }
      .no-print-bar { display: none !important; }
      .container { width: 100% !important; max-width: 100% !important; }
      @page { margin: 12mm; }
      .signature-grid { page-break-inside: avoid; }
    }

    .watermark-bg {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 480px;
      max-width: 75%;
      opacity: 0.04;
      pointer-events: none;
      z-index: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: grayscale(20%);
    }
  </style>
</head>
<body style="padding-top: 55px;">
  <div class="watermark-bg">
    <img src="/espacio-logo.png" alt="" style="width: 100%; height: auto; max-height: 400px; object-fit: contain;" />
  </div>

  <!-- Screen Navigation Bar -->
  <div class="no-print-bar">
    <div>
      <strong style="color: #C89B3C;">ESPACIO Tax Invoice:</strong> ${invoice.invoiceNo} &mdash; Invoiced Amount: ₹${currentPayment.toLocaleString("en-IN")}
    </div>
    <div>
      <button class="btn-print" onclick="window.print()">Print / Download PDF</button>
    </div>
  </div>

  <div class="container" style="position: relative; z-index: 1;">
    <!-- Header Matching Quotation Luxury Design -->
    <div class="header">
      <div>
        <div class="brand-title">${company.companyName || "ESPACIO"} <span>INTERIORS</span></div>
        <div class="brand-tagline">Architectural &amp; Luxury Interior Solutions</div>
        <div class="company-details">
          ${company.addressLine || "Road No. 36, Jubilee Hills"}, ${company.city || "Hyderabad"} ${company.postalCode || ""}<br>
          GSTIN: <strong>${company.gstin || "36AAAAE1234F1Z9"}</strong> | Phone: ${company.phone || "+91 90000 80000"} | Email: ${company.email || "hello@theespacio.in"}
        </div>
      </div>
      <div class="invoice-header-right">
        <div class="invoice-title">TAX INVOICE</div>
        <div>
          <span class="badge">${invoice.status === "PAID" ? "OFFICIAL RECEIPT • PAID" : invoice.status}</span>
        </div>
        <div class="invoice-meta">
          <strong>Invoice No:</strong> <span class="font-mono" style="font-weight: 700; color: #6A4A2D;">${invoice.invoiceNo}</span><br>
          <strong>Invoice Date:</strong> ${formattedDate}<br>
          <strong>Quotation Ref:</strong> ${quoteRef}
        </div>
      </div>
    </div>

    <!-- Client & Project Metadata Grid -->
    <div class="meta-grid">
      <div class="meta-box">
        <h4>Billed To (Client)</h4>
        <div class="meta-row"><span class="meta-label">Client Name:</span><span class="meta-value">${clientName}</span></div>
        <div class="meta-row"><span class="meta-label">Phone:</span><span class="meta-value">${clientPhone}</span></div>
        <div class="meta-row"><span class="meta-label">Email:</span><span class="meta-value">${clientEmail}</span></div>
        <div class="meta-row"><span class="meta-label">Site / Address:</span><span class="meta-value">${clientAddress}</span></div>
        <div class="meta-row"><span class="meta-label">GSTIN / Status:</span><span class="meta-value">${clientGstin}</span></div>
      </div>
      <div class="meta-box">
        <h4>Invoice &amp; Transaction Details</h4>
        <div class="meta-row"><span class="meta-label">Project:</span><span class="meta-value">${invoice.project?.title || "Residential Interiors"}</span></div>
        <div class="meta-row"><span class="meta-label">Billing Purpose:</span><span class="meta-value" style="color: #6A4A2D; font-weight: 700;">${paymentTypeLabel}</span></div>
        <div class="meta-row"><span class="meta-label">Payment Mode:</span><span class="meta-value">${paymentMode}</span></div>
        ${transactionRef ? `<div class="meta-row"><span class="meta-label">Transaction Ref:</span><span class="meta-value font-mono">${transactionRef}</span></div>` : ""}
        <div class="meta-row"><span class="meta-label">Payment Status:</span><span class="meta-value" style="color: #2E7D32;">✓ VERIFIED &amp; REALIZED</span></div>
      </div>
    </div>

    <!-- Single Page Billing Items Table -->
    <table class="invoice-table">
      <thead>
        <tr>
          <th style="width: 35px;" class="text-center">#</th>
          <th>Description of Services &amp; Milestones</th>
          <th style="width: 90px;" class="text-center">HSN/SAC</th>
          <th style="width: 65px;" class="text-center">Qty</th>
          <th style="width: 60px;" class="text-center">Unit</th>
          <th style="width: 110px;" class="text-right">Rate (₹)</th>
          <th style="width: 120px;" class="text-right">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${displayItems.map((item) => `
          <tr>
            <td class="text-center font-mono" style="color: #7A7064;">${item.slNo}</td>
            <td>
              <strong>${item.description}</strong>
              ${item.details ? `<div style="font-size: 10.5px; color: #7A7064; margin-top: 2px;">${item.details}</div>` : ""}
            </td>
            <td class="text-center font-mono">${item.hsnSac}</td>
            <td class="text-center font-mono">${item.quantity}</td>
            <td class="text-center">${item.unit}</td>
            <td class="text-right font-mono">${Number(item.rate).toLocaleString("en-IN")}</td>
            <td class="text-right font-mono" style="font-weight: 700; color: #1A1612;">₹${Number(item.total).toLocaleString("en-IN")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <!-- Commercial Financial Totals & Banking Information -->
    <div class="summary-grid">
      <div class="info-card">
        <h4>Official Banking &amp; Remittance Details</h4>
        <p>Bank: <strong>HDFC Bank Ltd</strong> &bull; Jubilee Hills Branch</p>
        <p>Account Name: <strong>ESPACIO INTERIORS PRIVATE LIMITED</strong></p>
        <p>Current A/C No: <strong class="font-mono">50200088991122</strong> &bull; IFSC: <strong class="font-mono">HDFC0001234</strong></p>
        <p>UPI ID: <strong class="font-mono">espaciointeriors@hdfcbank</strong></p>
        <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #DEC6AA; font-size: 10.5px; color: #6A5644;">
          <strong>Amount in Words:</strong> <em>${amountInWordsStr}</em>
        </div>
      </div>

      <div>
        <table class="totals-table">
          <tr>
            <td style="color: #7A7064;">Total Approved Contract Value:</td>
            <td class="text-right font-mono">₹${quoteTotal.toLocaleString("en-IN")}</td>
          </tr>
          ${previousPaid > 0 ? `
          <tr>
            <td style="color: #6A4A2D;">Less: Previously Realized Payments:</td>
            <td class="text-right font-mono" style="color: #6A4A2D;">-₹${previousPaid.toLocaleString("en-IN")}</td>
          </tr>
          ` : ""}
          <tr class="highlight-total">
            <td>CURRENT INVOICED AMOUNT:</td>
            <td class="text-right font-mono">₹${currentPayment.toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="color: #1A1612; font-weight: 700;">Remaining Balance Due:</td>
            <td class="text-right font-mono" style="font-weight: 700; color: #6A4A2D;">₹${remainingBalance.toLocaleString("en-IN")}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Terms and Conditions -->
    <div class="terms-box">
      <strong>Terms &amp; Conditions:</strong> 1. This is an official computer-generated Tax Invoice and payment realization receipt. 2. All modular woodwork, fittings, and site execution work are governed by the parent Master Service Agreement. 3. Payments made via NEFT/RTGS/Cheque are subject to bank clearance.
    </div>

    <!-- Signatures Section -->
    <div class="signature-grid">
      <div>
        <div style="height: 35px;"></div>
        <div class="sig-box">
          <strong>Authorized Signatory</strong><br>
          For ${company.companyName || "ESPACIO LUXURY INTERIORS"}
        </div>
      </div>
      <div>
        <div style="height: 35px;"></div>
        <div class="sig-box">
          <strong>Client Acceptance &amp; Sign-off</strong><br>
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
    return new Response(err.message || "Failed to generate Invoice PDF", { status: 500 });
  }
}
