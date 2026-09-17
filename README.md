# ESPACIO ERP — Enterprise Architecture & Project Directory Guide

ESPACIO ERP is a high-performance, enterprise-grade interior and modular execution management system built with Next.js App Router, TypeScript, Prisma, and PostgreSQL.

---

## 📁 Repository Directory Hierarchy

```
espaciosoftware/
├── .env.example                     # Environment variable blueprint
├── AGENTS.md                        # Strict development guidelines and constraints
├── README.md                        # Master repository overview & directory map
├── next.config.mjs                  # Next.js build & runtime configuration
├── package.json                     # Dependencies and build scripts
├── postcss.config.mjs               # PostCSS styling processor
├── tailwind.config.ts               # ESPACIO Design System tokens & palette
├── tsconfig.json                    # Strict TypeScript compiler options
├── vitest.config.ts                 # Vitest automated testing suite config
│
├── 📂 src/                          # Application Source Code
│   ├── 📂 app/                      # Next.js App Router (Pages, Layouts & REST APIs)
│   │   ├── 📂 (dashboard)/          # Authenticated ERP Workspaces
│   │   │   ├── 📂 audit-logs/       # System audit & compliance trail
│   │   │   ├── 📂 calendar/         # Central calendar (site visits, tasks, deliveries, follow-ups)
│   │   │   ├── 📂 clients/          # Client 360° profile & CRM directory
│   │   │   ├── 📂 dashboard/        # Executive overview & dynamic KPI widgets
│   │   │   ├── 📂 documents/        # Centralized file repository & versioning
│   │   │   ├── 📂 employees/        # HR & staff management
│   │   │   ├── 📂 expenses/         # Project & operational expense management
│   │   │   ├── 📂 finance/          # Accounts, ledger, invoicing & reconciliation
│   │   │   ├── 📂 inventory/        # Warehouses, stock movements & counts
│   │   │   ├── 📂 leads/            # Interior & Architectural CRM Leads Pipeline
│   │   │   ├── 📂 material-leads/   # Standalone Material Supply Leads Pipeline
│   │   │   ├── 📂 notifications/    # Alerts, reminders & system notifications
│   │   │   ├── 📂 payments/         # Client payments & receipts
│   │   │   ├── 📂 procurement/      # Vendors, POs, Materials Order & GRNs
│   │   │   ├── 📂 projects/         # Interior projects, milestones & gantt execution
│   │   │   ├── 📂 quotations/       # Multi-room quote builder & version studio
│   │   │   ├── 📂 reports/          # Financial, operational & conversion reports
│   │   │   ├── 📂 search/           # Global enterprise search
│   │   │   ├── 📂 settings/         # Master config, RBAC, business & stages
│   │   │   ├── 📂 tasks/            # Team to-dos & operational board
│   │   │   └── layout.tsx           # Dashboard authenticated wrapper
│   │   │
│   │   ├── 📂 api/v1/               # Standardized REST API Handlers
│   │   │   ├── 📂 auth/             # Login, session, token verification
│   │   │   ├── 📂 calendar/         # Calendar event aggregation & scheduling
│   │   │   ├── 📂 clients/          # Client CRUD & 360° endpoints
│   │   │   ├── 📂 leads/            # Lead intake, status, site visits, follow-ups
│   │   │   ├── 📂 material-leads/   # Material lead workflow & vendor dispatch
│   │   │   ├── 📂 procurement/      # POs, vendor requests & 3-way matching
│   │   │   ├── 📂 projects/         # Project stages, handovers & members
│   │   │   ├── 📂 quotations/       # Quotation generation, approvals & PDF
│   │   │   ├── 📂 finance/          # Payments, invoices & ledger entries
│   │   │   ├── 📂 tasks/            # Task management & assignment
│   │   │   └── 📂 settings/         # System settings & RBAC permissions
│   │   │
│   │   ├── 📂 catalog-enquiry/      # Public portal: Catalog unlock & lead intake
│   │   ├── 📂 enquiry/              # Public portal: Client design consultation
│   │   ├── 📂 login/                # Authentication login screen
│   │   ├── globals.css              # Global design system styles & typography
│   │   └── layout.tsx               # Root application layout & font loader
│   │
│   ├── 📂 components/               # Reusable UI & Domain Components
│   │   ├── 📂 ui/                   # Design system primitives (Button, Modal, Card, Table)
│   │   ├── 📂 shell/                # App Shell (Sidebar, TopBar, Navigation, User Menu)
│   │   ├── 📂 clients/              # Client workspace, 360° drawer & timeline
│   │   ├── 📂 dashboard/            # Executive KPI metric cards & charts
│   │   ├── 📂 expenses/             # Expense drawer, add expense modals
│   │   ├── 📂 finance/              # Accounts, ledger & reconciliation widgets
│   │   ├── 📂 inventory/            # Warehouse & stock management views
│   │   ├── 📂 leads/                # Lead pipeline tracker, detail workspaces
│   │   ├── 📂 material-leads/       # Material pipeline tracker, order & vendor modals
│   │   ├── 📂 payments/             # Record payment modal, receipt generator
│   │   ├── 📂 petty-cash/           # Advances & settlement forms
│   │   ├── 📂 procurement/          # PO detail drawers, 3-way match, vendor 360
│   │   ├── 📂 projects/             # Project workspace, Gantt, stages
│   │   ├── 📂 providers/            # React context providers & toast notifications
│   │   ├── 📂 quotations/           # Quotation studio, line items & breakdown
│   │   ├── 📂 reports/              # Interactive report tables & charts
│   │   ├── 📂 settings/             # Settings tabs, role matrix & user editors
│   │   └── 📂 vendors/              # Vendor directory & profile drawers
│   │
│   ├── 📂 modules/                  # Domain Business Logic Services
│   │   ├── 📂 activity/             # Unified timeline activity logging
│   │   ├── 📂 analytics/            # Conversion analytics & financial metrics
│   │   ├── 📂 approvals/            # Approval workflow engine
│   │   ├── 📂 audit/                # Immutable audit log engine
│   │   ├── 📂 auth/                 # Authentication & token verification
│   │   ├── 📂 calendar/             # Cross-system calendar aggregator service
│   │   ├── 📂 clients/              # Client 360° domain service
│   │   ├── 📂 config/               # System configuration master data
│   │   ├── 📂 dashboard/            # Executive dashboard KPI computation
│   │   ├── 📂 documents/            # Document management & file storage
│   │   ├── 📂 employees/            # Employee & payroll service
│   │   ├── 📂 expenses/             # Expense tracking & approval service
│   │   ├── 📂 finance/              # Invoicing, receivables & general ledger
│   │   ├── 📂 inventory/            # Stock movements & warehouse balances
│   │   ├── 📂 leads/                # CRM lead management service
│   │   ├── 📂 material-leads/       # Material lead pipeline & vendor ordering
│   │   ├── 📂 notifications/        # Real-time alerts & notification service
│   │   ├── 📂 payments/             # Client payment reconciliation service
│   │   ├── 📂 petty-cash/           # Petty cash advances & settlement service
│   │   ├── 📂 procurement/          # Purchase orders & vendor response service
│   │   ├── 📂 projects/             # Project execution & handover service
│   │   ├── 📂 quotations/           # Quotation calculation & versioning
│   │   ├── 📂 rbac/                 # Role-based access control engine
│   │   ├── 📂 reports/              # Report generation engine
│   │   ├── 📂 search/               # Global search & filter engine
│   │   ├── 📂 settings/             # System settings management
│   │   ├── 📂 tasks/                # Operational task management service
│   │   └── 📂 vendors/              # Vendor performance & catalogue service
│   │
│   ├── 📂 validators/               # Request Validation Schemas (Zod)
│   │   ├── calendar.schema.ts       # Calendar query & event scheduling schemas
│   │   ├── client.schema.ts         # Client creation & update schemas
│   │   ├── lead.schema.ts           # Lead intake & stage schemas
│   │   ├── material-lead.schema.ts  # Material lead pipeline schemas
│   │   ├── procurement.schema.ts    # Purchase order & vendor schemas
│   │   ├── project.schema.ts        # Project lifecycle schemas
│   │   ├── quotation.schema.ts      # Quotation calculation schemas
│   │   └── ...                      # Additional domain validation schemas
│   │
│   ├── 📂 lib/                      # Infrastructure & Utility Layer
│   │   ├── action-guard.ts          # Server Action authorization wrapper
│   │   ├── auth.ts                  # Password hashing & JWT helpers
│   │   ├── db.ts                    # Resilient Prisma client with retry logic
│   │   ├── errors.ts                # Structured domain error hierarchy
│   │   ├── id-generator.ts          # Concurrency-safe sequential ID generator
│   │   ├── logger.ts                # Structured JSON logging
│   │   ├── response.ts              # Standardized API response formatters
│   │   └── utils.ts                 # Class merger & currency formatters
│   │
│   └── 📂 config/                   # System & Environment Config
│       └── env.ts                   # Validated environment configuration
│
├── 📂 prisma/                       # Database Layer
│   ├── schema.prisma                # PostgreSQL Prisma data model
│   ├── seed.ts                      # Master database seeder
│   └── migrations/                  # Historical schema migrations
│
├── 📂 tests/                        # Vitest Automated Test Suites (50+ Suites)
│   ├── calendar-strict.test.ts      # Calendar aggregation & scheduling suite
│   ├── material-leads-pipeline.test.ts # Material leads 11-stage pipeline suite
│   ├── clients-strict.test.ts       # Client 360° & history test suite
│   ├── end-to-end-integration.test.ts # Full enterprise workflow integration
│   └── ...                          # Domain unit & integration test suites
│
├── 📂 scripts/                      # Database & Migration Utilities
│   ├── seed-master-database.ts      # Master demo & enterprise dataset seeder
│   ├── apply-indexes.ts             # Database performance indexer
│   └── ...                          # Data repair and migration scripts
│
└── 📂 docs/                         # Technical Documentation
    ├── architecture.md              # System architecture & data flow
    ├── authentication.md            # Authentication specifications
    ├── authorization.md             # RBAC & permissions matrix
    ├── database.md                  # Database schema & ERD guide
    ├── deployment.md                # Production deployment procedures
    └── project-structure.md         # Detailed component-to-module mapping
```

---

## 🏷️ Standard Naming & Architecture Conventions

1. **Service Layer Boundary (`src/modules/`)**:
   - All database operations, audit logging, and business rules belong inside domain services (e.g. `src/modules/calendar/calendar.service.ts`).
   - UI components and API handlers must delegate business logic to the service layer.

2. **Sequential Entity Identifiers (`src/lib/id-generator.ts`)**:
   - `LEAD-YYYY-XXXX`: CRM Interior Lead
   - `MAT-LEAD-YYYY-XXXX`: Material Lead
   - `PROJ-YYYY-XXXX`: Project
   - `QTN-YYYY-XXXX`: Quotation
   - `PO-YYYY-XXXX`: Purchase Order (Project Materials)
   - `MAT-ORD-YYYY-XXXX`: Material Supply Order (Lead Orders)
   - `CLI-YYYY-XXXX`: Client Profile
   - `TSK-YYYY-XXXX`: Task / To-Do
   - `REM-YYYY-XXXX`: Reminder

3. **Validation First (`src/validators/`)**:
   - Every API endpoint and form submission validates inputs using strict Zod schemas before reaching domain services.

4. **Design System Harmony**:
   - Palette: Neutral Warm Cream (`#FAF8F5`), Surface (`#FFFFFF`), Border (`#E8E2D9`), Primary Gold/Green accents (`#C5A880` / `#10B981`).
   - Tabular figures (`tabular-nums`) for all monetary values, percentages, dates, and sequential references.
