import { db } from "./db";

export type EntityPrefix =
  | "LEAD"
  | "MAT_LEAD"
  | "MAT-LEAD"
  | "MAT_ORD"
  | "MAT-ORD"
  | "PROJ"
  | "Q"
  | "QTN"
  | "PAY"
  | "EXP"
  | "VEN"
  | "PO"
  | "CLI"
  | "CO"
  | "WAR"
  | "ADV"
  | "PCX"
  | "SET"
  | "MR"
  | "GRN"
  | "MAT"
  | "WH"
  | "STM"
  | "STT"
  | "STC"
  | "RES"
  | "ADJ"
  | "VPAY"
  | "INV"
  | "REC"
  | "VPAYABLE"
  | "LED"
  | "ACC"
  | "REM"
  | "TSK"
  | "DOC"
  | "BAK"
  | "EMP"
  | "SAL";

/**
 * Safe, concurrency-resistant reference ID generator.
 * Format: PREFIX-YYYY-XXXX (or ACC-XXXX / WH-XXXX for accounts/warehouses)
 */
export class IdGeneratorService {
  private static reservedRefs = new Set<string>();

  public static async generate(prefix: EntityPrefix, offset: number = 0): Promise<string> {
    const year = new Date().getFullYear();

    let maxSequence = 0;
    const existingRefs = new Set<string>();

    switch (prefix) {
      case "EMP": {
        const last = await db.employee.findFirst({
          where: { employeeNo: { startsWith: `${prefix}-${year}-` } },
          orderBy: { employeeNo: "desc" },
          select: { employeeNo: true },
        });
        if (last?.employeeNo) existingRefs.add(last.employeeNo);
        maxSequence = this.extractSequence(last?.employeeNo);
        break;
      }
      case "SAL": {
        const last = await db.employeeSalaryPayment.findFirst({
          where: { referenceNo: { startsWith: `${prefix}-${year}-` } },
          orderBy: { referenceNo: "desc" },
          select: { referenceNo: true },
        });
        if (last?.referenceNo) existingRefs.add(last.referenceNo);
        maxSequence = this.extractSequence(last?.referenceNo);
        break;
      }
      case "BAK": {
        const last = await db.backupLog.findFirst({
          where: { backupNo: { startsWith: `${prefix}-${year}-` } },
          orderBy: { backupNo: "desc" },
          select: { backupNo: true },
        });
        if (last?.backupNo) existingRefs.add(last.backupNo);
        maxSequence = this.extractSequence(last?.backupNo);
        break;
      }
      case "DOC": {
        const last = await db.document.findFirst({
          where: { referenceNo: { startsWith: `${prefix}-${year}-` } },
          orderBy: { referenceNo: "desc" },
          select: { referenceNo: true },
        });
        if (last?.referenceNo) existingRefs.add(last.referenceNo);
        maxSequence = this.extractSequence(last?.referenceNo);
        break;
      }
      case "TSK": {
        const records = await db.task.findMany({
          where: { referenceNo: { startsWith: `${prefix}-${year}-` } },
          select: { referenceNo: true },
        });
        records.forEach((r) => existingRefs.add(r.referenceNo));
        maxSequence = records.reduce((max, r) => Math.max(max, this.extractSequence(r.referenceNo)), 0);
        break;
      }
      case "REM": {
        const records = await db.reminder.findMany({
          where: { referenceNo: { startsWith: `${prefix}-${year}-` } },
          select: { referenceNo: true },
        });
        records.forEach((r) => existingRefs.add(r.referenceNo));
        maxSequence = records.reduce((max, r) => Math.max(max, this.extractSequence(r.referenceNo)), 0);
        break;
      }
      case "ACC": {
        const last = await db.financialAccount.findFirst({
          where: { accountCode: { startsWith: `${prefix}-` } },
          orderBy: { accountCode: "desc" },
          select: { accountCode: true },
        });
        maxSequence = this.extractSequence(last?.accountCode);
        const nextSeq = maxSequence + 1 + offset;
        return `${prefix}-${String(nextSeq).padStart(4, "0")}`;
      }
      case "VPAY": {
        const records = await db.vendorPayment.findMany({
          where: { paymentNo: { startsWith: `${prefix}-${year}-` } },
          select: { paymentNo: true },
        });
        records.forEach((r) => existingRefs.add(r.paymentNo));
        maxSequence = records.reduce((max, r) => Math.max(max, this.extractSequence(r.paymentNo)), 0);
        break;
      }
      case "INV": {
        const records = await db.gstInvoice.findMany({
          where: { invoiceNo: { startsWith: `${prefix}-${year}-` } },
          select: { invoiceNo: true },
        });
        records.forEach((r) => existingRefs.add(r.invoiceNo));
        maxSequence = records.reduce((max, r) => Math.max(max, this.extractSequence(r.invoiceNo)), 0);
        break;
      }
      case "REC": {
        const records = await db.clientReceivable.findMany({
          where: { receivableNo: { startsWith: `${prefix}-${year}-` } },
          select: { receivableNo: true },
        });
        records.forEach((r) => existingRefs.add(r.receivableNo));
        maxSequence = records.reduce((max, r) => Math.max(max, this.extractSequence(r.receivableNo)), 0);
        break;
      }
      case "VPAYABLE": {
        const records = await db.vendorPayable.findMany({
          where: { payableNo: { startsWith: `${prefix}-${year}-` } },
          select: { payableNo: true },
        });
        records.forEach((r) => existingRefs.add(r.payableNo));
        maxSequence = records.reduce((max, r) => Math.max(max, this.extractSequence(r.payableNo)), 0);
        break;
      }
      case "LED": {
        const records = await db.financialLedger.findMany({
          where: { entryNo: { startsWith: `${prefix}-${year}-` } },
          select: { entryNo: true },
        });
        records.forEach((r) => existingRefs.add(r.entryNo));
        maxSequence = records.reduce((max, r) => Math.max(max, this.extractSequence(r.entryNo)), 0);
        break;
      }
      case "MAT": {
        const last = await db.material.findFirst({
          where: { materialCode: { startsWith: `${prefix}-${year}-` } },
          orderBy: { materialCode: "desc" },
          select: { materialCode: true },
        });
        if (last?.materialCode) existingRefs.add(last.materialCode);
        maxSequence = this.extractSequence(last?.materialCode);
        break;
      }
      case "WH": {
        const last = await db.warehouse.findFirst({
          where: { warehouseCode: { startsWith: `${prefix}-` } },
          orderBy: { warehouseCode: "desc" },
          select: { warehouseCode: true },
        });
        maxSequence = this.extractSequence(last?.warehouseCode);
        const nextSeq = maxSequence + 1 + offset;
        return `${prefix}-${String(nextSeq).padStart(4, "0")}`;
      }
      case "STM": {
        const last = await db.stockMovement.findFirst({
          where: { movementNo: { startsWith: `${prefix}-${year}-` } },
          orderBy: { movementNo: "desc" },
          select: { movementNo: true },
        });
        if (last?.movementNo) existingRefs.add(last.movementNo);
        maxSequence = this.extractSequence(last?.movementNo);
        break;
      }
      case "STT": {
        const last = await db.stockTransfer.findFirst({
          where: { transferNo: { startsWith: `${prefix}-${year}-` } },
          orderBy: { transferNo: "desc" },
          select: { transferNo: true },
        });
        if (last?.transferNo) existingRefs.add(last.transferNo);
        maxSequence = this.extractSequence(last?.transferNo);
        break;
      }
      case "STC": {
        const last = await db.stockCount.findFirst({
          where: { countNo: { startsWith: `${prefix}-${year}-` } },
          orderBy: { countNo: "desc" },
          select: { countNo: true },
        });
        if (last?.countNo) existingRefs.add(last.countNo);
        maxSequence = this.extractSequence(last?.countNo);
        break;
      }
      case "RES": {
        const last = await db.stockReservation.findFirst({
          where: { reservationNo: { startsWith: `${prefix}-${year}-` } },
          orderBy: { reservationNo: "desc" },
          select: { reservationNo: true },
        });
        if (last?.reservationNo) existingRefs.add(last.reservationNo);
        maxSequence = this.extractSequence(last?.reservationNo);
        break;
      }
      case "MR": {
        const records = await db.materialRequest.findMany({
          where: { referenceNo: { startsWith: `${prefix}-${year}-` } },
          select: { referenceNo: true },
        });
        records.forEach((r) => existingRefs.add(r.referenceNo));
        maxSequence = records.reduce((max, r) => Math.max(max, this.extractSequence(r.referenceNo)), 0);
        break;
      }
      case "GRN": {
        const records = await db.goodsReceipt.findMany({
          where: { referenceNo: { startsWith: `${prefix}-${year}-` } },
          select: { referenceNo: true },
        });
        records.forEach((r) => existingRefs.add(r.referenceNo));
        maxSequence = records.reduce((max, r) => Math.max(max, this.extractSequence(r.referenceNo)), 0);
        break;
      }
      case "LEAD": {
        const records = await db.lead.findMany({
          where: { referenceNo: { startsWith: `${prefix}-${year}-` } },
          select: { referenceNo: true },
        });
        records.forEach((r) => existingRefs.add(r.referenceNo));
        maxSequence = records.reduce((max, r) => Math.max(max, this.extractSequence(r.referenceNo)), 0);
        break;
      }
      case "MAT_LEAD":
      case "MAT-LEAD": {
        const pfx = "MAT-LEAD";
        const records = await db.lead.findMany({
          where: { referenceNo: { startsWith: `${pfx}-${year}-` } },
          select: { referenceNo: true },
        });
        records.forEach((r) => existingRefs.add(r.referenceNo));
        maxSequence = records.reduce((max, r) => Math.max(max, this.extractSequence(r.referenceNo)), 0);

        let nextSeq = maxSequence + 1 + offset;
        const padding = 4;
        let paddedSeq = String(nextSeq).padStart(padding, "0");
        let candidate = `${pfx}-${year}-${paddedSeq}`;

        while (existingRefs.has(candidate) || IdGeneratorService.reservedRefs.has(candidate)) {
          nextSeq++;
          paddedSeq = String(nextSeq).padStart(padding, "0");
          candidate = `${pfx}-${year}-${paddedSeq}`;
        }

        IdGeneratorService.reservedRefs.add(candidate);
        setTimeout(() => {
          IdGeneratorService.reservedRefs.delete(candidate);
        }, 15000);

        return candidate;
      }
      case "MAT_ORD":
      case "MAT-ORD": {
        const pfx = "MAT-ORD";
        const records = await db.purchaseOrder.findMany({
          where: { referenceNo: { startsWith: `${pfx}-${year}-` } },
          select: { referenceNo: true },
        });
        records.forEach((r) => existingRefs.add(r.referenceNo));
        maxSequence = records.reduce((max, r) => Math.max(max, this.extractSequence(r.referenceNo)), 0);

        let nextSeq = maxSequence + 1 + offset;
        const padding = 4;
        let paddedSeq = String(nextSeq).padStart(padding, "0");
        let candidate = `${pfx}-${year}-${paddedSeq}`;

        while (existingRefs.has(candidate) || IdGeneratorService.reservedRefs.has(candidate)) {
          nextSeq++;
          paddedSeq = String(nextSeq).padStart(padding, "0");
          candidate = `${pfx}-${year}-${paddedSeq}`;
        }

        IdGeneratorService.reservedRefs.add(candidate);
        setTimeout(() => {
          IdGeneratorService.reservedRefs.delete(candidate);
        }, 15000);

        return candidate;
      }
      case "PROJ": {
        const records = await db.project.findMany({
          where: { referenceNo: { startsWith: `${prefix}-${year}-` } },
          select: { referenceNo: true },
        });
        records.forEach((r) => existingRefs.add(r.referenceNo));
        maxSequence = records.reduce((max, r) => Math.max(max, this.extractSequence(r.referenceNo)), 0);
        break;
      }
      case "CO": {
        const records = await db.changeOrder.findMany({
          where: { referenceNo: { startsWith: `${prefix}-${year}-` } },
          select: { referenceNo: true },
        });
        records.forEach((r) => existingRefs.add(r.referenceNo));
        maxSequence = records.reduce((max, r) => Math.max(max, this.extractSequence(r.referenceNo)), 0);
        break;
      }
      case "WAR": {
        const records = await db.warrantyIssue.findMany({
          where: { issueNo: { startsWith: `${prefix}-${year}-` } },
          select: { issueNo: true },
        });
        records.forEach((r) => existingRefs.add(r.issueNo));
        maxSequence = records.reduce((max, r) => Math.max(max, this.extractSequence(r.issueNo)), 0);
        break;
      }
      case "ADV": {
        const records = await db.employeeAdvance.findMany({
          where: { referenceNo: { startsWith: `${prefix}-${year}-` } },
          select: { referenceNo: true },
        });
        records.forEach((r) => existingRefs.add(r.referenceNo));
        maxSequence = records.reduce((max, r) => Math.max(max, this.extractSequence(r.referenceNo)), 0);
        break;
      }
      case "PCX": {
        const records = await db.pettyCashExpense.findMany({
          where: { referenceNo: { startsWith: `${prefix}-${year}-` } },
          select: { referenceNo: true },
        });
        records.forEach((r) => existingRefs.add(r.referenceNo));
        maxSequence = records.reduce((max, r) => Math.max(max, this.extractSequence(r.referenceNo)), 0);
        break;
      }
      case "SET": {
        const records = await db.advanceSettlement.findMany({
          where: { referenceNo: { startsWith: `${prefix}-${year}-` } },
          select: { referenceNo: true },
        });
        records.forEach((r) => existingRefs.add(r.referenceNo));
        maxSequence = records.reduce((max, r) => Math.max(max, this.extractSequence(r.referenceNo)), 0);
        break;
      }
      case "Q":
      case "QTN": {
        const records = await db.quotation.findMany({
          where: {
            OR: [
              { referenceNo: { startsWith: `Q-${year}-` } },
              { referenceNo: { startsWith: `QTN-${year}-` } },
            ],
          },
          select: { referenceNo: true },
        });
        records.forEach((r) => existingRefs.add(r.referenceNo));
        maxSequence = records.reduce((max, r) => Math.max(max, this.extractSequence(r.referenceNo)), 0);
        break;
      }
      case "PAY": {
        const records = await db.clientPayment.findMany({
          where: { referenceNo: { startsWith: `${prefix}-${year}-` } },
          select: { referenceNo: true },
        });
        records.forEach((r) => existingRefs.add(r.referenceNo));
        maxSequence = records.reduce((max, r) => Math.max(max, this.extractSequence(r.referenceNo)), 0);
        break;
      }
      case "EXP": {
        const records = await db.expense.findMany({
          where: { referenceNo: { startsWith: `${prefix}-${year}-` } },
          select: { referenceNo: true },
        });
        records.forEach((r) => existingRefs.add(r.referenceNo));
        maxSequence = records.reduce((max, r) => Math.max(max, this.extractSequence(r.referenceNo)), 0);
        break;
      }
      case "VEN": {
        const records = await db.vendor.findMany({
          where: { referenceNo: { startsWith: `${prefix}-${year}-` } },
          select: { referenceNo: true },
        });
        records.forEach((r) => existingRefs.add(r.referenceNo));
        maxSequence = records.reduce((max, r) => Math.max(max, this.extractSequence(r.referenceNo)), 0);
        break;
      }
      case "PO": {
        const records = await db.purchaseOrder.findMany({
          where: { referenceNo: { startsWith: `${prefix}-${year}-` } },
          select: { referenceNo: true },
        });
        records.forEach((r) => existingRefs.add(r.referenceNo));
        maxSequence = records.reduce((max, r) => Math.max(max, this.extractSequence(r.referenceNo)), 0);
        break;
      }
      case "CLI": {
        const records = await db.client.findMany({
          where: { referenceNo: { startsWith: `${prefix}-${year}-` } },
          select: { referenceNo: true },
        });
        records.forEach((r) => existingRefs.add(r.referenceNo));
        maxSequence = records.reduce((max, r) => Math.max(max, this.extractSequence(r.referenceNo)), 0);
        break;
      }
    }

    let nextSeq = maxSequence + 1 + offset;
    const padding = 4;
    let paddedSeq = String(nextSeq).padStart(padding, "0");
    let candidate = `${prefix}-${year}-${paddedSeq}`;

    while (existingRefs.has(candidate) || IdGeneratorService.reservedRefs.has(candidate)) {
      nextSeq++;
      paddedSeq = String(nextSeq).padStart(padding, "0");
      candidate = `${prefix}-${year}-${paddedSeq}`;
    }

    IdGeneratorService.reservedRefs.add(candidate);
    setTimeout(() => {
      IdGeneratorService.reservedRefs.delete(candidate);
    }, 15000);

    return candidate;
  }


  private static extractSequence(refNo?: string | null): number {
    if (!refNo) return 0;
    // Match pattern: PREFIX-YYYY-XXXX (extracting XXXX digits before any optional -V suffix)
    const match = refNo.match(/^[A-Z_-]+-\d{4}-(\d+)/);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed)) {
        if (parsed >= 9000 && parsed <= 9999) return 0;
        return parsed;
      }
    }
    const parts = refNo.split("-");
    for (let i = parts.length - 1; i >= 0; i--) {
      const parsed = parseInt(parts[i], 10);
      if (!isNaN(parsed) && parts[i].length <= 6) {
        if (parsed >= 9000 && parsed <= 9999) return 0;
        return parsed;
      }
    }
    return 0;
  }
}
