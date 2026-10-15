# BAOMS — Business/Administration & Operations Management System

A modern enterprise back-office and operations management system built with **React 19**, **TypeScript**, and **Tailwind CSS**, integrated with **Supabase PostgreSQL** for secure, role-based organizational management.

BAOMS is designed for non-governmental organizations (NGOs), foundations, and enterprise institutions to manage programs, field operations, human resources, financial requests, procurements, correspondence, statutory compliance, and document repositories with full auditability and bilingual support (**English & Kiswahili**).

---

## Architecture & Technology Stack

- **Frontend Core**: React 19, TypeScript, Vite 8, React Router v6
- **Styling & Design System**: Tailwind CSS, FontAwesome SVG icons, Framer Motion
- **Database & Auth**: Supabase (`@supabase/supabase-js`), PostgreSQL, Row-Level Security (RLS) policies, Storage Buckets
- **Internationalization**: `i18next`, `react-i18next` with real-time English and Swahili switching
- **Workflows & UI**: Multi-step registration steppers, modal dialogs, status badges, CSV/Excel import & export via `xlsx`
- **Testing & Quality Assurance**: Vitest, `@testing-library/react`, `@testing-library/jest-dom`, TypeScript strict compilation, Oxlint

---

## Core Modules & Features

| Module | Features & Capabilities |
| --- | --- |
| **Authentication & RBAC** | 12 dedicated institutional roles with granular permissions, session management, and protected routes |
| **HR & Staff Management** | Staff directory, progressive multi-step onboarding, statutory compliance tracking (NSSF, WCF, NHIF, OSHA), and leave request workflows |
| **Project & Field Operations** | Multi-project tracking, budget allocation, milestones, M&E indicators, and field activity logs |
| **Finance Management** | Vouchers, multi-level financial approvals, budget burn rates, payment disbursement recording, and receipt attachments |
| **Procurement & Logistics** | Requisition workflows, RFQ tracking, purchase orders, vendor directory, and inventory control |
| **Document Management** | Categorized cloud document repository, version control, multi-reviewer approval workflows, and secure storage |
| **Correspondence & Meetings** | Inward/outward official mail tracking, meeting minutes, action item assignments, and tracking |
| **Audit Logs & Reporting** | Immutable audit trail for all organizational actions, KPI visualizers, and exportable executive reports |

---

## 12 Supported Institutional Roles

1. **System Administrator** — System settings, user accounts, audit trails, and security policies
2. **Executive Director** — High-level KPI dashboards, institutional approvals, and organizational reports
3. **HR Officer** — Employee onboarding, contract expirations, leave management, and statutory filings
4. **Project Manager** — Project lifecycle, milestone deliverables, workplans, and activity budgets
5. **Finance Officer** — Budget monitoring, voucher verification, payment authorizations, and financial records
6. **Procurement & Logistics Officer** — Requisitions, supplier management, purchase orders, and asset tracking
7. **Department Head** — Departmental team management, request endorsements, and project alignment
8. **Program Officer** — Field activities, program deliverables, and beneficiary tracking
9. **Communications Officer** — Official correspondence, public documentation, and media relations
10. **Field Officer** — Ground activity tracking, beneficiary reporting, and field expense logging
11. **Volunteer** — Task logging, volunteer hours tracking, and supervisor check-ins
12. **Intern** — Guided operational learning, task assignments, and progress tracking

---

## Getting Started

### 1. Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- A **Supabase** project instance (or local Supabase CLI)

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/nyalawe01/BAOMS.git
cd BAOMS
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Populate `.env.local` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key
```

> **Note**: `.env.local` is gitignored and will never be committed to source control.

### 4. Database Setup & Migrations

Database schemas and security policies are version-controlled in the `supabase/migrations/` directory:

- `20261013110001_core_schema.sql` — Core tables, enums, departments, and user profiles
- `20261013120001_roles_and_permissions_seed.sql` — System roles, departments, and permission matrices
- `20261013130001_security_and_rls.sql` — PostgreSQL Row Level Security (RLS) policies
- `20261013190001_storage_buckets_and_policies.sql` — Storage buckets and upload access rules
- `20261015140001_complete_baoms_schema.sql` — Unified schema for projects, finance, HR, documents, and audit logs

Apply these migrations to your Supabase project using the Supabase Dashboard SQL Editor or the Supabase CLI:

```bash
supabase db push
```

### 5. Running the Application

```bash
# Start Vite development server
npm run dev

# Run unit and component test suite
npm run test

# Run TypeScript compilation check
npx tsc -b

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## Project Structure

```
BAOMS/
├── public/                 # Static public assets
├── src/
│   ├── components/         # Shared component architecture
│   │   ├── dashboard/      # Role-specific dashboard views
│   │   ├── layout/         # AppShell, Header, Sidebar, UserMenu, Search
│   │   └── ui/             # Reusable UI primitives (Stepper, Modal, Table, Badge, Alert)
│   ├── features/           # Domain-driven modular feature architecture
│   │   ├── audit/          # Audit logging and system trace
│   │   ├── auth/           # Login, password reset, demo accounts, auth state
│   │   ├── correspondence/ # Inward/outward mail and meeting minutes
│   │   ├── documents/      # Document repository and approval workflows
│   │   ├── finance/        # Financial vouchers, payments, budget requests
│   │   ├── hr/             # Staff directory, onboarding, leave, statutory
│   │   ├── procurement/    # Purchase requests, orders, supplier records
│   │   ├── profile/        # User profiles and personal settings
│   │   ├── projects/       # Projects, workplans, milestones, KPIs
│   │   ├── reporting/      # Executive reports and export visualizers
│   │   ├── settings/       # Organization and system configurations
│   │   └── users/          # User administration and role assignments
│   ├── lib/                # Supabase client (`supabase.ts`), FontAwesome icons, utils
│   ├── locales/            # i18n translation files (en.json, sw.json)
│   ├── routes/             # AppRoutes.tsx with protected role routes
│   ├── App.tsx             # Root application component
│   └── main.tsx            # Application entry point
├── supabase/               # PostgreSQL migrations and security rules
├── tests/                  # Automated integration and end-to-end unit tests
├── index.html              # HTML entry point
├── tailwind.config.js      # Tailwind CSS theme configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build and alias configuration
```

---

## Clean Slate Data & Testing

The application repository is configured with a **clean slate**:
- All operational mock data (projects, employees, documents, financial records, vouchers) has been purged so you can start inputting real organizational data immediately.
- Pre-configured demo user accounts are provided in `src/features/auth/demoAccounts.ts` across all 12 roles for immediate manual and end-to-end testing.

---

## License

Private and confidential. Developed for organizational operational management.
