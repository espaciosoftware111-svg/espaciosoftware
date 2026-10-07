import { db } from "@/lib/db";
import { BusinessRuleError, ConflictError, NotFoundError } from "@/lib/errors";
import { IdGeneratorService } from "@/lib/id-generator";
import { AuditService } from "../audit/audit.service";
import { ActivityService } from "../activity/activity.service";

export class LeadConversionService {
  public static async convertLeadToProject(leadId: string, userId?: string) {
    const lead = await db.lead.findUnique({
      where: { id: leadId },
      include: { client: true, project: true, quotations: true },
    });

    if (!lead) {
      throw new NotFoundError("Lead not found");
    }

    if (lead.project) {
      throw new ConflictError(`Lead ${lead.referenceNo} has already been converted into Project #${lead.project.referenceNo}.`);
    }

    if (lead.stage !== "WON" && lead.stage !== "PROJECT_CREATED") {
      const hasPayments = await db.clientPayment.count({ where: { leadId } });
      if (hasPayments > 0) {
        await db.lead.update({ where: { id: leadId }, data: { stage: "WON" } });
      } else {
        throw new BusinessRuleError(`Lead conversion requires stage "WON". Current stage: [${lead.stage}]`);
      }
    }

    const result = await db.$transaction(async (tx) => {
      let clientId = lead.client?.id;

      if (!clientId) {
        // Check if a client with this phone number already exists
        const existingClient = await tx.client.findFirst({
          where: { phone: lead.phone },
        });

        if (existingClient) {
          clientId = existingClient.id;
          await tx.client.update({
            where: { id: existingClient.id },
            data: { leadId: lead.id },
          });
        } else {
          const clientRefNo = await IdGeneratorService.generate("CLI");
          const client = await tx.client.create({
            data: {
              referenceNo: clientRefNo,
              leadId: lead.id,
              fullName: lead.clientName,
              phone: lead.phone,
              email: lead.email ?? null,
              address: lead.location ?? null,
            },
          });
          clientId = client.id;
        }
      }

      const projectRefNo = await IdGeneratorService.generate("PROJ");
      const projectTitle = `${lead.clientName} - Interior Execution`;

      const approvedQuote = lead.quotations.find((q) => q.status === "APPROVED" || q.status === "ACCEPTED" || q.status === "SENT") || (lead.quotations.length > 0 ? lead.quotations[0] : null);
      const contractValue = approvedQuote ? approvedQuote.totalAmount : (lead.estimatedBudget || 0.0);

      let resolvedHandoverDate: Date | null = null;
      if (approvedQuote?.clientSnapshot) {
        try {
          const snap = JSON.parse(approvedQuote.clientSnapshot);
          if (snap.handoverDate) {
            const d = new Date(snap.handoverDate);
            if (!isNaN(d.getTime())) resolvedHandoverDate = d;
          }
        } catch {}
      }

      const project = await tx.project.create({
        data: {
          referenceNo: projectRefNo,
          leadId: lead.id,
          title: projectTitle,
          clientId: clientId,
          stage: "CONFIRMATION_FEE_PAID",
          propertyTypeKey: lead.propertyTypeKey || "APARTMENT_INTERIOR",
          contractValue: contractValue,
          revisedBudget: contractValue,
          siteAddress: lead.location || null,
          city: lead.location ? lead.location.split(",")[0]?.trim() : null,
          notes: lead.notes ? lead.notes.replace(/\[WEBSITE_ENQUIRY_METADATA\]:[\s\S]*/gi, "").trim() || null : null,
          description: lead.requirement || `Interior execution project converted from Lead ${lead.referenceNo}`,
          approvedQuotationId: approvedQuote?.id || null,
          handoverDate: resolvedHandoverDate,
          targetCompletionDate: resolvedHandoverDate,
          handoverStatus: resolvedHandoverDate ? "SCHEDULED" : "PENDING",
        },
      });

      if (lead.quotations && lead.quotations.length > 0) {
        await tx.quotation.updateMany({
          where: { leadId: lead.id },
          data: {
            projectId: project.id,
            clientId: clientId,
          },
        });
      }

      // Link any payments recorded during lead stage to the project
      await tx.clientPayment.updateMany({
        where: { leadId: lead.id, projectId: null },
        data: {
          projectId: project.id,
          clientId: clientId,
        },
      });

      // Link any GST invoices to the project
      const quotationIds = (lead.quotations || []).map((q) => q.id);
      if (quotationIds.length > 0) {
        await tx.gstInvoice.updateMany({
          where: {
            quotationId: { in: quotationIds },
            projectId: null,
          },
          data: {
            projectId: project.id,
            clientId: clientId,
          },
        });
      }

      // Link documents and tasks from lead to project
      await tx.document.updateMany({
        where: { leadId: lead.id, projectId: null },
        data: { projectId: project.id },
      });

      await tx.task.updateMany({
        where: { leadId: lead.id, projectId: null },
        data: { projectId: project.id },
      });

      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          stage: "PROJECT_CREATED",
        },
      });

      await tx.leadStageHistory.create({
        data: {
          leadId: lead.id,
          fromStage: lead.stage,
          toStage: "PROJECT_CREATED",
          changedById: userId || null,
          notes: `Converted to Project #${project.referenceNo} (${project.title})`,
        },
      });

      const finalClient = clientId ? await tx.client.findUnique({ where: { id: clientId } }) : null;
      return { client: finalClient, project };
    });

    await AuditService.logEvent({
      userId,
      action: "LEAD_CONVERTED_TO_PROJECT",
      entityType: "Lead",
      entityId: lead.id,
      newValues: { projectId: result.project.id, referenceNo: result.project.referenceNo },
    });

    await ActivityService.record({
      userId,
      entityType: "Project",
      entityId: result.project.id,
      type: "STATUS_CHANGE",
      title: `Project Initialized from Lead ${lead.referenceNo}`,
    });

    return result;
  }
}
