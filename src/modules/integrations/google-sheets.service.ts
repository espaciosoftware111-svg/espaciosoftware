import https from "https";
import { db } from "@/lib/db";
import { IdGeneratorService } from "@/lib/id-generator";
import { AuditService } from "@/modules/audit/audit.service";
import { ActivityService } from "@/modules/activity/activity.service";
import { NotificationEngine } from "@/modules/notifications/notification-engine";
import { serverCache } from "@/lib/server-cache";
import { SettingsService } from "@/modules/settings/settings.service";
import { logger } from "@/lib/logger";

export interface GoogleSheetsSyncConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  leadsGid: string;
  leadsTabName: string;
  materialsGid: string;
  materialsTabName: string;
  enabled: boolean;
  autoSyncIntervalMinutes: number;
  lastSyncAt: string | null;
  lastSyncStatus: "SUCCESS" | "ERROR" | "IDLE";
  lastSyncResult?: {
    leadsImported: number;
    materialLeadsImported: number;
    leadsSkipped: number;
    materialLeadsSkipped: number;
    timestamp: string;
  } | null;
}

export const DEFAULT_SHEETS_CONFIG: GoogleSheetsSyncConfig = {
  spreadsheetId: "1JF4G9WIcdz4V0YSHbgyUHHS8lU6K_hx-nghmbArBB1U",
  spreadsheetUrl: "https://docs.google.com/spreadsheets/d/1JF4G9WIcdz4V0YSHbgyUHHS8lU6K_hx-nghmbArBB1U/edit?usp=sharing",
  leadsGid: "1711356666",
  leadsTabName: "Leads",
  materialsGid: "756206571",
  materialsTabName: "Materials Leads",
  enabled: true,
  autoSyncIntervalMinutes: 5,
  lastSyncAt: null,
  lastSyncStatus: "IDLE",
  lastSyncResult: null,
};

export class GoogleSheetsSyncService {
  /**
   * Fetch current configuration from database Settings (or fallback to defaults)
   */
  public static async getConfig(): Promise<GoogleSheetsSyncConfig> {
    const raw = await SettingsService.get("integrations.google_sheets_sync", "");
    if (!raw) return DEFAULT_SHEETS_CONFIG;
    try {
      return { ...DEFAULT_SHEETS_CONFIG, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SHEETS_CONFIG;
    }
  }

  /**
   * Save configuration updates
   */
  public static async updateConfig(
    partial: Partial<GoogleSheetsSyncConfig>,
    actorId?: string
  ): Promise<GoogleSheetsSyncConfig> {
    const current = await this.getConfig();
    const updated: GoogleSheetsSyncConfig = { ...current, ...partial };
    await SettingsService.set(
      "integrations.google_sheets_sync",
      JSON.stringify(updated),
      "INTEGRATIONS",
      "Google Sheets Bi-directional Leads and Materials Leads Sync Config",
      actorId
    );
    return updated;
  }

  /**
   * Fetch live CSV content from Google Sheets using public shared link
   */
  public static async fetchTabCsv(spreadsheetId: string, gid: string): Promise<string> {
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/csv,text/plain,*/*",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Google Sheet CSV: HTTP ${response.status}`);
      }

      return await response.text();
    } catch (err: any) {
      logger.warn(`[GoogleSheetsSyncService] fetchTabCsv error for gid=${gid}:`, err.message);
      throw err;
    }
  }

  /**
   * Parse RFC 4180 CSV text into structured key-value rows
   */
  public static parseCsv(csvText: string): Array<Record<string, string>> {
    const grid: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = "";
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      if (char === '"') {
        if (inQuotes && csvText[i + 1] === '"') {
          currentCell += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = "";
      } else if ((char === "\r" || char === "\n") && !inQuotes) {
        if (char === "\r" && csvText[i + 1] === "\n") {
          i++;
        }
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c.length > 0)) {
          grid.push(currentRow);
        }
        currentRow = [];
        currentCell = "";
      } else {
        currentCell += char;
      }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c.length > 0)) {
        grid.push(currentRow);
      }
    }

    if (grid.length === 0) return [];

    const header = grid[0].map((h) => h.replace(/[\r\n]+/g, " ").trim());
    const rows: Array<Record<string, string>> = [];

    for (let i = 1; i < grid.length; i++) {
      const values = grid[i];
      if (values.every((v) => !v)) continue; // skip blank rows
      const row: Record<string, string> = {};
      header.forEach((colName, idx) => {
        row[colName] = values[idx] || "";
      });
      rows.push(row);
    }

    return rows;
  }

  /**
   * Helper: Match column header flexibly (case and spacing insensitive)
   */
  private static getColValue(row: Record<string, string>, possibleNames: string[]): string {
    const keys = Object.keys(row);
    for (const name of possibleNames) {
      const normName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const matchedKey = keys.find(
        (k) => k.toLowerCase().replace(/[^a-z0-9]/g, "") === normName
      );
      if (matchedKey && row[matchedKey]) {
        return row[matchedKey].trim();
      }
    }
    return "";
  }

  /**
   * Helper: Parse currency / budget string into float
   */
  private static parseBudget(val: string): number {
    if (!val) return 0;
    const cleaned = val.replace(/[^0-9.]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Helper: Parse Google Sheets date formats (DD/MM/YYYY, HH:mm:ss, ISO, or standard)
   */
  private static parseSheetDate(val: string): Date {
    if (!val) return new Date();
    const trimmed = val.trim();
    // Match DD/MM/YYYY or DD-MM-YYYY with optional time
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:[,\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      const hour = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
      const min = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
      const sec = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;
      const d = new Date(year, month, day, hour, min, sec);
      if (!isNaN(d.getTime())) return d;
    }
    const standardDate = new Date(trimmed);
    if (!isNaN(standardDate.getTime())) return standardDate;
    return new Date();
  }

  /**
   * Helper: Normalize Sheet Status/Stage into standard Lead Stage
   */
  private static normalizeLeadStage(val: string): string {
    if (!val) return "NEW";
    const upper = val.trim().toUpperCase().replace(/[\s\-]+/g, "_");
    const validStages = [
      "NEW",
      "NOT_CONTACTED",
      "CONTACTED",
      "FOLLOW_UP_SCHEDULED",
      "SITE_VISIT_SCHEDULED",
      "SITE_VISIT_COMPLETED",
      "QUOTATION_IN_PROGRESS",
      "QUOTATION_SENT",
      "NEGOTIATION",
      "WON",
      "LOST",
    ];
    if (validStages.includes(upper)) return upper;
    if (upper.includes("WON") || upper.includes("CONVERT")) return "WON";
    if (upper.includes("LOST") || upper.includes("DROP")) return "LOST";
    if (upper.includes("QUOTE") || upper.includes("ESTIMATE")) return "QUOTATION_SENT";
    if (upper.includes("VISIT")) return "SITE_VISIT_SCHEDULED";
    if (upper.includes("FOLLOW")) return "FOLLOW_UP_SCHEDULED";
    if (upper.includes("CONTACT")) return "CONTACTED";
    return "NEW";
  }

  /**
   * Helper: Normalize Sheet Status into standard Material Lead Status/Stage
   */
  private static normalizeMaterialStatus(val: string): string {
    if (!val) return "NEW";
    const upper = val.trim().toUpperCase().replace(/[\s\-]+/g, "_");
    const validStatuses = [
      "NEW",
      "CONTACTED",
      "MATERIAL_REQUIRED",
      "QUOTATION_GENERATED",
      "QUOTATION_SENT",
      "WON",
      "LOST",
      "ORDER_PLACED",
      "VENDOR_ACCEPTED",
      "VENDOR_REJECTED",
      "DELIVERED",
      "CANCELLED",
    ];
    if (validStatuses.includes(upper)) return upper;
    if (upper.includes("WON") || upper.includes("ACCEPT")) return "WON";
    if (upper.includes("LOST") || upper.includes("REJECT")) return "LOST";
    if (upper.includes("ORDER")) return "ORDER_PLACED";
    if (upper.includes("QUOTE")) return "QUOTATION_SENT";
    if (upper.includes("REQUIRE")) return "MATERIAL_REQUIRED";
    if (upper.includes("CONTACT")) return "CONTACTED";
    return "NEW";
  }

  /**
   * Synchronize Leads from Google Sheet tab (High-speed Batch Processing)
   */
  public static async syncLeadsFromSheet(rows: Array<Record<string, string>>, actorId?: string) {
    if (rows.length === 0) return { imported: 0, skipped: 0 };

    // 1. Filter out completely blank rows
    const validRows = rows.filter((row) => {
      const name = this.getColValue(row, ["Customer Name", "Name", "Client Name", "FullName"]);
      const phone = this.getColValue(row, ["Primary Phone", "Phone", "Mobile", "Contact", "Mobile Number"]);
      return Boolean(name || phone);
    });

    let skipped = rows.length - validRows.length;
    if (validRows.length === 0) return { imported: 0, skipped };

    // 2. High-speed Bulk Pre-fetch to check existing records in a SINGLE query
    const phoneSuffixes = validRows
      .map((r) => this.getColValue(r, ["Primary Phone", "Phone", "Mobile", "Contact", "Mobile Number"]).replace(/[^0-9]/g, ""))
      .filter((p) => p.length >= 7)
      .map((p) => p.slice(-8));

    const emails = validRows
      .map((r) => this.getColValue(r, ["Email Address", "Email", "EmailID"]).trim().toLowerCase())
      .filter(Boolean);

    const sheetLeadIds = validRows
      .map((r) => this.getColValue(r, ["Lead ID", "ID", "Reference"]).trim())
      .filter(Boolean);

    const orConditions: any[] = [];
    if (phoneSuffixes.length > 0) {
      phoneSuffixes.forEach((sfx) => orConditions.push({ phone: { contains: sfx } }));
    }
    if (emails.length > 0) {
      orConditions.push({ email: { in: emails, mode: "insensitive" } });
    }
    if (sheetLeadIds.length > 0) {
      orConditions.push({ referenceNo: { in: sheetLeadIds } });
    }

    const existingLeads = orConditions.length > 0
      ? await db.lead.findMany({
          where: { OR: orConditions },
          select: { id: true, phone: true, email: true, referenceNo: true, clientName: true, stage: true },
        })
      : [];

    const existingPhoneSet = new Set(existingLeads.map((l) => l.phone.replace(/[^0-9]/g, "").slice(-8)));
    const existingEmailSet = new Set(existingLeads.map((l) => (l.email || "").toLowerCase()));
    const existingRefSet = new Set(existingLeads.map((l) => l.referenceNo));

    const seenPhonesInBatch = new Set<string>();
    const seenEmailsInBatch = new Set<string>();
    const seenRefsInBatch = new Set<string>();

    const rowsToInsert: Array<Record<string, string>> = [];
    const rowsToUpdate: Array<{ id: string; row: Record<string, string> }> = [];

    for (const row of validRows) {
      const primaryPhone = this.getColValue(row, ["Primary Phone", "Phone", "Mobile", "Contact", "Mobile Number"]);
      const email = this.getColValue(row, ["Email Address", "Email", "EmailID"]).trim().toLowerCase();
      const sheetLeadId = this.getColValue(row, ["Lead ID", "ID", "Reference"]).trim();

      const cleanPhone = primaryPhone.replace(/[^0-9]/g, "");
      const sfx = cleanPhone.length >= 7 ? cleanPhone.slice(-8) : "";

      const existingLead = sheetLeadId
        ? existingLeads.find((l) => l.referenceNo === sheetLeadId)
        : existingLeads.find(
            (l) =>
              (sfx && l.phone.replace(/[^0-9]/g, "").slice(-8) === sfx) ||
              (email && (l.email || "").toLowerCase() === email)
          );

      if (existingLead) {
        const customerName = this.getColValue(row, ["Customer Name", "Name", "Client Name", "FullName"]);
        const statusRaw = this.getColValue(row, ["Status", "Lead Status", "Stage"]);

        const phoneChanged = cleanPhone && existingLead.phone.replace(/[^0-9]/g, "") !== cleanPhone;
        const emailChanged = email && (existingLead.email || "").toLowerCase() !== email;
        const nameChanged = customerName && existingLead.clientName !== customerName;
        const stageChanged = statusRaw && existingLead.stage !== this.normalizeLeadStage(statusRaw);

        if (phoneChanged || emailChanged || nameChanged || stageChanged) {
          rowsToUpdate.push({ id: existingLead.id, row });
        } else {
          skipped++;
        }
      } else {
        if (sfx) seenPhonesInBatch.add(sfx);
        if (email) seenEmailsInBatch.add(email);
        if (sheetLeadId) {
          seenRefsInBatch.add(sheetLeadId);
          existingRefSet.add(sheetLeadId);
        }
        rowsToInsert.push(row);
      }
    }

    if (rowsToInsert.length === 0 && rowsToUpdate.length === 0) {
      return { imported: 0, skipped };
    }

    // 3. Parallel update of existing leads
    const updatedLeads = await Promise.all(
      rowsToUpdate.map(async ({ id, row }) => {
        const customerName = this.getColValue(row, ["Customer Name", "Name", "Client Name", "FullName"]);
        const primaryPhone = this.getColValue(row, ["Primary Phone", "Phone", "Mobile", "Contact", "Mobile Number"]);
        const secondaryPhone = this.getColValue(row, ["Secondary Phone", "Alternate Phone", "Alt Phone"]);
        const email = this.getColValue(row, ["Email Address", "Email", "EmailID"]);
        const location = this.getColValue(row, ["Project Location", "Location", "City", "Address"]);
        const requirement = this.getColValue(row, ["Requirement / Space", "Requirement", "Space", "Scope"]);
        const propertyType = this.getColValue(row, ["Property Type / Scope", "Property Type", "Property"]);
        const budgetRaw = this.getColValue(row, ["Stage / Budget", "Budget", "Estimated Budget"]);
        const notes = this.getColValue(row, ["Notes / Details", "Notes", "Details", "Remarks"]);
        const statusRaw = this.getColValue(row, ["Status", "Lead Status", "Stage"]);
        const sourceForm = this.getColValue(row, ["Source / Form Type", "Source", "Form Type"]);
        const dateTimeStr = this.getColValue(row, ["DATE AND TIME", "Timestamp", "Date", "Submitted At"]);

        const estimatedBudget = this.parseBudget(budgetRaw);
        const createdAt = this.parseSheetDate(dateTimeStr);
        const stage = this.normalizeLeadStage(statusRaw);

        const finalNotesParts = [
          notes || "",
          sourceForm ? `[Form: ${sourceForm}]` : null,
          secondaryPhone ? `[Secondary Phone: ${secondaryPhone}]` : null,
          budgetRaw ? `[Indicated Budget: ${budgetRaw}]` : null,
        ].filter(Boolean);

        return await db.lead.update({
          where: { id },
          data: {
            clientName: customerName || undefined,
            phone: primaryPhone || undefined,
            email: email || undefined,
            location: location || undefined,
            requirement: requirement || undefined,
            propertyTypeKey: propertyType || undefined,
            estimatedBudget: estimatedBudget > 0 ? estimatedBudget : undefined,
            stage,
            notes: finalNotesParts.join("\n") || undefined,
            createdAt,
          },
        });
      })
    );

    // 4. Parallel creation of new leads
    const createdLeads = await Promise.all(
      rowsToInsert.map(async (row) => {
        const customerName = this.getColValue(row, ["Customer Name", "Name", "Client Name", "FullName"]);
        const primaryPhone = this.getColValue(row, ["Primary Phone", "Phone", "Mobile", "Contact", "Mobile Number"]);
        const secondaryPhone = this.getColValue(row, ["Secondary Phone", "Alternate Phone", "Alt Phone"]);
        const email = this.getColValue(row, ["Email Address", "Email", "EmailID"]);
        const location = this.getColValue(row, ["Project Location", "Location", "City", "Address"]);
        const requirement = this.getColValue(row, ["Requirement / Space", "Requirement", "Space", "Scope"]);
        const propertyType = this.getColValue(row, ["Property Type / Scope", "Property Type", "Property"]);
        const budgetRaw = this.getColValue(row, ["Stage / Budget", "Budget", "Estimated Budget"]);
        const notes = this.getColValue(row, ["Notes / Details", "Notes", "Details", "Remarks"]);
        const statusRaw = this.getColValue(row, ["Status", "Lead Status", "Stage"]);
        const sourceForm = this.getColValue(row, ["Source / Form Type", "Source", "Form Type"]);
        const dateTimeStr = this.getColValue(row, ["DATE AND TIME", "Timestamp", "Date", "Submitted At"]);
        const sheetLeadId = this.getColValue(row, ["Lead ID", "ID", "Reference"]);

        const referenceNo = sheetLeadId && sheetLeadId.trim().length > 0
          ? sheetLeadId.trim()
          : await IdGeneratorService.generate("LEAD");

        const estimatedBudget = this.parseBudget(budgetRaw);
        const createdAt = this.parseSheetDate(dateTimeStr);
        const stage = this.normalizeLeadStage(statusRaw);

        const finalNotesParts = [
          notes || "",
          sourceForm ? `[Form: ${sourceForm}]` : null,
          secondaryPhone ? `[Secondary Phone: ${secondaryPhone}]` : null,
          budgetRaw ? `[Indicated Budget: ${budgetRaw}]` : null,
        ].filter(Boolean);

        const created = await db.lead.create({
          data: {
            referenceNo,
            clientName: customerName || "Inbound Web Lead",
            phone: primaryPhone || "N/A",
            email: email || null,
            location: location || "Bangalore",
            requirement: requirement || "Interior Design Consultation",
            propertyTypeKey: propertyType || "RESIDENTIAL",
            estimatedBudget: estimatedBudget > 0 ? estimatedBudget : null,
            sourceKey: "WEBSITE",
            stage,
            priority: "HIGH",
            notes: finalNotesParts.join("\n") || null,
            createdAt,
          },
        });

        // Non-blocking asynchronous activity & notification logging
        Promise.allSettled([
          AuditService.logEvent({
            userId: actorId,
            action: "LEAD_IMPORTED_FROM_SHEETS",
            entityType: "Lead",
            entityId: created.id,
            newValues: {
              referenceNo: created.referenceNo,
              clientName: created.clientName,
              phone: created.phone,
              source: created.sourceKey,
            },
          }),
          ActivityService.record({
            userId: actorId,
            entityType: "Lead",
            entityId: created.id,
            type: "STATUS_CHANGE",
            title: `Lead Synced from Google Sheets (${created.referenceNo})`,
            description: `Customer ${created.clientName} synced from Google Sheet form into Interior Leads.`,
          }),
          NotificationEngine.publishEvent({
            eventId: `evt_lead_sheet_sync_${created.id}_${Date.now()}`,
            eventType: "LEAD_ASSIGNED",
            category: "CRM",
            priority: "HIGH",
            entityType: "Lead",
            entityId: created.id,
            title: `New Inbound Lead: ${created.clientName}`,
            message: `New customer inquiry received from Website Google Sheet (${created.referenceNo}). Contact: ${created.phone}.`,
            actionUrl: `/leads?id=${created.id}`,
          }),
        ]).catch(() => {});

        return created;
      })
    );

    return { imported: createdLeads.length + updatedLeads.length, skipped };
  }

  /**
   * Synchronize Materials Leads from Google Sheet tab (High-speed Batch Processing)
   */
  public static async syncMaterialLeadsFromSheet(rows: Array<Record<string, string>>, actorId?: string) {
    if (rows.length === 0) return { imported: 0, skipped: 0 };

    const validRows = rows.filter((row) => {
      const name = this.getColValue(row, ["Customer Name", "Name", "Client Name", "FullName"]);
      const phone = this.getColValue(row, ["Primary Phone", "Phone", "Mobile", "Contact"]);
      return Boolean(name || phone);
    });

    let skipped = rows.length - validRows.length;
    if (validRows.length === 0) return { imported: 0, skipped };

    const phoneSuffixes = validRows
      .map((r) => this.getColValue(r, ["Primary Phone", "Phone", "Mobile", "Contact"]).replace(/[^0-9]/g, ""))
      .filter((p) => p.length >= 7)
      .map((p) => p.slice(-8));

    const emails = validRows
      .map((r) => this.getColValue(r, ["Email Address", "Email", "EmailID"]).trim().toLowerCase())
      .filter(Boolean);

    const sheetLeadIds = validRows
      .map((r) => this.getColValue(r, ["Lead ID", "ID", "Reference"]).trim())
      .filter(Boolean);

    const orConditions: any[] = [];
    if (phoneSuffixes.length > 0) {
      phoneSuffixes.forEach((sfx) => orConditions.push({ primaryContact: { contains: sfx } }));
    }
    if (emails.length > 0) {
      orConditions.push({ email: { in: emails, mode: "insensitive" } });
    }
    if (sheetLeadIds.length > 0) {
      orConditions.push({ referenceNo: { in: sheetLeadIds } });
    }

    const existingMatLeads = orConditions.length > 0
      ? await db.materialLead.findMany({
          where: { OR: orConditions },
          select: { id: true, primaryContact: true, email: true, referenceNo: true, customerName: true, stage: true },
        })
      : [];

    const existingPhoneSet = new Set(existingMatLeads.map((l) => l.primaryContact.replace(/[^0-9]/g, "").slice(-8)));
    const existingEmailSet = new Set(existingMatLeads.map((l) => (l.email || "").toLowerCase()));
    const existingRefSet = new Set(existingMatLeads.map((l) => l.referenceNo));

    const seenPhonesInBatch = new Set<string>();
    const seenEmailsInBatch = new Set<string>();
    const seenRefsInBatch = new Set<string>();

    const rowsToInsert: Array<Record<string, string>> = [];
    const rowsToUpdate: Array<{ id: string; row: Record<string, string> }> = [];

    for (const row of validRows) {
      const primaryPhone = this.getColValue(row, ["Primary Phone", "Phone", "Mobile", "Contact"]);
      const email = this.getColValue(row, ["Email Address", "Email", "EmailID"]).trim().toLowerCase();
      const sheetLeadId = this.getColValue(row, ["Lead ID", "ID", "Reference"]).trim();

      const cleanPhone = primaryPhone.replace(/[^0-9]/g, "");
      const sfx = cleanPhone.length >= 7 ? cleanPhone.slice(-8) : "";

      const existingLead = sheetLeadId
        ? existingMatLeads.find((l) => l.referenceNo === sheetLeadId)
        : existingMatLeads.find(
            (l) =>
              (sfx && l.primaryContact.replace(/[^0-9]/g, "").slice(-8) === sfx) ||
              (email && (l.email || "").toLowerCase() === email)
          );

      if (existingLead) {
        const customerName = this.getColValue(row, ["Customer Name", "Name", "Client Name", "FullName"]);
        const statusRaw = this.getColValue(row, ["Status", "Lead Status", "Stage"]);

        const phoneChanged = cleanPhone && existingLead.primaryContact.replace(/[^0-9]/g, "") !== cleanPhone;
        const emailChanged = email && (existingLead.email || "").toLowerCase() !== email;
        const nameChanged = customerName && existingLead.customerName !== customerName;
        const stageChanged = statusRaw && existingLead.stage !== this.normalizeMaterialStatus(statusRaw);

        if (phoneChanged || emailChanged || nameChanged || stageChanged) {
          rowsToUpdate.push({ id: existingLead.id, row });
        } else {
          skipped++;
        }
      } else {
        if (sfx) seenPhonesInBatch.add(sfx);
        if (email) seenEmailsInBatch.add(email);
        if (sheetLeadId) {
          seenRefsInBatch.add(sheetLeadId);
          existingRefSet.add(sheetLeadId);
        }
        rowsToInsert.push(row);
      }
    }

    if (rowsToInsert.length === 0 && rowsToUpdate.length === 0) {
      return { imported: 0, skipped };
    }

    // 3. Parallel update of existing material leads
    const updatedMatLeads = await Promise.all(
      rowsToUpdate.map(async ({ id, row }) => {
        const customerName = this.getColValue(row, ["Customer Name", "Name", "Client Name", "FullName"]);
        const primaryPhone = this.getColValue(row, ["Primary Phone", "Phone", "Mobile", "Contact"]);
        const secondaryPhone = this.getColValue(row, ["Secondary Phone", "Alternate Phone", "Alt Phone"]);
        const email = this.getColValue(row, ["Email Address", "Email", "EmailID"]);
        const location = this.getColValue(row, ["Project Location", "Location", "City", "Address"]);
        const materialDetails = this.getColValue(row, ["Material / Catalogue Details", "Material Details", "Material", "Requirement"]);
        const quantityRequirement = this.getColValue(row, ["Quantity / Requirement", "Quantity", "Qty", "Requirement"]);
        const budgetRaw = this.getColValue(row, ["Stage / Budget", "Budget"]);
        const notes = this.getColValue(row, ["Notes / Details", "Notes", "Details", "Remarks"]);
        const statusRaw = this.getColValue(row, ["Status", "Lead Status", "Stage"]);
        const sourceForm = this.getColValue(row, ["Source / Form Type", "Source", "Form Type"]);
        const dateTimeStr = this.getColValue(row, ["DATE AND TIME", "Timestamp", "Date", "Submitted At"]);

        const requirementsList = [];
        if (materialDetails) {
          requirementsList.push({
            id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            itemName: materialDetails,
            quantity: parseFloat(quantityRequirement.replace(/[^0-9.]/g, "")) || 1,
            unit: "NOS",
            specifications: quantityRequirement ? `Quantity / Requirement: ${quantityRequirement}` : undefined,
          });
        }

        const createdAt = this.parseSheetDate(dateTimeStr);
        const status = this.normalizeMaterialStatus(statusRaw);

        const finalNotesParts = [
          notes || "",
          sourceForm ? `[Form: ${sourceForm}]` : null,
          budgetRaw ? `[Indicated Budget: ${budgetRaw}]` : null,
        ].filter(Boolean);

        return await db.materialLead.update({
          where: { id },
          data: {
            customerName: customerName || undefined,
            primaryContact: primaryPhone || undefined,
            secondaryContact: secondaryPhone || undefined,
            email: email || undefined,
            location: location || undefined,
            requirement: materialDetails || undefined,
            stage: status,
            status,
            requirements: requirementsList.length > 0 ? JSON.stringify(requirementsList) : undefined,
            notes: finalNotesParts.join("\n") || undefined,
            createdAt,
          },
        });
      })
    );

    // 4. Parallel creation of new material leads
    const createdMatLeads = await Promise.all(
      rowsToInsert.map(async (row) => {
        const customerName = this.getColValue(row, ["Customer Name", "Name", "Client Name", "FullName"]);
        const primaryPhone = this.getColValue(row, ["Primary Phone", "Phone", "Mobile", "Contact"]);
        const secondaryPhone = this.getColValue(row, ["Secondary Phone", "Alternate Phone", "Alt Phone"]);
        const email = this.getColValue(row, ["Email Address", "Email", "EmailID"]);
        const location = this.getColValue(row, ["Project Location", "Location", "City", "Address"]);
        const materialDetails = this.getColValue(row, ["Material / Catalogue Details", "Material Details", "Material", "Requirement"]);
        const quantityRequirement = this.getColValue(row, ["Quantity / Requirement", "Quantity", "Qty", "Requirement"]);
        const budgetRaw = this.getColValue(row, ["Stage / Budget", "Budget"]);
        const notes = this.getColValue(row, ["Notes / Details", "Notes", "Details", "Remarks"]);
        const statusRaw = this.getColValue(row, ["Status", "Lead Status", "Stage"]);
        const sourceForm = this.getColValue(row, ["Source / Form Type", "Source", "Form Type"]);
        const dateTimeStr = this.getColValue(row, ["DATE AND TIME", "Timestamp", "Date", "Submitted At"]);
        const sheetLeadId = this.getColValue(row, ["Lead ID", "ID", "Reference"]);

        const referenceNo = sheetLeadId && sheetLeadId.trim().length > 0
          ? sheetLeadId.trim()
          : await IdGeneratorService.generate("MAT-LEAD");

        const requirementsList = [];
        if (materialDetails) {
          requirementsList.push({
            id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            itemName: materialDetails,
            quantity: parseFloat(quantityRequirement.replace(/[^0-9.]/g, "")) || 1,
            unit: "NOS",
            specifications: quantityRequirement ? `Quantity / Requirement: ${quantityRequirement}` : undefined,
          });
        }

        const createdAt = this.parseSheetDate(dateTimeStr);
        const status = this.normalizeMaterialStatus(statusRaw);

        const finalNotesParts = [
          notes || "",
          sourceForm ? `[Form: ${sourceForm}]` : null,
          budgetRaw ? `[Indicated Budget: ${budgetRaw}]` : null,
        ].filter(Boolean);

        const created = await db.materialLead.create({
          data: {
            referenceNo,
            customerName: customerName || "Inbound Material Lead",
            primaryContact: primaryPhone || "N/A",
            secondaryContact: secondaryPhone || null,
            email: email || null,
            location: location || "Bangalore",
            requirement: materialDetails || "Material Supply & Order Request",
            sourceKey: "WEBSITE",
            stage: status,
            status,
            priority: "HIGH",
            requirements: JSON.stringify(requirementsList),
            notes: finalNotesParts.join("\n") || null,
            createdAt,
          },
        });

        // Non-blocking asynchronous logging
        Promise.allSettled([
          AuditService.logEvent({
            userId: actorId,
            action: "MATERIAL_LEAD_IMPORTED_FROM_SHEETS",
            entityType: "MaterialLead",
            entityId: created.id,
            newValues: {
              referenceNo: created.referenceNo,
              customerName: created.customerName,
              primaryContact: created.primaryContact,
              source: created.sourceKey,
            },
          }),
          ActivityService.record({
            userId: actorId,
            entityType: "MaterialLead",
            entityId: created.id,
            type: "STATUS_CHANGE",
            title: `Material Lead Synced from Google Sheets (${created.referenceNo})`,
            description: `Customer ${created.customerName} synced from Google Sheet form into Materials Leads.`,
          }),
          NotificationEngine.publishEvent({
            eventId: `evt_mat_sheet_sync_${created.id}_${Date.now()}`,
            eventType: "LEAD_ASSIGNED",
            category: "CRM",
            priority: "HIGH",
            entityType: "MaterialLead",
            entityId: created.id,
            title: `New Material Lead: ${created.customerName}`,
            message: `New material supply inquiry received from Website Google Sheet (${created.referenceNo}). Contact: ${created.primaryContact}.`,
            actionUrl: `/material-leads?id=${created.id}`,
          }),
        ]).catch(() => {});

        return created;
      })
    );

    return { imported: createdMatLeads.length + updatedMatLeads.length, skipped };
  }

  /**
   * Main synchronization orchestrator: Fetches both sheets and updates database in parallel
   */
  public static async syncNow(actorId?: string): Promise<{
    success: boolean;
    leadsImported: number;
    materialLeadsImported: number;
    leadsSkipped: number;
    materialLeadsSkipped: number;
    timestamp: string;
    message: string;
  }> {
    const config = await this.getConfig();
    const timestamp = new Date().toISOString();

    try {
      logger.info("[GoogleSheetsSyncService] Starting high-speed synchronization with spreadsheet ID:", config.spreadsheetId);

      // 1. Fetch both tabs concurrently
      const [leadsCsv, materialsCsv] = await Promise.all([
        this.fetchTabCsv(config.spreadsheetId, config.leadsGid).catch((err) => {
          logger.warn("[GoogleSheetsSyncService] Failed to fetch Leads tab CSV:", err.message);
          return "";
        }),
        this.fetchTabCsv(config.spreadsheetId, config.materialsGid).catch((err) => {
          logger.warn("[GoogleSheetsSyncService] Failed to fetch Materials Leads tab CSV:", err.message);
          return "";
        }),
      ]);

      const leadsRows = leadsCsv ? this.parseCsv(leadsCsv) : [];
      const materialsRows = materialsCsv ? this.parseCsv(materialsCsv) : [];

      // 2. Process both tabs concurrently in parallel
      const [leadsResult, materialsResult] = await Promise.all([
        this.syncLeadsFromSheet(leadsRows, actorId),
        this.syncMaterialLeadsFromSheet(materialsRows, actorId),
      ]);

      // 3. Fast cache invalidation
      serverCache.invalidate("leads:");
      serverCache.invalidate("material_leads:");
      serverCache.invalidate("dashboard:");

      const result = {
        leadsImported: leadsResult.imported,
        materialLeadsImported: materialsResult.imported,
        leadsSkipped: leadsResult.skipped,
        materialLeadsSkipped: materialsResult.skipped,
        timestamp,
      };

      // Non-blocking config update
      this.updateConfig({
        lastSyncAt: timestamp,
        lastSyncStatus: "SUCCESS",
        lastSyncResult: result,
      }, actorId).catch(() => {});

      const message = `Google Sheets sync successful: ${leadsResult.imported} interior leads and ${materialsResult.imported} material leads imported.`;
      logger.info(`[GoogleSheetsSyncService] ${message}`);

      return {
        success: true,
        ...result,
        message,
      };
    } catch (error: any) {
      logger.error("[GoogleSheetsSyncService] Sync failed:", error);
      this.updateConfig({
        lastSyncAt: timestamp,
        lastSyncStatus: "ERROR",
      }, actorId).catch(() => {});

      throw new Error(`Google Sheets sync failed: ${error.message || "Unknown error"}`);
    }
  }


  /**
   * Real-time Single Ingestion (For Google Apps Script onFormSubmit Webhook)
   */
  public static async ingestWebhookRow(
    type: "LEAD" | "MATERIAL_LEAD",
    rowData: Record<string, string>,
    actorId?: string
  ) {
    if (type === "LEAD") {
      const res = await this.syncLeadsFromSheet([rowData], actorId);
      serverCache.invalidate("leads:");
      serverCache.invalidate("dashboard:");
      return { success: true, imported: res.imported, skipped: res.skipped };
    } else {
      const res = await this.syncMaterialLeadsFromSheet([rowData], actorId);
      serverCache.invalidate("material_leads:");
      serverCache.invalidate("dashboard:");
      return { success: true, imported: res.imported, skipped: res.skipped };
    }
  }
}
