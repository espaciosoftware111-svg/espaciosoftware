import { db } from "@/lib/db";

export interface RecordActivityParams {
  userId?: string | null;
  entityType: string;
  entityId: string;
  type: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export class ActivityService {
  public static async record(params: RecordActivityParams) {
    try {
      let validUserId: string | null = null;
      if (params.userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.userId)) {
        validUserId = params.userId;
      }
      return await db.activityLog.create({
        data: {
          userId: validUserId,
          entityType: params.entityType,
          entityId: params.entityId,
          type: params.type,
          title: params.title,
          description: params.description || null,
          metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        },
      });
    } catch (e) {
      console.error("Failed to log activity:", e);
      return null;
    }
  }

  public static async getTimeline(entityType: string, entityId: string, limit: number = 50) {
    return db.activityLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
  }
}
