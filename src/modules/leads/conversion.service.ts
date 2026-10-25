import { db } from "@/lib/db";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { IdGeneratorService } from "@/lib/id-generator";
import { AuditService } from "../audit/audit.service";
import { ActivityService } from "../activity/activity.service";

export class LeadConversionService {
  public static async convertLeadToProject(leadId: string, userId?: string) {
    const lead = await db.lead.findUnique({
      where: { id: leadId },
      include: {
        client: true,
        project: true,
        quotations: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!lead) {
      throw new NotFoundError("Lead not found");
    }

    if (lead.project) {
      throw new ConflictError(
        `Lead ${lead.referenceNo} has already been converted into Project #${lead.project.referenceNo}.`
      );
    }

    // Client Resolution: Check existing client via relation or contact phone
    let clientId: string | null = lead.client?.id || lead.clientId || null;
    let existingClientId: string | null = null;
    let existingClientHasLead = false;

    if (!clientId && lead.phone) {
      const cleanPhone = lead.phone.trim();
      const phoneDigits = cleanPhone.replace(/\D/g, "");

      // Look up existing client by exact phone or digit match
      const existingClient = await db.client.findFirst({
        where: {
          OR: [
            { phone: cleanPhone },
            ...(phoneDigits.length >= 10
              ? [
                  { phone: phoneDigits },
                  { phone: `+91${phoneDigits.slice(-10)}` },
                  { phone: phoneDigits.slice(-10) },
                ]
              : []),
          ],
        },
        select: { id: true, leadId: true },
      });

      if (existingClient) {
        existingClientId = existingClient.id;
        clientId = existingClient.id;
        existingClientHasLead = !!existingClient.leadId;
      }
    }

    let clientRefNo: string | null = null;
    if (!clientId && !existingClientId) {
      clientRefNo = await IdGeneratorService.generate("CLI");
    }

    const projectRefNo = await IdGeneratorService.generate("PROJ");
    const projectTitle = `${lead.clientName} - Interior Execution`;

    const approvedQuote =
      lead.quotations.find(
        (q) => q.status === "APPROVED" || q.status === "ACCEPTED" || q.status === "SENT"
      ) || (lead.quotations.length > 0 ? lead.quotations[0] : null);

    const rawContractVal = approvedQuote ? approvedQuote.totalAmount : (lead.estimatedBudget || 0.0);
    const contractValue =
      typeof rawContractVal === "number" && !isNaN(rawContractVal)
        ? rawContractVal
        : parseFloat(String(rawContractVal)) || 0.0;

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

    const quotationIds = (lead.quotations || []).map((q) => q.id);

    const result = await db.$transaction(
      async (tx) => {
        // 1. Resolve or Create Client
        if (!clientId) {
          if (existingClientId) {
            clientId = existingClientId;
            // Only attach unique leadId if the existing client does not already hold another lead
            if (!existingClientHasLead) {
              await tx.client.update({
                where: { id: existingClientId },
                data: { leadId: lead.id },
              });
            }
          } else {
            try {
              const client = await tx.client.create({
                data: {
                  referenceNo: clientRefNo!,
                  leadId: lead.id,
                  fullName: lead.clientName,
                  phone: lead.phone.trim(),
                  email: lead.email?.trim() || null,
                  address: lead.location || null,
                },
              });
              clientId = client.id;
            } catch (err: any) {
              // If phone constraint collision happens, retrieve that existing client
              if (err?.code === "P2002") {
                const foundClient = await tx.client.findFirst({
                  where: { phone: lead.phone.trim() },
                  select: { id: true, leadId: true },
                });
                if (foundClient) {
                  clientId = foundClient.id;
                  if (!foundClient.leadId) {
                    await tx.client.update({
                      where: { id: foundClient.id },
                      data: { leadId: lead.id },
                    });
                  }
                } else {
                  throw err;
                }
              } else {
                throw err;
              }
            }
          }
        } else {
          // Client already identified: set leadId if null
          const currClient = await tx.client.findUnique({
            where: { id: clientId },
            select: { leadId: true },
          });
          if (currClient && !currClient.leadId) {
            await tx.client.update({
              where: { id: clientId },
              data: { leadId: lead.id },
            });
          }
        }

        // 2. Create Execution Project
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
            notes: lead.notes
              ? lead.notes.replace(/\[WEBSITE_ENQUIRY_METADATA\]:[\s\S]*/gi, "").trim() || null
              : null,
            description:
              lead.requirement || `Interior execution project converted from Lead ${lead.referenceNo}`,
            approvedQuotationId: approvedQuote?.id || null,
            handoverDate: resolvedHandoverDate,
            targetCompletionDate: resolvedHandoverDate,
            handoverStatus: resolvedHandoverDate ? "SCHEDULED" : "PENDING",
          },
        });

        // 3. Link All Related Records (Quotations, Payments, Invoices, Documents, Tasks)
        await Promise.all([
          // Update Quotations
          lead.quotations && lead.quotations.length > 0
            ? tx.quotation.updateMany({
                where: { leadId: lead.id },
                data: {
                  projectId: project.id,
                  clientId: clientId,
                },
              })
            : Promise.resolve(),

          // If there is an approved quote in SENT / READY_TO_SEND / DRAFT status, lock it to APPROVED
          approvedQuote && approvedQuote.status !== "APPROVED" && approvedQuote.status !== "ACCEPTED"
            ? tx.quotation.update({
                where: { id: approvedQuote.id },
                data: {
                  status: "APPROVED",
                  approvedAt: new Date(),
                  projectId: project.id,
                  clientId: clientId,
                },
              })
            : Promise.resolve(),

          // Update Client Payments
          tx.clientPayment.updateMany({
            where: { leadId: lead.id, projectId: null },
            data: {
              projectId: project.id,
              clientId: clientId,
            },
          }),

          // Update GST Invoices
          quotationIds.length > 0
            ? tx.gstInvoice.updateMany({
                where: {
                  quotationId: { in: quotationIds },
                  projectId: null,
                },
                data: {
                  projectId: project.id,
                  clientId: clientId,
                },
              })
            : Promise.resolve(),

          // Update Documents
          tx.document.updateMany({
            where: { leadId: lead.id, projectId: null },
            data: {
              projectId: project.id,
              clientId: clientId,
            },
          }),

          // Update Tasks
          tx.task.updateMany({
            where: { leadId: lead.id, projectId: null },
            data: {
              projectId: project.id,
              clientId: clientId,
            },
          }),
        ]);

        // 4. Update Lead to PROJECT_CREATED and bind clientId
        await tx.lead.update({
          where: { id: lead.id },
          data: {
            stage: "PROJECT_CREATED",
            clientId: clientId,
          },
        });

        // 5. Record Stage History
        if (lead.stage !== "WON" && lead.stage !== "PROJECT_CREATED") {
          await tx.leadStageHistory.create({
            data: {
              leadId: lead.id,
              fromStage: lead.stage,
              toStage: "WON",
              changedById: userId || null,
              notes: "Lead won and confirmed for project execution",
            },
          });
        }

        await tx.leadStageHistory.create({
          data: {
            leadId: lead.id,
            fromStage: lead.stage === "WON" ? "WON" : lead.stage,
            toStage: "PROJECT_CREATED",
            changedById: userId || null,
            notes: `Converted to Project #${project.referenceNo} (${project.title})`,
          },
        });

        const finalClient = clientId ? await tx.client.findUnique({ where: { id: clientId } }) : null;
        return { client: finalClient, project };
      },
      {
        maxWait: 15000,
        timeout: 60000,
      }
    );

    // Audit and Activity Logging outside of database transaction
    try {
      await AuditService.logEvent({
        userId,
        action: "LEAD_CONVERTED_TO_PROJECT",
        entityType: "Lead",
        entityId: lead.id,
        newValues: { projectId: result.project.id, referenceNo: result.project.referenceNo },
      });
    } catch (auditErr) {
      console.error("[Conversion] Non-fatal audit log warning:", auditErr);
    }

    try {
      await ActivityService.record({
        userId,
        entityType: "Project",
        entityId: result.project.id,
        type: "STATUS_CHANGE",
        title: `Project Initialized from Lead ${lead.referenceNo}`,
      });
    } catch (activityErr) {
      console.error("[Conversion] Non-fatal activity log warning:", activityErr);
    }

    return result;
  }
}
