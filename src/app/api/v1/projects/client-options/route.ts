import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/response";
import { AuthError, ValidationError } from "@/lib/errors";
import { IdGeneratorService } from "@/lib/id-generator";
import { AuditService } from "@/modules/audit/audit.service";

export interface ClientOptionItem {
  id: string;
  clientId: string | null;
  leadId: string | null;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  propertyTypeKey: string | null;
  estimatedBudget: number | null;
  type: "CLIENT" | "LEAD";
  referenceNo: string;
}

export async function GET(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "projects:read", "GET_PROJECT_CLIENT_OPTIONS");

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("query") || "").trim().toLowerCase();

    // 1. Fetch Clients
    const clients = await db.client.findMany({
      select: {
        id: true,
        referenceNo: true,
        fullName: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    // 2. Fetch Leads
    const leads = await db.lead.findMany({
      select: {
        id: true,
        referenceNo: true,
        clientName: true,
        phone: true,
        email: true,
        location: true,
        propertyTypeKey: true,
        estimatedBudget: true,
        clientId: true,
        stage: true,
        client: {
          select: {
            id: true,
            referenceNo: true,
            fullName: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    // Build client phone lookup map for fast linkage
    const clientPhoneMap = new Map<string, string>();
    for (const c of clients) {
      const cleanPhone = c.phone.replace(/[^0-9]/g, "");
      if (cleanPhone) {
        clientPhoneMap.set(cleanPhone, c.id);
      }
    }

    const options: ClientOptionItem[] = [];

    // Add existing clients
    for (const c of clients) {
      options.push({
        id: `client-${c.id}`,
        clientId: c.id,
        leadId: null,
        name: c.fullName,
        phone: c.phone,
        email: c.email || null,
        address: c.address || null,
        city: c.city || null,
        state: c.state || null,
        postalCode: c.postalCode || null,
        propertyTypeKey: null,
        estimatedBudget: null,
        type: "CLIENT",
        referenceNo: c.referenceNo,
      });
    }

    // Add leads (including material leads and standard leads)
    for (const l of leads) {
      const cleanLeadPhone = l.phone.replace(/[^0-9]/g, "");
      const matchedClientId = l.clientId || (cleanLeadPhone ? clientPhoneMap.get(cleanLeadPhone) : null) || null;

      options.push({
        id: `lead-${l.id}`,
        clientId: matchedClientId,
        leadId: l.id,
        name: l.clientName,
        phone: l.phone,
        email: l.email || null,
        address: l.location || null,
        city: null,
        state: null,
        postalCode: null,
        propertyTypeKey: l.propertyTypeKey || null,
        estimatedBudget: l.estimatedBudget || null,
        type: "LEAD",
        referenceNo: l.referenceNo,
      });
    }

    // Filter if query param is present
    let filtered = options;
    if (query) {
      filtered = options.filter(
        (opt) =>
          opt.name.toLowerCase().includes(query) ||
          opt.phone.replace(/[^0-9]/g, "").includes(query.replace(/[^0-9]/g, "")) ||
          opt.referenceNo.toLowerCase().includes(query)
      );
    }

    return successResponse(filtered);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await AuthService.getSessionFromCookies();
    if (!session) throw new AuthError();

    await RbacService.authorize(session.userId, "projects:write", "CREATE_OR_RESOLVE_CLIENT");

    const body = await req.json();

    // Case 1: Ensure Client for a Lead
    if (body.action === "ensure_lead_client" && body.leadId) {
      const lead = await db.lead.findUnique({
        where: { id: body.leadId },
        include: { client: true },
      });

      if (!lead) {
        throw new ValidationError("Lead not found");
      }

      if (lead.client) {
        return successResponse(lead.client);
      }

      if (lead.clientId) {
        const client = await db.client.findUnique({ where: { id: lead.clientId } });
        if (client) return successResponse(client);
      }

      // Check if client with matching phone exists
      const cleanPhone = lead.phone.trim();
      const existingClient = await db.client.findFirst({
        where: { phone: cleanPhone },
      });

      if (existingClient) {
        await db.lead.update({
          where: { id: lead.id },
          data: { clientId: existingClient.id },
        });
        return successResponse(existingClient);
      }

      // Create new client from lead
      const clientRefNo = await IdGeneratorService.generate("CLI");
      const newClient = await db.client.create({
        data: {
          referenceNo: clientRefNo,
          leadId: lead.id,
          fullName: lead.clientName,
          phone: lead.phone,
          email: lead.email ?? null,
          address: lead.location ?? null,
          status: "ACTIVE",
          clientType: "INDIVIDUAL",
        },
      });

      await db.lead.update({
        where: { id: lead.id },
        data: { clientId: newClient.id },
      });

      await AuditService.logEvent({
        userId: session.userId,
        action: "CLIENT_CREATED_FROM_LEAD",
        entityType: "Client",
        entityId: newClient.id,
        newValues: newClient as unknown as Record<string, unknown>,
      });

      return successResponse(newClient, undefined, 201);
    }

    // Case 2: Manually Add New Client
    const fullName = (body.fullName || "").trim();
    const phone = (body.phone || "").trim();
    const email = (body.email || "").trim() || null;
    const address = (body.address || "").trim() || null;

    if (!fullName || fullName.length < 2) {
      throw new ValidationError("Client full name must be at least 2 characters");
    }

    if (!phone || phone.length < 7) {
      throw new ValidationError("Valid phone number is required (min 7 digits)");
    }

    // Check if client already exists with this phone
    const existing = await db.client.findFirst({
      where: { phone },
    });

    if (existing) {
      return successResponse(
        {
          ...existing,
          alreadyExisted: true,
        },
        { message: `Client with phone ${phone} already exists (${existing.fullName})` }
      );
    }

    // Create client
    const referenceNo = await IdGeneratorService.generate("CLI");
    const client = await db.client.create({
      data: {
        referenceNo,
        fullName,
        phone,
        email,
        address,
        clientType: body.clientType || "INDIVIDUAL",
        status: "ACTIVE",
      },
    });

    await AuditService.logEvent({
      userId: session.userId,
      action: "CLIENT_CREATED_MANUALLY",
      entityType: "Client",
      entityId: client.id,
      newValues: client as unknown as Record<string, unknown>,
    });

    return successResponse(
      {
        ...client,
        alreadyExisted: false,
      },
      undefined,
      201
    );
  } catch (err) {
    return errorResponse(err);
  }
}
