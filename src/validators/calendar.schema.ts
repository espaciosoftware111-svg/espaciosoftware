import { z } from "zod";

export const CALENDAR_CATEGORIES = [
  "ALL",
  "FOLLOW_UPS",
  "SITE_VISITS",
  "TASKS",
  "PROJECT_MILESTONES",
  "DELIVERIES",
  "PAYMENTS",
  "REMINDERS",
] as const;

export const calendarFilterSchema = z.object({
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  category: z.string().optional().default("ALL"),
  status: z.string().optional().default("ALL"),
  search: z.string().optional(),
  userId: z.string().optional(),
});

export type CalendarFilterInput = z.infer<typeof calendarFilterSchema>;

export const createCalendarEventSchema = z.object({
  title: z.string().min(2, "Event title is required"),
  eventType: z.enum(["TASK", "LEAD_FOLLOW_UP", "SITE_VISIT", "MEETING", "REMINDER"]).default("TASK"),
  date: z.string().or(z.date()),
  time: z.string().optional().nullable(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  notes: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
});

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;

