import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";

export interface CreateNotificationParams {
  userId: string;
  type: string;
  category?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  eventId?: string;
  actorId?: string;
  expiresAt?: Date;
}

export interface GetNotificationsFilter {
  userId: string;
  category?: string;
  priority?: string;
  status?: string; // "ALL" | "UNREAD" | "READ" | "ACTIVE" | "RESOLVED"
  isRead?: boolean;
  dateRange?: string; // "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "LAST_30_DAYS" | "CUSTOM"
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class NotificationService {
  public static async create(params: CreateNotificationParams) {
    if (params.eventId) {
      const existing = await db.notification.findFirst({
        where: {
          userId: params.userId,
          eventId: params.eventId,
        },
      });
      if (existing) {
        return existing;
      }
    }

    return db.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        category: params.category ?? "SYSTEM",
        priority: params.priority ?? "NORMAL",
        title: params.title,
        message: params.message,
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
        actionUrl: params.actionUrl ?? null,
        eventId: params.eventId ?? null,
        actorId: params.actorId ?? null,
        expiresAt: params.expiresAt ?? null,
      },
    });
  }

  public static async notifyAdmins(params: Omit<CreateNotificationParams, "userId">) {
    const adminUsers = await db.user.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { accessLevel: "ADMIN" },
          { userRoles: { some: { role: { name: "ADMIN" } } } },
        ],
      },
      select: { id: true },
    });

    return Promise.all(
      adminUsers.map((admin) =>
        this.create({
          ...params,
          userId: admin.id,
        })
      )
    );
  }

  public static async getUserNotifications(filter: GetNotificationsFilter) {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.min(100, Math.max(1, filter.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = {
      userId: filter.userId,
    };

    // Status filter
    if (filter.status === "RESOLVED") {
      where.dismissedAt = { not: null };
    } else if (filter.status === "ACTIVE") {
      where.dismissedAt = null;
      where.priority = { in: ["HIGH", "URGENT"] };
    } else if (filter.status === "UNREAD") {
      where.dismissedAt = null;
      where.isRead = false;
    } else if (filter.status === "READ") {
      where.dismissedAt = null;
      where.isRead = true;
    } else {
      where.dismissedAt = null;
      if (typeof filter.isRead === "boolean") {
        where.isRead = filter.isRead;
      }
    }

    // Category filter
    if (filter.category && filter.category !== "ALL") {
      where.category = filter.category;
    }

    // Priority filter
    if (filter.priority && filter.priority !== "ALL") {
      where.priority = filter.priority;
    }

    // Date Range filter
    const now = new Date();
    if (filter.dateRange === "TODAY") {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      where.createdAt = { gte: todayStart };
    } else if (filter.dateRange === "YESTERDAY") {
      const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      where.createdAt = { gte: yesterdayStart, lte: yesterdayEnd };
    } else if (filter.dateRange === "LAST_7_DAYS" || filter.dateRange === "7D") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: sevenDaysAgo };
    } else if (filter.dateRange === "LAST_30_DAYS" || filter.dateRange === "30D") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: thirtyDaysAgo };
    } else if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = new Date(filter.startDate);
      if (filter.endDate) where.createdAt.lte = new Date(filter.endDate);
    }

    // Fulltext search across all identifiers and keywords
    if (filter.search && filter.search.trim()) {
      const query = filter.search.trim();
      where.OR = [
        { title: { contains: query } },
        { message: { contains: query } },
        { type: { contains: query } },
        { entityType: { contains: query } },
        { entityId: { contains: query } },
        { actionUrl: { contains: query } },
      ];
    }

    const [totalCount, unreadCount, urgentCount, resolvedCount, notifications] = await Promise.all([
      db.notification.count({ where }),
      db.notification.count({ where: { userId: filter.userId, isRead: false, dismissedAt: null } }),
      db.notification.count({ where: { userId: filter.userId, priority: { in: ["HIGH", "URGENT"] }, isRead: false, dismissedAt: null } }),
      db.notification.count({ where: { userId: filter.userId, dismissedAt: { not: null } } }),
      db.notification.findMany({
        where,
        orderBy: [{ isRead: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
    ]);

    return {
      totalCount,
      unreadCount,
      urgentCount,
      resolvedCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      notifications,
    };
  }

  public static async resolveAlert(notificationId: string, userId: string) {
    const notif = await db.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notif) {
      throw new NotFoundError("Notification not found");
    }

    return db.notification.update({
      where: { id: notificationId },
      data: { isRead: true, dismissedAt: new Date() },
    });
  }

  public static async markAsRead(notificationId: string, userId: string) {
    const notif = await db.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notif) {
      throw new NotFoundError("Notification not found");
    }

    return db.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  public static async markAllAsRead(userId: string, category?: string) {
    const where: any = { userId, isRead: false };
    if (category && category !== "ALL") {
      where.category = category;
    }

    return db.notification.updateMany({
      where,
      data: { isRead: true, readAt: new Date() },
    });
  }

  public static async dismiss(notificationId: string, userId: string) {
    const notif = await db.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notif) {
      throw new NotFoundError("Notification not found");
    }

    return db.notification.update({
      where: { id: notificationId },
      data: { dismissedAt: new Date() },
    });
  }

  public static async getUserPreferences(userId: string) {
    return db.notificationPreference.findMany({
      where: { userId },
    });
  }

  public static async updatePreference(userId: string, category: string, channel: string, isEnabled: boolean) {
    return db.notificationPreference.upsert({
      where: {
        userId_category_channel: {
          userId,
          category,
          channel,
        },
      },
      create: {
        userId,
        category,
        channel,
        isEnabled,
      },
      update: {
        isEnabled,
      },
    });
  }

  public static async getNotificationRules() {
    return db.notificationRule.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  public static async upsertNotificationRule(data: {
    id?: string;
    name: string;
    eventType: string;
    category?: string;
    priority?: string;
    recipientType?: string;
    targetRole?: string;
    targetUserId?: string;
    channels?: string[];
    templateTitle: string;
    templateBody: string;
    isEnabled?: boolean;
    isSystemMandatory?: boolean;
    conditionJson?: string;
  }) {
    const channelsJson = JSON.stringify(data.channels ?? ["IN_APP"]);

    if (data.id) {
      return db.notificationRule.update({
        where: { id: data.id },
        data: {
          name: data.name,
          eventType: data.eventType,
          category: data.category ?? "SYSTEM",
          priority: data.priority ?? "NORMAL",
          recipientType: data.recipientType ?? "ROLE",
          targetRole: data.targetRole ?? null,
          targetUserId: data.targetUserId ?? null,
          channels: channelsJson,
          templateTitle: data.templateTitle,
          templateBody: data.templateBody,
          isEnabled: data.isEnabled ?? true,
          isSystemMandatory: data.isSystemMandatory ?? false,
          conditionJson: data.conditionJson ?? null,
        },
      });
    }

    return db.notificationRule.create({
      data: {
        name: data.name,
        eventType: data.eventType,
        category: data.category ?? "SYSTEM",
        priority: data.priority ?? "NORMAL",
        recipientType: data.recipientType ?? "ROLE",
        targetRole: data.targetRole ?? null,
        targetUserId: data.targetUserId ?? null,
        channels: channelsJson,
        templateTitle: data.templateTitle,
        templateBody: data.templateBody,
        isEnabled: data.isEnabled ?? true,
        isSystemMandatory: data.isSystemMandatory ?? false,
        conditionJson: data.conditionJson ?? null,
      },
    });
  }
}
