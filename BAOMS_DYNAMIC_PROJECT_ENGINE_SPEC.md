# BAOMS Dynamic Project Engine — Master Implementation Specification

**Status:** Specification plus initial online implementation slice in the repository; production rollout remains pending  
**Audience:** BAOMS product owner, implementers, database/security reviewers, QA  
**Purpose:** Define a controlled, data-driven project configuration and field-reporting capability that extends BAOMS without rebuilding its existing project, finance, HR, document, procurement, or approval modules.

## 1. Evidence and scope

This specification distinguishes repository facts from proposed behavior. Repository findings below come from a review of the current BAOMS checkout, including `src/features/projects`, `src/features/me`, domain services and types, `src/routes/AppRoutes.tsx`, Supabase migrations and schema, Firebase configuration/rules, and the supplied concept note and project dossier workbook. This review did not connect to a production Firebase or Supabase project. Therefore, deployed provider usage, live schema state, and runtime configuration remain unverified.

### Confirmed in the repository

- BAOMS is a React 19, TypeScript, Vite web application. React Router routes project list, registration, project workspace, planning, activities, tasks, field updates, team, beneficiaries, risks, budgets, reports, and documents.
- `src/features/projects/services/projectService.ts` describes Supabase PostgreSQL as the authoritative data source and provides project, activity, task, team, budget, report, and related operations. Project records and activity submissions already have workflow state in their types and schema.
- `supabase/migrations/20261013150000_projects_schema.sql` defines core project entities including projects, memberships, activities, tasks, reports, and project budgets. `supabase/BAOMS_COMPLETE_SCHEMA.sql` contains a broader schema snapshot. The numbered migrations in `supabase/migrations/` are the repository's deployment history; the complete SQL snapshot is not a substitute for checking which migrations are applied to a target database.
- M&E routes and a monitoring page exist. Project/document services and database entities already provide some submission/review patterns that should be reused where appropriate.
- The implemented role/permission code defines eight roles. Of particular relevance are `executive_director`, `project_manager`, `project_coordinator`, `me_officer`, `finance_officer`, and `procurement_officer`.
- Supabase client code and numerous `.from(...)` calls are present. Supabase Auth and Storage are used by application code. Storage and database RLS policies are represented in migrations.
- Firebase is present in `package.json`, `firebase.json`, `.firebaserc`, Firestore rules, and Storage rules. Firebase Hosting is configured to serve `dist`; Firestore and Firebase Storage rules are also configured. No Firebase client initialization or Firebase data calls were found in the reviewed `src` code. This does not establish whether Firebase Hosting or a Firebase service is active in production.
- `src/lib/storageSync.ts` provides browser `localStorage` persistence/cleanup helpers for selected UI or legacy domain keys. This is not evidence of a reliable offline data synchronization system.
- The README claims twelve institutional roles and demo accounts, but source currently defines eight roles and `DEMO_ACCOUNTS` is empty. Feature READMEs also label some already implemented modules as planned. Treat code and live schema as stronger evidence than stale documentation.
- The concept note proposes partner dashboards, mobile field collection, and further beneficiary/community functions. Those statements are proposed organizational scope, not confirmation that those capabilities are implemented.
- The sample dossier workbook for `PRJ-BYA-2026` includes activities, demographics, participant responses, tasks/milestones, and operational reports. It is an example of potential project reporting needs, not a production schema contract.

### Proposed scope

Add a configurable project setup and M&E collection layer that lets authorized managers instantiate a project from an approved organizational template or from scratch; define indicators and versioned forms; assign collection work; verify submissions; calculate official indicator results; and expose verified results to project dashboards and reports. Reuse current project/workplan, finance, procurement, document, approval, notification, and audit capabilities.

This specification does not authorize replacing BAOMS's existing project records or finance/procurement workflows, migrating production data, changing hosting providers, or deleting Firebase dependencies.

### Implementation status in this checkout (2026-10-20)

The repository now contains an initial online implementation: an additive Supabase migration, template-backed and wizard-backed project setup, dynamic indicator/form/assignment/submission services, a project engine route, verification workflow, and verified-data KPI/Excel views. `npm run build` and `npx tsc --noEmit` pass in this checkout. These checks do not validate SQL against the deployed Supabase schema or exercise database RLS/workflows. The migration has not been applied to a live database, production Firebase/Supabase responsibilities remain unverified, offline synchronization is not implemented, and role/RLS acceptance tests and full workflow regression tests remain outstanding. Treat the implementation as an initial vertical slice rather than a production-ready completion of every acceptance criterion below.

## 2. Goals and non-goals

### Goals

1. Make project-specific plans, indicators, form fields, schedules, and collection assignments configurable through the application.
2. Preserve normalized, queryable records for projects, forms, submissions, verification, indicator results, users, and audit events.
3. Make official dashboards and donor exports reproducible from verified data and a stated calculation definition/version.
4. Enforce project membership and role permissions in Supabase RLS as well as in the UI.
5. Preserve historical interpretation of every submitted record when forms or indicator definitions evolve.
6. Keep online implementation first-class and design offline collection as a later, explicitly tested capability.

### Non-goals for initial release

- A general-purpose no-code application builder or arbitrary executable formula engine.
- Replacing the existing finance, procurement, document, correspondence, HR, or organization modules.
- Unverified donor/partner logins or external-facing portals.
- Claiming offline support based only on local browser storage.
- Rewriting the app to Firebase or removing Firebase configuration before its production purpose is established.

## 3. Architecture decision and pre-development audit

### Provisional architecture

Keep the dynamic project engine's operational records, configuration, workflow, and calculations in Supabase/PostgreSQL, consistent with the current application services and schema. Continue using existing Supabase Auth, Storage, and RLS patterns. Firebase's production responsibility is **unknown**; preserve its dependencies and configuration pending verification.

### Required architecture audit before migration design

Record answers and evidence for each item in the implementation PR or a linked deployment note:

1. Inspect Firebase Console/project settings and deployment pipelines to determine whether Firebase Hosting currently serves production, whether Firestore/Storage contain active data, and whether any external client or scheduled job consumes them.
2. Inspect Supabase project settings and deployment configuration to confirm production URL/project identity, active Auth/Storage/database use, and whether this repository's migration history matches the deployed schema. Do not print or commit credentials.
3. Compare `supabase/migrations/` with the target database's migration history and live catalog. Resolve drift before applying a new migration. The README references a migration filename not present in the checked-out migration directory; do not use that stale instruction as proof of schema state.
4. Trace production hosting, environment variables, auth redirects, storage buckets, backups, retention, and restore procedures.
5. Determine whether Firestore/Storage rules are live security boundaries. Do not delete them or Firebase packages during this project unless a separately reviewed decommissioning decision is made.
6. Inventory current project and activity rows, workflows, triggers, RLS policies, and UI consumers. Determine whether project deletion is possible and whether there are production records to preserve.

**Exit condition:** The system owner signs off that Supabase is the record system for the new engine and documents Firebase's verified role. If Firebase is found to own any authoritative project data, stop to design a supported integration or migration; do not silently create two writers.

## 4. Functional requirements

### 4.1 Project registration wizard

Provide a stepper with save/resume draft capability. Recommended steps:

1. **Project identity:** project code, name, description, funder/donor, department, location/coverage, currency, start/end dates, owner and status.
2. **Starting structure:** select an approved organization template, duplicate a permitted existing setup, or start blank. Show template version and summary before selection.
3. **Results framework:** define outcomes/outputs, indicators, baseline, target, unit, disaggregation, source, frequency, calculation type, and responsible role/person.
4. **Workplan and collection:** phases, milestones, activities, schedule, collection forms, reporting periods, and assignees.
5. **Resources and links:** establish or link project budget lines through current BAOMS finance entities; add team members; link documents and any procurement plan data supported by existing modules.
6. **Review and activate:** validate required values, dates, target/calculation consistency, permissions, and responsible assignees. Save as draft or submit for configured authorization. Activation creates a versioned project configuration snapshot and audit event.

Rules:

- Draft setup may be edited by an authorized project manager. Activation freezes that configuration version; later changes create a new version and effective date.
- `project_code` remains unique under the current database's case/format rules and is validated server-side.
- Dates, targets, units, currencies, and foreign keys are validated server-side as well as in the UI.
- Project creation continues to use existing project persistence and any established approval flow. Do not create a competing project table.
- Template use copies a versioned definition into the project. Subsequent template edits do not mutate the instantiated project.

### 4.2 Configuration builder

Authorized managers can configure project outcomes, outputs, indicators, form sections/fields, collection frequency, and assignments. Validation must reject unsupported field types, calculation types, invalid references, unsafe limits, and incompatible changes to forms that have submissions.

Supported form field types for the first release should be explicitly allowlisted: short/long text, integer/decimal, date, single/multi-select, boolean, and repeatable structured row only if its validation and reporting semantics are defined. File uploads should reuse BAOMS document/storage services and permission rules rather than introduce an ungoverned attachment store. Each field definition needs a stable key, label/help text, required flag, constraints, ordering, and optional controlled vocabulary/disaggregation metadata.

### 4.3 Dynamic form rendering and data collection

- Render forms exclusively from a published form version, with server-loaded schema and client-side validation derived from the same definition.
- Save submission answers as typed/validated values with a reference to the exact form version and field keys. Preserve both machine key and rendered label through the referenced version.
- Capture project, activity/collection period, submitter, assigned collector (if different), creation/submission timestamps, and applicable location/participant disaggregation.
- Collection assignments have an assignee or team, form version, due date/window, recurrence/period, and status. Enforce assignment scope in RLS.
- Schedules must avoid generating duplicate assignments for a project/form/assignee/period combination. Use a unique key or idempotent server-side operation.
- Support saved drafts and submitted records as separate states. A submitted record is immutable to the submitter except through a return-for-correction transition that retains the previous submission/audit history.

### 4.4 Form versioning

- Form definitions follow `draft -> published -> retired` lifecycle. Drafts remain editable.
- Publishing creates an immutable version with monotonically increasing version number, author, timestamp, change summary, and schema snapshot/hash.
- A form version used by any submission cannot be edited or deleted.
- Label/help text corrections that do not change data meaning may be treated as compatible only if version history is still recorded. Changes to field key/type, requiredness, allowed values, units, repeatability, validation, or meaning are structural/incompatible and require a new version.
- Existing assignments remain pinned to their assigned version unless an authorized manager explicitly migrates unsubmitted assignments. Submitted records always remain on their original version.
- New submissions use the latest published version after its effective date. Reports must be able to group or map across versions explicitly; they must never reinterpret old answers using new labels/types by accident.

### 4.5 Submission verification

Use distinct states and transitions:

`draft -> submitted/pending -> verified`  
`pending -> returned -> resubmitted/pending`  
`pending -> rejected` (if governance allows terminal rejection)

- `pending`, `verified`, and `returned` must be visible and distinct. Rejected records are retained and excluded from official calculations.
- Submitter cannot verify their own data unless an explicit, approved segregation-of-duties policy allows it; default is separate verifier.
- Verifier records actor, timestamp, decision, and comments. Return requires a reason. Corrections create a new submission revision or preserved event history; no destructive overwrite.
- Only verified records contribute to official organizational or donor indicators, dashboards, and exports. Pending/returned counts may appear as workflow metrics, clearly separated from results.
- A report/export records its period, filter scope, generated time, calculation definition/version, included record set or stable query criteria, and generated-by identity.

### 4.6 Indicator calculations

Only four controlled calculation types are supported initially. Calculation definitions are structured fields, not user-authored SQL or arbitrary expressions. Each indicator definition has type, unit, target, direction where relevant, disaggregation policy, reporting period, inclusion rules, and version.

| Type | Definition | Required rules |
|---|---|---|
| `sum` / cumulative count | Sum verified numeric observations in the selected period; for event counts, sum verified count values. | Specify whether periods are incremental or cumulative. Prevent double counting by assigning each observation a stable reporting period/event key. Define null behavior (ignore null; never coerce missing to zero). |
| `percentage_of_target` | `verified_observed_value / target_value * 100`. The observed value uses a declared aggregation, normally sum. | Target must be positive; define whether display is capped at 100% (raw result should remain available); define rounding and period/cumulative basis. Zero or missing target is invalid, not infinity/zero. |
| `average` / mean | Arithmetic mean of verified numeric observations: sum / count of eligible non-null observations. | State observation unit and eligibility; report denominator/count; do not average pre-averaged subgroup values unless weighted numerator and denominator are available. Null observations are excluded, not zero. |
| `latest_value_or_milestone_state` | Value/state from the most recent verified observation by effective event date, with deterministic tie-break by verification time and immutable record ID. | Define allowed value domain and state ordering if a status summary is required. For milestone completion, retain the milestone's explicit status and effective date; do not infer completion from arbitrary text. |

For every computed value, retain/display numerator, denominator/count where applicable, period, last contributing verification time, excluded record counts, and calculation-definition version. Time zones and inclusive/exclusive period boundaries must be defined consistently (store timestamps in UTC; use project/reporting timezone for period boundaries). Disaggregation must be computed from verified observations and must reconcile to the total where categories are mutually exclusive.

### 4.7 Templates

- Organization administrators/M&E leads can create, revise, approve, publish, retire, and clone organization templates, subject to permissions agreed by the organization.
- Project managers can instantiate an approved template or start from scratch. The template is copied as a versioned snapshot and remains fully customizable where the actor's permissions permit.
- Template versions contain the same supported results framework, form, schedule, and calculation definitions as project configuration, plus metadata, intended use, owner, approver, and compatibility notes.
- Project customization does not modify the shared template. Template updates are opt-in for existing projects and must present a reviewed diff/migration plan.
- Templates are not executable code and cannot define custom SQL/formula expressions.

### 4.8 Offline collection (separate future capability)

Offline support is not part of the initial online release and must not be claimed until all acceptance tests below pass on target browsers/devices.

Future design requirements:

- Cache only the minimum published form versions, assignment metadata, and explicitly saved draft submissions needed for an authorized collector, with cache expiry and logout/account-switch cleanup.
- Queue submissions with client-generated stable UUID/idempotency key, original assignment/version IDs, client event time, and device metadata needed for diagnostics. Never identify duplicates by a weak content-only heuristic.
- Server deduplicates idempotently and returns canonical submission IDs/status.
- On sync, validate that assignment, user authorization, and form version remain acceptable. Preserve local payload and show a conflict/return state instead of silently overwriting server changes.
- Define conflict behavior for revoked users/assignments, retired form versions, duplicate submissions, server-verified records, and changed assignments.
- Encrypt/protect sensitive local data to the extent supported by the chosen browser storage; define retention and deletion behavior. Assess child/beneficiary data privacy before offline storage is enabled.
- Test interrupted sync, retries, app restart, device clock skew, duplicate requests, concurrent edits, storage quota, logout, authorization revocation, and version retirement.

## 5. Proposed data model (migration candidates, subject to audit)

Names below are logical candidates, not instructions to create blindly. The implementer must first compare these responsibilities to current tables, keys, enums, triggers, and policies. Extend current `projects`, `activities`, `project_members`, `project_budgets`, `project_reports`, `documents`, and audit infrastructure where compatible; do not duplicate them.

| Logical entity | Purpose / core relationships |
|---|---|
| Organization template + template version | Approved reusable setup; immutable published version snapshots. |
| Project configuration version | Immutable activated snapshot/version for a `projects.id`; creator, effective date, source template version, change summary. |
| Outcomes/outputs | Ordered results framework nodes linked to project configuration version. |
| Indicator definition/version | Project result, code, label, unit, target/baseline, four-type calculation config, period/disaggregation rules and immutable version. |
| Form + form version | Draft/published lifecycle and immutable schema snapshots; a form version can be linked to a project and one or more indicator definitions. |
| Collection schedule/assignment | Project, form version, assignee/team, cadence/period, due window, status; unique idempotency constraint. |
| Submission + submission revision/event | Project, assignment, exact form version, submitter, status, timestamps, verification metadata; immutable submitted payload or revision history. |
| Submission answer | Typed answer keyed by submission and stable field key, with constraints appropriate to field type. Alternative JSONB snapshot may be used for payload storage only if validated server-side and query/report requirements are met; retain normalized indexable values for reportable data. |
| Verification event | Append-only decision, actor, decision timestamp, reason/comments, referenced submission revision. |
| Indicator result/cache (optional) | Derived, rebuildable summary keyed by indicator version and period; source verified records and definition version must be traceable. Source submissions remain authoritative. |
| Audit event | Reuse existing audit mechanism where possible; record configuration publication, assignment, submission, verification, result/report generation, and access-sensitive changes. |

Use UUID foreign keys consistent with current schema, explicit `created_at`/`updated_at` where mutable, and immutable event records for decisions. Add unique constraints, check constraints, indexes on project, status, period, assignee, indicator, form/version, and verified timestamps based on query plans. Do not use a materialized/cache table as the authoritative submission record.

## 6. Security and RLS requirements

Every new table must have RLS enabled in the same migration that creates it. Policies must be tested for both allowed and denied access using authenticated users for relevant roles, not only the service key. Reuse existing permission helpers only after validating their definitions and role data in the deployed schema.

Minimum policy model:

- System Administrator: configuration administration and broad read/write according to existing BAOMS governance; this does not bypass audit requirements.
- Executive Director: organizational oversight, template approval/publishing if delegated, verified reporting, and project approvals as defined by current permissions; no unlogged answer edits.
- Project Manager: manage assigned project configuration drafts, team/schedules, and project forms; submit/manage project records; cannot verify own submissions by default.
- Project Coordinator: view assigned project instructions, submit assigned field data, edit own drafts, and respond to returned records; no configuration publication or independent verification by default.
- M&E Officer: manage indicator/form definitions and schedules as authorized, review/verify submissions, and access verified cross-project M&E data according to assignment/organizational scope. Apply segregation of duties for self-submitted data.
- Finance Officer: access existing finance/budget workflows and relevant project budget summaries; no access to beneficiary-level answers unless separately authorized and necessary.
- Procurement & Supply Officer (`procurement_officer`): access current procurement workflows and linked project procurement/budget context; no general access to sensitive beneficiary data.

Specific controls:

- Project membership/role scope is enforced in PostgreSQL policies, including linked child rows. Do not trust a client-supplied `project_id` or role.
- Prevent unauthorized cross-project reads through nested relationships and Storage object paths.
- Published form versions, submitted answers, verification events, and audit history are immutable to ordinary clients.
- Use transactional RPC/Edge Function operations where a transition spans multiple rows and requires atomic validation, identity checks, or audit logging.
- Never place service-role secrets in Vite/client environment variables. Validate storage path policies for attached files.
- Test policy predicates under actual role and membership combinations, including revoked membership and inactive users.

## 7. UI and service integration points

Likely integration points (final files depend on the audit and should be confirmed in implementation planning):

- Existing project pages/workspace and project registration UI under `src/features/projects/pages/` and `components/`.
- Existing project domain models and Supabase service in `src/features/projects/types/project.ts` and `src/features/projects/services/projectService.ts`.
- Existing M&E page under `src/features/me/pages/MonitoringEvaluationPage.tsx`.
- Existing route guards and permission definitions in `src/routes/AppRoutes.tsx`, `src/routes/ProtectedRoute.tsx`, `src/lib/permissions.ts`, and database role/permission seed migrations.
- Existing document/storage, notification, reporting, and audit services should be reused through narrow service APIs rather than bypassed from page components.

Target separation: pages render UI; form schema validation is a shared typed module; service functions own persistence; calculation functions are deterministic and unit-testable; authorization decisions remain server-enforced. Do not add one giant project page or route every custom form through hardcoded bespoke components.

## 8. Phased delivery and exit criteria

### Phase 0 — Production/schema audit

Deliver Firebase/Supabase responsibility record, live-vs-repo migration drift report, project table/policy inventory, current data preservation plan, and confirmed permission matrix. **Exit:** system owner and database reviewer agree Supabase is the new engine's record system and confirm no unaddressed Firebase data dependency.

### Phase 1 — Configuration and version foundations

Add approved templates, project configuration versions, results framework/indicator definitions, form version lifecycle, service APIs, and RLS. No offline support. **Exit:** template copy creates an independent project snapshot; published definitions are immutable; RLS positive/negative cases pass.

### Phase 2 — Online collection and verification

Build wizard/configuration UI, dynamic renderer, assignments/schedules, draft/submit/return/verify workflow, append-only verification and audit events. **Exit:** assigned collector can submit against pinned form version; unauthorized user cannot read/write; verifier's action is traceable; changes do not erase history.

### Phase 3 — Calculations and official reporting

Implement four calculation types, verified-only dashboards/exports, period scoping, provenance and reproducible export metadata. **Exit:** known fixture datasets match manually calculated results for nulls, zeros, target edge cases, ties, periods, disaggregation, and returned/pending exclusions.

### Phase 4 — Offline discovery and separately approved build

Threat/privacy review, supported device/browser selection, sync protocol, conflict UX, local retention policy, then implementation. **Exit:** offline acceptance suite below passes before any offline capability is advertised.

## 9. Acceptance criteria

1. A project manager with project creation permission can create a project from an approved template or from scratch, save a draft, resume it, and submit/activate through the configured workflow.
2. Instantiating a template copies its selected version. Editing a project does not alter the template or any other project.
3. A project manager can define supported indicators/forms and validate required metadata, target, calculation type, dates, and assignments. Unsupported calculation/form types are rejected server-side.
4. Published form/indicator/configuration versions are immutable; incompatible changes create a new version. Old submissions continue to render with the exact historical schema and labels.
5. A collector sees only assigned forms/projects, can save a draft, submit, and see pending/returned/verified status. Returned records preserve prior values and reviewer comments.
6. Only an authorized verifier can verify. A submitter cannot self-verify by default. Verification identity/time/comment and transitions are auditable.
7. Pending, returned, rejected, and draft data are excluded from official calculations. Verified data alone feeds official indicators and donor/organization reports.
8. All four calculation types follow documented formulas, null/zero/tie/time-period rules, expose required numerator/denominator/count and definition version, and have no arbitrary formula execution.
9. Project membership and role scope are enforced by RLS for parent and child rows. Negative tests prove cross-project access is denied, including after membership revocation.
10. Existing project list/workspace, finance budgets, procurement links, documents, approvals, notifications, and reports continue to function against existing records. Existing data is not dropped or silently rewritten.
11. Migration applies cleanly to a representative database initialized from the confirmed migration chain; rollback/recovery plan is documented. Existing schema drift is addressed before production deployment.
12. No product copy or README claims offline operation until offline acceptance criteria pass.

### Additional offline acceptance criteria (future phase)

- A collector can open an assigned cached form and save a draft with network disabled, close/reopen the app, and retain the draft.
- Repeated sync attempts for the same local submission produce exactly one canonical server submission.
- Interrupted sync resumes without loss or duplicate writes.
- A stale assignment, revoked user, retired form, or conflicting server state produces an explicit actionable conflict; no silent overwrite or false success.
- Data remains associated with its original form version and assignment through sync.
- Logout/account switch clears or securely isolates local data according to approved retention policy.

## 10. Regression and security test plan

Add tests as part of implementation; this specification does not claim they have been run. Required coverage includes:

- Unit tests for each aggregation, boundary dates, zero/missing target, null handling, averaging denominators, milestone tie-breaking, rounding, cumulative-vs-period behavior, and disaggregation reconciliation.
- Form schema validation tests for every supported field type and structural versioning rules.
- Workflow tests for draft, submit, return, resubmit, verify, reject (if enabled), duplicate schedule generation, and immutable history.
- RLS/database tests for every listed role, project memberships, non-members, inactive/revoked users, self-verification denial, and linked child records/storage paths.
- Integration tests covering project wizard -> published form -> assignment -> submission -> verification -> indicator -> report/export.
- Regression tests for existing project management, finance, procurement, document, correspondence, user approval, audit, and language flows touched by changes.
- Migration tests against a clean database and an anonymized snapshot of the confirmed current schema/data shape. Confirm no destructive changes, trigger/policy conflicts, or orphaned existing rows.
- Accessibility and responsive checks for wizard, builder, and data-collection form.
- Offline tests only in Phase 4, using real browser/device storage and network interruption scenarios.

## 11. Implementation guardrails

- Do not apply the repository migration to a production database until the Phase 0 live backend/schema audit and reviewer sign-off are complete.
- Do not duplicate current `projects`, `activities`, budgets, documents, memberships, or audit entities without proving an extension is not viable.
- Do not edit historical published form definitions or reinterpret old answers with current labels.
- Do not include unverified data in official totals, even if it is visible in operational workflow counts.
- Do not introduce arbitrary formulas, dynamic SQL, or client-only authorization.
- Do not assume Firebase is unused merely because current source lacks a Firebase client import; verify production hosting and data ownership first.
- Do not call the product offline-capable until offline acceptance criteria pass.
- Treat sensitive beneficiary/child records with minimization, access logging, retention, and local-storage restrictions defined before field rollout.

