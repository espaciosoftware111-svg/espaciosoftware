/**
 * PDF Generator — Server-Side Print-Ready HTML Templates
 *
 * Generates professional, print-ready HTML documents styled for
 * ESPACIO ERP branding. These are served as downloadable HTML files
 * that users open in the browser and print → Save as PDF.
 */

export interface PdfTemplateOptions {
  reportName: string;
  reportKey: string;
  category: string;
  period: string;
  generatedBy: string;
  generatedAt?: string;
  columns: Array<{ key: string; label: string; type?: string }>;
  rows: Array<Record<string, unknown>>;
  summaryStats?: Record<string, { label: string; value: string }>;
  scope?: string;
}

function formatValue(val: unknown, type?: string): string {
  if (val === null || val === undefined || val === "") return "—";
  if (type === "currency") {
    const num = Number(val);
    if (isNaN(num)) return String(val);
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(num);
  }
  if (type === "number") {
    const num = Number(val);
    if (isNaN(num)) return String(val);
    return num.toLocaleString("en-IN");
  }
  return String(val);
}

function computeSummaryStats(
  columns: Array<{ key: string; label: string; type?: string }>,
  rows: Array<Record<string, unknown>>
): Record<string, { label: string; value: string }> {
  const stats: Record<string, { label: string; value: string }> = {};

  // Total row count
  stats.totalRows = { label: "Total Records", value: rows.length.toLocaleString("en-IN") };

  // Sum all currency columns
  for (const col of columns) {
    if (col.type === "currency") {
      const total = rows.reduce((sum, row) => {
        const v = Number(row[col.key]);
        return sum + (isNaN(v) ? 0 : v);
      }, 0);
      stats[`sum_${col.key}`] = {
        label: `Total ${col.label}`,
        value: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(total),
      };
    }
  }

  return stats;
}

export function generatePdfHtml(opts: PdfTemplateOptions): string {
  const generatedAt = opts.generatedAt || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const stats = opts.summaryStats || computeSummaryStats(opts.columns, opts.rows);

  const tableHeaders = opts.columns
    .map((col) => `<th class="${col.type === "currency" || col.type === "number" ? "right" : ""}">${escapeHtml(col.label)}</th>`)
    .join("");

  const tableRows = opts.rows
    .map((row, idx) => {
      const cells = opts.columns
        .map((col) => {
          const isRight = col.type === "currency" || col.type === "number";
          const val = formatValue(row[col.key], col.type);
          return `<td class="${isRight ? "right" : ""}${col.type === "currency" ? " mono" : ""}">${escapeHtml(val)}</td>`;
        })
        .join("");
      return `<tr class="${idx % 2 === 0 ? "even" : "odd"}">${cells}</tr>`;
    })
    .join("");

  const summaryCards = Object.values(stats)
    .map(
      (s) => `
    <div class="stat-card">
      <div class="stat-label">${escapeHtml(s.label)}</div>
      <div class="stat-value">${escapeHtml(s.value)}</div>
    </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(opts.reportName)} — ESPACIO ERP</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 1.5cm 1.8cm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 9pt;
      color: #111827;
      background: #fff;
      line-height: 1.4;
    }

    /* ─── HEADER ─────────────────────────────── */
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-bottom: 2.5px solid #10B981;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .company-block {}
    .company-name {
      font-size: 18pt;
      font-weight: 800;
      color: #10B981;
      letter-spacing: -0.5px;
    }
    .company-tagline {
      font-size: 7pt;
      color: #64748B;
      margin-top: 2px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .report-meta {
      text-align: right;
      font-size: 7.5pt;
      color: #374151;
    }
    .report-meta .report-name {
      font-size: 11pt;
      font-weight: 700;
      color: #111827;
      margin-bottom: 3px;
    }
    .report-meta .meta-line {
      margin-top: 2px;
      color: #6B7280;
    }
    .report-meta .period-badge {
      display: inline-block;
      background: #F0FDF4;
      border: 1px solid #86EFAC;
      color: #15803D;
      font-size: 7pt;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 10px;
      margin-top: 4px;
    }

    /* ─── SUMMARY CARDS ──────────────────────── */
    .summary-section {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 14px;
    }
    .stat-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 8px 14px;
      min-width: 140px;
    }
    .stat-label {
      font-size: 6.5pt;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      font-weight: 600;
      margin-bottom: 3px;
    }
    .stat-value {
      font-size: 11pt;
      font-weight: 700;
      color: #111827;
      font-variant-numeric: tabular-nums;
    }

    /* ─── TABLE ──────────────────────────────── */
    .table-section {
      margin-top: 6px;
    }
    .table-title {
      font-size: 8.5pt;
      font-weight: 700;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
      border-left: 3px solid #10B981;
      padding-left: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.5pt;
    }
    thead th {
      background: #F1F5F9;
      color: #374151;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      padding: 6px 8px;
      border-bottom: 1.5px solid #CBD5E1;
      text-align: left;
      white-space: nowrap;
    }
    thead th.right { text-align: right; }
    tbody td {
      padding: 5px 8px;
      border-bottom: 0.5px solid #F1F5F9;
      color: #1E293B;
      vertical-align: top;
      word-break: break-word;
    }
    tbody td.right { text-align: right; }
    tbody td.mono { font-variant-numeric: tabular-nums; }
    tbody tr.even td { background: #FAFAFA; }
    tbody tr.odd td { background: #FFFFFF; }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr:hover td { background: #F0FDF4; }

    /* ─── FOOTER ─────────────────────────────── */
    .footer {
      margin-top: 20px;
      padding-top: 8px;
      border-top: 1px solid #E2E8F0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 6.5pt;
      color: #94A3B8;
    }
    .footer .confidential {
      font-weight: 600;
      color: #EF4444;
      font-size: 6pt;
      text-transform: uppercase;
    }

    /* ─── PRINT CONTROLS ─────────────────────── */
    .print-controls {
      position: fixed;
      top: 0;
      right: 0;
      background: #111827;
      color: white;
      padding: 10px 18px;
      display: flex;
      gap: 10px;
      align-items: center;
      z-index: 9999;
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 12px;
      border-bottom-left-radius: 8px;
    }
    .print-controls button {
      background: #10B981;
      color: white;
      border: none;
      padding: 6px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .print-controls button:hover { background: #059669; }
    .print-controls .close-btn {
      background: #374151;
      font-size: 11px;
    }
    @media print {
      .print-controls { display: none !important; }
    }
  </style>
</head>
<body>

  <!-- Print Controls (hidden when printing) -->
  <div class="print-controls">
    <span>📄 ESPACIO Report</span>
    <button onclick="window.print()">🖨️ Print / Save as PDF</button>
    <button class="close-btn" onclick="window.close()">✕ Close</button>
  </div>

  <!-- Report Header -->
  <div class="header">
    <div class="company-block">
      <div class="company-name">ESPACIO</div>
      <div class="company-tagline">Interior Design & Project Management ERP</div>
    </div>
    <div class="report-meta">
      <div class="report-name">${escapeHtml(opts.reportName)}</div>
      <div class="meta-line">Category: <strong>${escapeHtml(opts.category)}</strong></div>
      <div class="meta-line">Generated By: <strong>${escapeHtml(opts.generatedBy)}</strong></div>
      <div class="meta-line">Generated At: ${escapeHtml(generatedAt)} IST</div>
      ${opts.scope ? `<div class="meta-line">Scope: <strong>${escapeHtml(opts.scope)}</strong></div>` : ""}
      <div class="period-badge">Period: ${escapeHtml(opts.period)}</div>
    </div>
  </div>

  <!-- Summary Statistics -->
  ${Object.keys(stats).length > 0 ? `
  <div class="summary-section">
    ${summaryCards}
  </div>` : ""}

  <!-- Data Table -->
  <div class="table-section">
    <div class="table-title">Report Data — ${escapeHtml(opts.reportName)}</div>
    ${
      opts.rows.length === 0
        ? `<div style="text-align:center;padding:30px;color:#94A3B8;font-style:italic;">No data available for the selected period and filters.</div>`
        : `<table>
      <thead>
        <tr>${tableHeaders}</tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>`
    }
  </div>

  <!-- Footer -->
  <div class="footer">
    <div>
      <strong>ESPACIO ERP</strong> — Confidential Business Report<br />
      Report: ${escapeHtml(opts.reportName)} &bull; Period: ${escapeHtml(opts.period)} &bull; Records: ${opts.rows.length.toLocaleString("en-IN")}
    </div>
    <div class="confidential">
      ⚠ CONFIDENTIAL — Internal Use Only
    </div>
    <div>
      Generated: ${escapeHtml(generatedAt)}<br />
      ESPACIO ERP &copy; ${new Date().getFullYear()}
    </div>
  </div>

</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
