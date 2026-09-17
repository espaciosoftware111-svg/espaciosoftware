import { describe, it, expect, beforeAll } from "vitest";
import { db } from "@/lib/db";
import { DynamicAlertService } from "@/modules/notifications/dynamic-alert.service";
import { NotificationService } from "@/modules/notifications/notification.service";

describe("NOTIFICATIONS & ALERTS — Strict Dynamic System Integration Suite", () => {
  let testUserId: string;

  beforeAll(async () => {
    // Find or use superadmin user
    const admin = await db.user.findFirst({
      where: { accessLevel: "SUPER_ADMIN" },
    });
    if (admin) {
      testUserId = admin.id;
    } else {
      const anyUser = await db.user.findFirst();
      testUserId = anyUser?.id || "test-user-id";
    }
  });

  it("1. Dynamically syncs alerts without throwing errors", async () => {
    const result = await DynamicAlertService.syncDynamicAlerts(testUserId);
    expect(result).toBeDefined();
    expect(typeof result.generatedCount).toBe("number");
    expect(typeof result.resolvedCount).toBe("number");
    expect(typeof result.activeAlertsCount).toBe("number");
  }, 60000);

  it("2. Deduplication: Running sync back-to-back produces 0 duplicate notifications", async () => {
    // First sync
    const firstSync = await DynamicAlertService.syncDynamicAlerts(testUserId);
    expect(firstSync).toBeDefined();

    // Immediate second sync
    const secondSync = await DynamicAlertService.syncDynamicAlerts(testUserId);
    expect(secondSync.generatedCount).toBe(0); // Zero duplicate notifications created
  }, 60000);

  it("3. Retrieves notifications with extended multi-dimensional filtering", async () => {
    const res = await NotificationService.getUserNotifications({
      userId: testUserId,
      category: "ALL",
      status: "ALL",
      priority: "ALL",
      page: 1,
      limit: 20,
    });

    expect(res).toBeDefined();
    expect(typeof res.totalCount).toBe("number");
    expect(typeof res.unreadCount).toBe("number");
    expect(typeof res.urgentCount).toBe("number");
    expect(typeof res.resolvedCount).toBe("number");
    expect(Array.isArray(res.notifications)).toBe(true);
  });

  it("4. Creates and marks an individual notification as read", async () => {
    const notif = await NotificationService.create({
      userId: testUserId,
      eventId: `test_event_${Date.now()}`,
      type: "FOLLOW_UP_DUE",
      category: "LEADS",
      priority: "HIGH",
      title: "TEST FOLLOW-UP DUE",
      message: "Test message for follow-up verification.",
      actionUrl: "/leads",
    });

    expect(notif.isRead).toBe(false);

    const updated = await NotificationService.markAsRead(notif.id, testUserId);
    expect(updated.isRead).toBe(true);
    expect(updated.readAt).toBeDefined();
  });

  it("5. Resolves an active alert and confirms dismissed status", async () => {
    const notif = await NotificationService.create({
      userId: testUserId,
      eventId: `test_qc_alert_${Date.now()}`,
      type: "QUALITY_CHECK_PENDING",
      category: "PROJECTS",
      priority: "URGENT",
      title: "TEST QC PENDING",
      message: "Test project quality check pending.",
      actionUrl: "/projects",
    });

    const resolved = await NotificationService.resolveAlert(notif.id, testUserId);
    expect(resolved.isRead).toBe(true);
    expect(resolved.dismissedAt).toBeDefined();

    // Verify it appears under RESOLVED status filter
    const resolvedList = await NotificationService.getUserNotifications({
      userId: testUserId,
      status: "RESOLVED",
    });

    const found = resolvedList.notifications.some((n) => n.id === notif.id);
    expect(found).toBe(true);
  });

  it("6. Mark all as read updates all unread notifications to read", async () => {
    // Create 2 unread notifications
    await NotificationService.create({
      userId: testUserId,
      eventId: `test_bulk_1_${Date.now()}`,
      type: "CLIENT_PAYMENT_RECORDED",
      category: "PAYMENTS",
      priority: "NORMAL",
      title: "TEST PAYMENT 1",
      message: "Test payment 1 message",
    });

    await NotificationService.create({
      userId: testUserId,
      eventId: `test_bulk_2_${Date.now()}`,
      type: "CLIENT_PAYMENT_RECORDED",
      category: "PAYMENTS",
      priority: "NORMAL",
      title: "TEST PAYMENT 2",
      message: "Test payment 2 message",
    });

    await NotificationService.markAllAsRead(testUserId);

    const check = await NotificationService.getUserNotifications({
      userId: testUserId,
      status: "UNREAD",
    });

    expect(check.unreadCount).toBe(0);
  });
});
