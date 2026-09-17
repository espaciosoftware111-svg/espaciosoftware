# ESPACIO ERP — Component & Module Structure Reference

This document provides a component-to-module cross reference for rapid navigation across the codebase.

---

## 🗺️ Module Architecture & Component Map

| Functional Domain | Page Route | REST API Route | Service Module | Primary UI Components | Zod Validator Schema |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Calendar** | `/calendar` | `/api/v1/calendar/events` | `src/modules/calendar/calendar.service.ts` | `src/app/(dashboard)/calendar/page.tsx` | `calendar.schema.ts` |
| **Material Leads** | `/material-leads` | `/api/v1/material-leads/*` | `src/modules/material-leads/material-lead.service.ts` | `src/components/material-leads/*` | `material-lead.schema.ts` |
| **Interior Leads** | `/leads` | `/api/v1/leads/*` | `src/modules/leads/lead.service.ts` | `src/components/leads/*` | `lead.schema.ts` |
| **Projects** | `/projects` | `/api/v1/projects/*` | `src/modules/projects/project.service.ts` | `src/components/projects/*` | `project.schema.ts` |
| **Quotations** | `/quotations` | `/api/v1/quotations/*` | `src/modules/quotations/quotation.service.ts` | `src/components/quotations/*` | `quotation.schema.ts` |
| **Procurement & POs** | `/procurement/*` | `/api/v1/procurement/*` | `src/modules/procurement/procurement.service.ts` | `src/components/procurement/*` | `procurement.schema.ts` |
| **Materials Order** | `/procurement/materials-order` | `/api/v1/procurement/materials-order/*` | `src/modules/procurement/materials-order.service.ts` | `src/components/procurement/materials-order-detail-drawer.tsx` | `materials-order.schema.ts` |
| **Clients (360°)** | `/clients` | `/api/v1/clients/*` | `src/modules/clients/client.service.ts` | `src/components/clients/*` | `client.schema.ts` |
| **Payments** | `/finance/payments` | `/api/v1/finance/payments/*` | `src/modules/payments/payment.service.ts` | `src/components/payments/*` | `payment.schema.ts` |
| **Expenses** | `/finance/expenses` | `/api/v1/finance/expenses/*` | `src/modules/expenses/expense.service.ts` | `src/components/expenses/*` | `expense.schema.ts` |
| **Petty Cash** | `/finance/petty-cash` | `/api/v1/finance/petty-cash/*` | `src/modules/petty-cash/petty-cash.service.ts` | `src/components/petty-cash/*` | `petty-cash.schema.ts` |
| **Inventory & Stock** | `/inventory` | `/api/v1/inventory/*` | `src/modules/inventory/inventory.service.ts` | `src/components/inventory/*` | `inventory.schema.ts` |
| **Tasks & To-Dos** | `/tasks` | `/api/v1/tasks/*` | `src/modules/tasks/task.service.ts` | `src/app/(dashboard)/tasks/*` | `task.schema.ts` |
| **Notifications & Alerts** | `/notifications` | `/api/v1/notifications/*` | `src/modules/notifications/notification.service.ts` | `src/app/(dashboard)/notifications/*` | `notification.schema.ts` |
| **Settings & RBAC** | `/settings/*` | `/api/v1/settings/*` | `src/modules/settings/settings.service.ts` | `src/components/settings/*` | `auth.schema.ts` |
| **Reports & BI** | `/reports` | `/api/v1/reports/*` | `src/modules/reports/report.service.ts` | `src/components/reports/*` | — |

---

## 🏛️ Core Technical Principles

1. **Strict Type Safety**: All TypeScript models are synchronized with Prisma database schemas.
2. **Zero Hardcoded Data**: All screens, KPIs, drawers, and modal workflows pull live records with exponential backoff database reconnects (`withDbRetry`).
3. **Audit Trail**: Every critical state change (status updates, stage changes, approvals, payments) emits structured audit and activity events.
