# Port and Ground UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the complete dealflow-dashboard UI into field-recon-engine (Next.js App Router) and replace all generic mock data with domain-correct data grounded in the AF-2026-00417 deal, `input/` JSON files, and `field_reference_and_check_types.md`.

**Architecture:** All pages/components from `dealflow-dashboard/src/` are ported to `field-recon-engine/` with mechanical routing substitutions (React Router → Next.js navigation). A new `lib/data/` layer holds all domain-correct mock data, replacing `src/data/mock*.ts`. Routing uses `/stage/[stageId]/deal/[dealId]/...` instead of `/team/[teamId]/deal/[dealId]/...`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS v4, shadcn/ui (base-nova), Zod, Lucide icons, Recharts (charts), Radix UI primitives.

---

## Before writing any Next.js code

Read the App Router guide at `node_modules/next/dist/docs/` — specifically layouts, pages, and the `"use client"` directive. The key rule: every file using React hooks (`useState`, `useParams`, `useRouter`, `usePathname`) **must** have `"use client"` as its first line. Layouts that only pass `{children}` can stay as server components.

---

## File Map

**New files to create:**

```
lib/data/deals.ts
lib/data/documents.ts
lib/data/checks.ts
lib/data/deal-detail.ts
lib/data/conversations.ts
components/NavLink.tsx
components/AppLayout.tsx
components/AppSidebar.tsx
components/DealCard.tsx
components/KpiCard.tsx
components/ConfidenceBadge.tsx
components/DealTopBanner.tsx
components/AgentChatButton.tsx
components/StageDistributionChart.tsx
components/TeamBreakdownCard.tsx
app/stage/[stageId]/page.tsx
app/stage/[stageId]/deal/[dealId]/layout.tsx
app/stage/[stageId]/deal/[dealId]/page.tsx
app/stage/[stageId]/deal/[dealId]/checks/page.tsx
app/stage/[stageId]/deal/[dealId]/documents/page.tsx
app/stage/[stageId]/deal/[dealId]/conversations/page.tsx
app/stage/[stageId]/deal/[dealId]/decision/page.tsx
```

**Files to modify:**

```
app/globals.css          — add status/sidebar/kpi CSS custom properties
app/layout.tsx           — replace default Next.js shell with AppLayout
app/page.tsx             — replace default page with Dashboard
```

---

## Task 1: Install missing shadcn components

The dealflow-dashboard uses: `card`, `badge`, `separator`, `tooltip`, `sonner`, `toaster`, `sidebar`, `textarea`. field-recon-engine only has `button`. Install the rest.

**Files:** none (installs to `components/ui/`)

- [ ] **Step 1: Install components**

```bash
cd /home/junaid/Dev-Personal/field-recon-engine
npx shadcn@latest add card badge separator tooltip sonner toaster sidebar textarea
```

Expected: each component is added to `components/ui/`. Answer `y` to any prompts.

- [ ] **Step 2: Verify**

```bash
ls components/ui/
```

Expected output includes: `button.tsx card.tsx badge.tsx separator.tsx tooltip.tsx sonner.tsx toaster.tsx sidebar.tsx textarea.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/ui/
git commit -m "feat: install shadcn ui components for dashboard port"
```

---

## Task 2: Add custom CSS variables and KPI gradient classes

The dealflow-dashboard uses `text-status-warning`, `bg-status-success/10`, `text-status-info`, sidebar colour overrides, and `kpi-gradient-N` classes. field-recon-engine uses Tailwind v4's `@theme inline` pattern — add the missing vars there.

**Files:** Modify `app/globals.css`

- [ ] **Step 1: Add custom vars to globals.css**

Add the following to `app/globals.css`. Insert the `@theme inline` additions **inside the existing `@theme inline { }` block**, and the `:root` additions **inside the existing `:root { }` block**.

In `@theme inline { }`, add after the existing entries:

```css
  /* Status colours */
  --color-status-warning: var(--status-warning);
  --color-status-success: var(--status-success);
  --color-status-info: var(--status-info);
  /* Sidebar overrides (blue theme matching dealflow-dashboard) */
  --color-sidebar-muted: var(--sidebar-muted);
```

In `:root { }`, replace the existing sidebar vars block and add status/kpi vars:

```css
  /* Status colours */
  --status-warning: oklch(0.65 0.15 55);
  --status-success: oklch(0.52 0.12 155);
  --status-info: oklch(0.52 0.13 295);

  /* Sidebar — blue theme */
  --sidebar: oklch(0.40 0.10 250);
  --sidebar-foreground: oklch(0.90 0.02 250);
  --sidebar-primary: oklch(0.98 0 0);
  --sidebar-primary-foreground: oklch(0.40 0.10 250);
  --sidebar-accent: oklch(0.46 0.09 250);
  --sidebar-accent-foreground: oklch(0.98 0 0);
  --sidebar-border: oklch(0.48 0.08 250);
  --sidebar-ring: oklch(0.98 0 0);
  --sidebar-muted: oklch(0.72 0.06 250);
```

Then add KPI gradient utility classes at the end of the file, inside a new `@layer utilities` block:

```css
@layer utilities {
  .kpi-gradient-1 { background: oklch(0.40 0.10 250); }
  .kpi-gradient-2 { background: oklch(0.50 0.09 250); }
  .kpi-gradient-3 { background: oklch(0.58 0.08 250); }
  .kpi-gradient-4 { background: oklch(0.67 0.07 250); }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat: add status colours, sidebar theme, and kpi gradient vars"
```

---

## Task 3: lib/data/deals.ts

Deal queues per stage. AF-2026-00417 is the first actionable deal in each stage. Other entries are lightweight placeholders. The `incoming` bucket is renamed from dealflow-dashboard for clarity.

**Files:** Create `lib/data/deals.ts`

- [ ] **Step 1: Create lib/data/deals.ts**

```typescript
export interface Deal {
  id: string
  applicant: string
  vehicle: string
  value: string
  age: string
  ageInDays: number
  context: string
  contextDetail?: string
  workedOnBefore?: { action: string }
}

export interface StageDeals {
  actionRequired: Deal[]
  awaitingBroker: Deal[]
  completedToday: Deal[]
  incoming: Deal[]
}

const groundedDeal: Deal = {
  id: "AF-2026-00417",
  applicant: "Adam Piers",
  vehicle: "2021 Ford Focus ST-Line",
  value: "£12,500",
  age: "18d",
  ageInDays: 18,
  context: "2 checks failing",
  contextDetail: "Sort code mismatch, extras cap exceeded",
  workedOnBefore: { action: "Underwriting review in progress" },
}

const underwritingDeals: StageDeals = {
  actionRequired: [
    groundedDeal,
    { id: "AF-2026-00391", applicant: "Sarah Booth", vehicle: "2022 VW Golf", value: "£18,200", age: "3d", ageInDays: 3, context: "Employment query", contextDetail: "Duration discrepancy" },
    { id: "AF-2026-00403", applicant: "Marcus Webb", vehicle: "2020 BMW 1 Series", value: "£15,900", age: "5d", ageInDays: 5, context: "Previous application", contextDetail: "Address change unexplained" },
    { id: "AF-2026-00411", applicant: "Priya Nair", vehicle: "2023 Kia Sportage", value: "£22,400", age: "1d", ageInDays: 1, context: "Name mismatch", contextDetail: "Previous app name format differs" },
  ],
  awaitingBroker: [
    { id: "AF-2026-00388", applicant: "Daniel Cross", vehicle: "2021 Seat Leon", value: "£14,600", age: "7d", ageInDays: 7, context: "Awaiting payslip", contextDetail: "Requested 4 days ago" },
    { id: "AF-2026-00395", applicant: "Fiona Grant", vehicle: "2022 Nissan Juke", value: "£17,800", age: "2d", ageInDays: 2, context: "Awaiting employment letter" },
  ],
  completedToday: [
    { id: "AF-2026-00372", applicant: "Tom Fletcher", vehicle: "2021 Honda Jazz", value: "£13,200", age: "12d", ageInDays: 12, context: "Approved", contextDetail: "Passed to payout" },
    { id: "AF-2026-00379", applicant: "Lucy Marsh", vehicle: "2023 Toyota Yaris", value: "£16,500", age: "9d", ageInDays: 9, context: "Approved", contextDetail: "Passed to payout" },
    { id: "AF-2026-00383", applicant: "Callum Drew", vehicle: "2020 Ford Puma", value: "£11,800", age: "14d", ageInDays: 14, context: "Rejected", contextDetail: "Failed credit check" },
  ],
  incoming: [
    { id: "AF-2026-00418", applicant: "Amara Osei", vehicle: "2023 Renault Clio", value: "£14,100", age: "Today", ageInDays: 0, context: "New application" },
    { id: "AF-2026-00419", applicant: "Jake Winters", vehicle: "2022 Hyundai i20", value: "£12,700", age: "Today", ageInDays: 0, context: "New application" },
  ],
}

const payoutDeals: StageDeals = {
  actionRequired: [
    { ...groundedDeal, context: "2 checks failing", contextDetail: "Sort code mismatch, extras cap exceeded" },
    { id: "AF-2026-00384", applicant: "Rebecca Stone", vehicle: "2021 Audi A1", value: "£19,400", age: "4d", ageInDays: 4, context: "Invoice query", contextDetail: "VAT amount disputed" },
    { id: "AF-2026-00392", applicant: "Neil Foster", vehicle: "2022 Mercedes A-Class", value: "£28,700", age: "2d", ageInDays: 2, context: "Dealer query", contextDetail: "FCA permission check pending" },
  ],
  awaitingBroker: [
    { id: "AF-2026-00376", applicant: "Clare Holt", vehicle: "2020 Mini Cooper", value: "£15,300", age: "6d", ageInDays: 6, context: "Awaiting revised invoice" },
    { id: "AF-2026-00385", applicant: "Owen Peters", vehicle: "2023 Peugeot 2008", value: "£20,100", age: "3d", ageInDays: 3, context: "Awaiting supplier declaration" },
  ],
  completedToday: [
    { id: "AF-2026-00361", applicant: "Hannah Reid", vehicle: "2022 Toyota Corolla", value: "£21,600", age: "8d", ageInDays: 8, context: "Paid out", contextDetail: "Funds transferred" },
    { id: "AF-2026-00368", applicant: "Stuart Banks", vehicle: "2021 Skoda Octavia", value: "£17,900", age: "6d", ageInDays: 6, context: "Paid out" },
  ],
  incoming: [
    { id: "AF-2026-00372", applicant: "Tom Fletcher", vehicle: "2021 Honda Jazz", value: "£13,200", age: "Today", ageInDays: 0, context: "From underwriting" },
    { id: "AF-2026-00379", applicant: "Lucy Marsh", vehicle: "2023 Toyota Yaris", value: "£16,500", age: "Today", ageInDays: 0, context: "From underwriting" },
  ],
}

const accountsDeals: StageDeals = {
  actionRequired: [
    { ...groundedDeal, context: "Bank details issue", contextDetail: "Sort code unverified" },
    { id: "AF-2026-00359", applicant: "Donna Clarke", vehicle: "2022 BMW 2 Series", value: "£26,100", age: "3d", ageInDays: 3, context: "Commission query", contextDetail: "Rate exceeds cap" },
  ],
  awaitingBroker: [
    { id: "AF-2026-00344", applicant: "Ryan Moss", vehicle: "2021 Ford Kuga", value: "£23,400", age: "5d", ageInDays: 5, context: "Awaiting corrected invoice" },
  ],
  completedToday: [
    { id: "AF-2026-00331", applicant: "Yasmin Farooq", vehicle: "2022 Volvo XC40", value: "£34,500", age: "7d", ageInDays: 7, context: "Funded", contextDetail: "Completed" },
    { id: "AF-2026-00337", applicant: "Ben Archer", vehicle: "2021 Vauxhall Corsa", value: "£9,800", age: "4d", ageInDays: 4, context: "Funded" },
  ],
  incoming: [
    { id: "AF-2026-00361", applicant: "Hannah Reid", vehicle: "2022 Toyota Corolla", value: "£21,600", age: "Today", ageInDays: 0, context: "From payout" },
  ],
}

export const stageDealsMap: Record<string, StageDeals> = {
  underwriting: underwritingDeals,
  payout: payoutDeals,
  accounts: accountsDeals,
}

export const stageLabels: Record<string, string> = {
  underwriting: "Underwriting",
  payout: "Payout",
  accounts: "Accounts",
}

export function getDealById(stageId: string, dealId: string): Deal | null {
  const stage = stageDealsMap[stageId]
  if (!stage) return null
  return [
    ...stage.actionRequired,
    ...stage.awaitingBroker,
    ...stage.completedToday,
    ...stage.incoming,
  ].find((d) => d.id === dealId) ?? null
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/data/deals.ts
git commit -m "feat: add domain-correct deal queues per stage"
```

---

## Task 4: lib/data/documents.ts

Document pack per stage, using the real document types from the deal pack.

**Files:** Create `lib/data/documents.ts`

- [ ] **Step 1: Create lib/data/documents.ts**

```typescript
export type DocStatus = "received" | "verified" | "issue" | "missing"

export interface DocVersion {
  version: string
  uploadedBy: string
  uploadedAt: string
  note?: string
  sizeKb: number
}

export interface DealDocument {
  id: string
  name: string
  status: DocStatus
  versions: DocVersion[]
  pageCount: number
}

export const docStatusLabels: Record<DocStatus, string> = {
  received: "Received",
  verified: "Verified",
  issue: "Issue",
  missing: "Missing",
}

const underwritingDocuments: DealDocument[] = [
  {
    id: "DOC-UW-01",
    name: "Broker Application",
    status: "verified",
    pageCount: 2,
    versions: [
      { version: "v1", uploadedBy: "CarMoney (via CRM)", uploadedAt: "18/03/2026 09:14", sizeKb: 240 },
    ],
  },
  {
    id: "DOC-UW-02",
    name: "Previous Application (AF-2024-08831)",
    status: "verified",
    pageCount: 2,
    versions: [
      { version: "v1", uploadedBy: "System — CRM lookup", uploadedAt: "18/03/2026 09:15", note: "Auto-retrieved on submission", sizeKb: 185 },
    ],
  },
]

const payoutDocuments: DealDocument[] = [
  {
    id: "DOC-PO-01",
    name: "HP Agreement (HP-2026-00417)",
    status: "verified",
    pageCount: 4,
    versions: [
      { version: "v1", uploadedBy: "CarMoney (Midland Motor Group)", uploadedAt: "20/03/2026 14:22", sizeKb: 510 },
    ],
  },
  {
    id: "DOC-PO-02",
    name: "Purchase Invoice (MCD-2026-0892)",
    status: "issue",
    pageCount: 1,
    versions: [
      { version: "v1", uploadedBy: "CarMoney (Midland Motor Group)", uploadedAt: "20/03/2026 14:22", note: "Extras total £445 — exceeds £400 cap", sizeKb: 180 },
    ],
  },
  {
    id: "DOC-PO-03",
    name: "Supplier Declaration",
    status: "verified",
    pageCount: 1,
    versions: [
      { version: "v1", uploadedBy: "CarMoney (Midland Motor Group)", uploadedAt: "20/03/2026 14:22", sizeKb: 145 },
    ],
  },
  {
    id: "DOC-PO-04",
    name: "Payment Mandate (Direct Debit)",
    status: "verified",
    pageCount: 1,
    versions: [
      { version: "v1", uploadedBy: "CarMoney (Midland Motor Group)", uploadedAt: "20/03/2026 14:22", sizeKb: 95 },
    ],
  },
  {
    id: "DOC-PO-05",
    name: "Giro Slip",
    status: "issue",
    pageCount: 1,
    versions: [
      { version: "v1", uploadedBy: "CarMoney (Midland Motor Group)", uploadedAt: "20/03/2026 14:22", note: "Sort code 204518 does not match funds form (204519)", sizeKb: 88 },
    ],
  },
  {
    id: "DOC-PO-06",
    name: "Funds Form",
    status: "issue",
    pageCount: 1,
    versions: [
      { version: "v1", uploadedBy: "CarMoney (Midland Motor Group)", uploadedAt: "20/03/2026 14:22", note: "Sort code 204519 does not match giro slip (204518)", sizeKb: 92 },
    ],
  },
  {
    id: "DOC-PO-07",
    name: "FCA Register Lookup",
    status: "verified",
    pageCount: 1,
    versions: [
      { version: "v1", uploadedBy: "System — FCA Register", uploadedAt: "20/03/2026 09:17", note: "Auto-run on submission", sizeKb: 64 },
    ],
  },
]

const accountsDocuments: DealDocument[] = [
  {
    id: "DOC-AC-01",
    name: "Purchase Invoice (MCD-2026-0892)",
    status: "issue",
    pageCount: 1,
    versions: [
      { version: "v1", uploadedBy: "CarMoney (Midland Motor Group)", uploadedAt: "20/03/2026 14:22", note: "Extras total £445 — flagged from payout stage", sizeKb: 180 },
    ],
  },
  {
    id: "DOC-AC-02",
    name: "Funds Form",
    status: "issue",
    pageCount: 1,
    versions: [
      { version: "v1", uploadedBy: "CarMoney (Midland Motor Group)", uploadedAt: "20/03/2026 14:22", note: "Sort code unverified — mismatch with giro slip", sizeKb: 92 },
    ],
  },
  {
    id: "DOC-AC-03",
    name: "Giro Slip",
    status: "issue",
    pageCount: 1,
    versions: [
      { version: "v1", uploadedBy: "CarMoney (Midland Motor Group)", uploadedAt: "20/03/2026 14:22", note: "Sort code 204518 does not match funds form (204519)", sizeKb: 88 },
    ],
  },
]

export const stageDocumentsMap: Record<string, DealDocument[]> = {
  underwriting: underwritingDocuments,
  payout: payoutDocuments,
  accounts: accountsDocuments,
}

export function getDocumentsForStage(stageId: string): DealDocument[] {
  return stageDocumentsMap[stageId] ?? []
}

export function getDocumentsByGroup(docs: DealDocument[]): Record<string, DealDocument[]> {
  const groups: Record<string, DealDocument[]> = {}
  for (const doc of docs) {
    const group = doc.id.startsWith("DOC-UW") ? "Application Documents"
      : doc.id.startsWith("DOC-PO") ? "Deal Pack"
      : "Accounts Documents"
    if (!groups[group]) groups[group] = []
    groups[group].push(doc)
  }
  return groups
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/data/documents.ts
git commit -m "feat: add domain-correct document packs per stage"
```

---

## Task 5: lib/data/checks.ts — types and underwriting checks

All check types and the underwriting check set. Values come directly from `input/broker.json` and the `previous_application` field.

Real data used: `Adam Piers` vs `Adam J Piers` (previous app name), `3 years` vs `2 years` (employment duration — flagged as warning because it changed between applications).

**Files:** Create `lib/data/checks.ts`

- [ ] **Step 1: Create lib/data/checks.ts with types + underwriting checks**

```typescript
export type CheckCategory =
  | "doc_validation"
  | "intra_doc"
  | "inter_doc"
  | "policy_rules"
  | "system_lookup"
  | "entity_resolution"

export type CheckStatus = "pass" | "fail" | "warning" | "pending"

export type CheckMatchType =
  | "exact"
  | "fuzzy"
  | "tolerance"
  | "arithmetic"
  | "rule"
  | "lookup"

export interface CheckDataRow {
  field: string
  sourceA: string
  sourceB: string
  match: boolean
  note?: string
}

export interface CheckDocument {
  id: string
  name: string
  version: string
  type: "upload" | "system"
}

export interface DealCheck {
  id: string
  category: CheckCategory
  title: string
  description: string
  matchType: CheckMatchType
  status: CheckStatus
  confidence: number
  tolerance?: string
  outcome: string
  failReason?: string
  dataRows: CheckDataRow[]
  documents: CheckDocument[]
}

export const categoryLabels: Record<CheckCategory, string> = {
  doc_validation: "Document Validation",
  intra_doc: "Intra-Document Checks",
  inter_doc: "Inter-Document Checks",
  policy_rules: "Policy / Business Rules",
  system_lookup: "System Lookup Checks",
  entity_resolution: "Entity Resolution",
}

export const matchTypeLabels: Record<CheckMatchType, string> = {
  exact: "Exact Match",
  fuzzy: "Fuzzy Match",
  tolerance: "Tolerance Check",
  arithmetic: "Arithmetic Validation",
  rule: "Business Rule",
  lookup: "External Lookup",
}

// ─── Underwriting checks ──────────────────────────────────────────────────────
// Source documents: Broker Application (broker.json) + Previous Application
// (nested inside broker.json as previous_application)

const underwritingChecks: DealCheck[] = [
  {
    id: "UW-CHK-001",
    category: "inter_doc",
    title: "Customer name consistency",
    description: "Fuzzy match customer name across current application and previous application.",
    matchType: "fuzzy",
    status: "pass",
    confidence: 0.91,
    outcome: "Names match — 'Adam Piers' (current) and 'Adam J Piers' (previous) resolve to the same individual. Middle initial present in previous application only.",
    dataRows: [
      { field: "Current application", sourceA: "Adam Piers", sourceB: "Broker Application", match: true },
      { field: "Previous application (AF-2024-08831)", sourceA: "Adam J Piers", sourceB: "Previous Application", match: true, note: "Middle initial in previous app only — fuzzy match pass" },
    ],
    documents: [
      { id: "DOC-UW-01", name: "Broker Application", version: "v1", type: "upload" },
      { id: "DOC-UW-02", name: "Previous Application (AF-2024-08831)", version: "v1", type: "upload" },
    ],
  },
  {
    id: "UW-CHK-002",
    category: "inter_doc",
    title: "Date of birth match",
    description: "Exact match date of birth across current application and previous application.",
    matchType: "exact",
    status: "pass",
    confidence: 0.99,
    outcome: "Date of birth matches exactly across both applications.",
    dataRows: [
      { field: "Current application", sourceA: "15/03/1988", sourceB: "Broker Application", match: true },
      { field: "Previous application", sourceA: "15/03/1988", sourceB: "Previous Application", match: true },
    ],
    documents: [
      { id: "DOC-UW-01", name: "Broker Application", version: "v1", type: "upload" },
      { id: "DOC-UW-02", name: "Previous Application (AF-2024-08831)", version: "v1", type: "upload" },
    ],
  },
  {
    id: "UW-CHK-003",
    category: "inter_doc",
    title: "Address consistency",
    description: "Fuzzy match customer address across current application and previous application.",
    matchType: "fuzzy",
    status: "pass",
    confidence: 0.94,
    outcome: "Addresses match. Minor formatting difference (missing comma before postcode in previous application). Same property confirmed.",
    dataRows: [
      { field: "Current application", sourceA: "14 Birchwood Lane, Solihull, B91 3QR", sourceB: "Broker Application", match: true },
      { field: "Previous application", sourceA: "14 Birchwood Lane, Solihull B91 3QR", sourceB: "Previous Application", match: true, note: "Missing comma before postcode — fuzzy match pass" },
    ],
    documents: [
      { id: "DOC-UW-01", name: "Broker Application", version: "v1", type: "upload" },
      { id: "DOC-UW-02", name: "Previous Application (AF-2024-08831)", version: "v1", type: "upload" },
    ],
  },
  {
    id: "UW-CHK-004",
    category: "inter_doc",
    title: "Employment status match",
    description: "Exact match employment status (Full-time / Part-time / Self-employed) across current and previous application.",
    matchType: "exact",
    status: "pass",
    confidence: 0.99,
    outcome: "Employment status is Full-time in both applications.",
    dataRows: [
      { field: "Current application", sourceA: "Full-time", sourceB: "Broker Application", match: true },
      { field: "Previous application", sourceA: "Full-time", sourceB: "Previous Application", match: true },
    ],
    documents: [
      { id: "DOC-UW-01", name: "Broker Application", version: "v1", type: "upload" },
      { id: "DOC-UW-02", name: "Previous Application (AF-2024-08831)", version: "v1", type: "upload" },
    ],
  },
  {
    id: "UW-CHK-005",
    category: "inter_doc",
    title: "Employment duration change",
    description: "Exact match check: employment duration at current employer should be consistent with the previous application, allowing for elapsed time.",
    matchType: "exact",
    status: "warning",
    confidence: 0.78,
    outcome: "Duration increased from '2 years' (Jan 2025) to '3 years' (Mar 2026) — 14 months elapsed. Increase of 1 year over 14 months is plausible if still at same employer. Flagged for manual confirmation.",
    failReason: "Duration changed: '2 years' → '3 years' across applications 14 months apart. System cannot confirm same employer without manual check.",
    dataRows: [
      { field: "Current application (Mar 2026)", sourceA: "3 years", sourceB: "Broker Application", match: false },
      { field: "Previous application (Jan 2025)", sourceA: "2 years", sourceB: "Previous Application", match: false, note: "14 months elapsed — 1 year increase is plausible" },
    ],
    documents: [
      { id: "DOC-UW-01", name: "Broker Application", version: "v1", type: "upload" },
      { id: "DOC-UW-02", name: "Previous Application (AF-2024-08831)", version: "v1", type: "upload" },
    ],
  },
  {
    id: "UW-CHK-006",
    category: "inter_doc",
    title: "Name layout (first / middle / last)",
    description: "Fuzzy match name layout between current and previous application. Middle name presence/absence is noted.",
    matchType: "fuzzy",
    status: "pass",
    confidence: 0.88,
    outcome: "Name layout consistent. Current application uses first + last only ('Adam Piers'). Previous used first + middle initial + last ('Adam J Piers'). Same individual confirmed via DOB and address match.",
    dataRows: [
      { field: "Current (first / last)", sourceA: "Adam / Piers", sourceB: "Broker Application", match: true },
      { field: "Previous (first / middle / last)", sourceA: "Adam / J / Piers", sourceB: "Previous Application", match: true, note: "Middle initial not provided in current app" },
    ],
    documents: [
      { id: "DOC-UW-01", name: "Broker Application", version: "v1", type: "upload" },
      { id: "DOC-UW-02", name: "Previous Application (AF-2024-08831)", version: "v1", type: "upload" },
    ],
  },
]
```

(File is incomplete — payout and accounts checks follow in Tasks 6 and 7.)

- [ ] **Step 2: Verify file is valid TypeScript so far**

```bash
cd /home/junaid/Dev-Personal/field-recon-engine && npx tsc --noEmit 2>&1 | head -20
```

Expected: errors only about missing exports from the incomplete file (payout/accounts arrays not yet defined). No syntax errors.

---

## Task 6: lib/data/checks.ts — payout checks

Append payout checks to `lib/data/checks.ts`. These are the cross-document checks from the full deal pack.

Real failures: sort code `204518` (giro) vs `204519` (funds form) — **FAIL**. Invoice extras £295 + £150 = £445 > £400 cap — **FAIL**. Dealer name `Midland Cars Direct` (invoice) resolved via FCA register trading name — **PASS** (entity resolution).

**Files:** Modify `lib/data/checks.ts` — append after `underwritingChecks`

- [ ] **Step 1: Append payout checks to lib/data/checks.ts**

Add this after the `underwritingChecks` array:

```typescript
// ─── Payout checks ────────────────────────────────────────────────────────────
// Source documents: HP Agreement, Purchase Invoice, Supplier Declaration,
// Payment Mandate, Giro Slip, Funds Form, FCA Register Lookup, System Checks

const payoutChecks: DealCheck[] = [
  // ── Document completeness ──
  {
    id: "PO-CHK-001",
    category: "doc_validation",
    title: "Document pack completeness",
    description: "Presence check: all 7 required documents must be received before payout.",
    matchType: "rule",
    status: "pass",
    confidence: 0.99,
    outcome: "All 7 documents received: HP Agreement, Purchase Invoice, Supplier Declaration, Payment Mandate, Giro Slip, Funds Form, FCA Register Lookup.",
    dataRows: [
      { field: "HP Agreement", sourceA: "Received", sourceB: "Required", match: true },
      { field: "Purchase Invoice", sourceA: "Received", sourceB: "Required", match: true },
      { field: "Supplier Declaration", sourceA: "Received", sourceB: "Required", match: true },
      { field: "Payment Mandate", sourceA: "Received", sourceB: "Required", match: true },
      { field: "Giro Slip", sourceA: "Received", sourceB: "Required", match: true },
      { field: "Funds Form", sourceA: "Received", sourceB: "Required", match: true },
      { field: "FCA Register Lookup", sourceA: "Received", sourceB: "Required", match: true },
    ],
    documents: [
      { id: "DOC-PO-01", name: "HP Agreement", version: "v1", type: "upload" },
      { id: "DOC-PO-02", name: "Purchase Invoice", version: "v1", type: "upload" },
      { id: "DOC-PO-03", name: "Supplier Declaration", version: "v1", type: "upload" },
      { id: "DOC-PO-04", name: "Payment Mandate", version: "v1", type: "upload" },
      { id: "DOC-PO-05", name: "Giro Slip", version: "v1", type: "upload" },
      { id: "DOC-PO-06", name: "Funds Form", version: "v1", type: "upload" },
      { id: "DOC-PO-07", name: "FCA Register Lookup", version: "v1", type: "system" },
    ],
  },
  // ── Vehicle fields ──
  {
    id: "PO-CHK-002",
    category: "inter_doc",
    title: "Vehicle make / model",
    description: "Fuzzy match vehicle make/model across broker application, HP agreement, and purchase invoice.",
    matchType: "fuzzy",
    status: "pass",
    confidence: 0.92,
    outcome: "Vehicle identity confirmed across all three documents. HP agreement includes additional spec detail ('1.0T EcoBoost') not present in the other two — fuzzy match passes.",
    dataRows: [
      { field: "Broker application", sourceA: "Ford Focus ST-Line", sourceB: "Broker Application", match: true },
      { field: "HP agreement", sourceA: "Ford Focus ST-Line 1.0T EcoBoost", sourceB: "HP Agreement", match: true, note: "Additional spec detail — same vehicle confirmed" },
      { field: "Purchase invoice", sourceA: "Ford Focus ST-Line", sourceB: "Purchase Invoice", match: true },
    ],
    documents: [
      { id: "DOC-UW-01", name: "Broker Application", version: "v1", type: "upload" },
      { id: "DOC-PO-01", name: "HP Agreement", version: "v1", type: "upload" },
      { id: "DOC-PO-02", name: "Purchase Invoice", version: "v1", type: "upload" },
    ],
  },
  {
    id: "PO-CHK-003",
    category: "inter_doc",
    title: "Vehicle registration",
    description: "Exact match vehicle registration across broker application, HP agreement, and purchase invoice. Spacing is ignored.",
    matchType: "exact",
    status: "pass",
    confidence: 0.99,
    outcome: "Registration WR21XYZ confirmed across all documents. Spacing difference (broker: no space, HP/invoice: 'WR21 XYZ') is normalised.",
    dataRows: [
      { field: "Broker application", sourceA: "WR21XYZ", sourceB: "Broker Application", match: true },
      { field: "HP agreement", sourceA: "WR21 XYZ", sourceB: "HP Agreement", match: true, note: "Spacing difference normalised" },
      { field: "Purchase invoice", sourceA: "WR21 XYZ", sourceB: "Purchase Invoice", match: true, note: "Spacing difference normalised" },
    ],
    documents: [
      { id: "DOC-UW-01", name: "Broker Application", version: "v1", type: "upload" },
      { id: "DOC-PO-01", name: "HP Agreement", version: "v1", type: "upload" },
      { id: "DOC-PO-02", name: "Purchase Invoice", version: "v1", type: "upload" },
    ],
  },
  {
    id: "PO-CHK-004",
    category: "inter_doc",
    title: "Vehicle year",
    description: "Exact match vehicle year across broker application and HP agreement.",
    matchType: "exact",
    status: "pass",
    confidence: 0.99,
    outcome: "Vehicle year 2021 matches across both documents.",
    dataRows: [
      { field: "Broker application", sourceA: "2021", sourceB: "Broker Application", match: true },
      { field: "HP agreement", sourceA: "2021", sourceB: "HP Agreement", match: true },
    ],
    documents: [
      { id: "DOC-UW-01", name: "Broker Application", version: "v1", type: "upload" },
      { id: "DOC-PO-01", name: "HP Agreement", version: "v1", type: "upload" },
    ],
  },
  {
    id: "PO-CHK-005",
    category: "inter_doc",
    title: "Vehicle mileage",
    description: "Numeric tolerance check: mileage on broker application vs purchase invoice. Tolerance is ±2,000 miles.",
    matchType: "tolerance",
    tolerance: "±2,000 miles",
    status: "pass",
    confidence: 0.97,
    outcome: "Mileage difference of 1,400 miles (broker: 27,000; invoice: 28,400) is within the ±2,000 mile tolerance.",
    dataRows: [
      { field: "Broker application", sourceA: "27,000 miles", sourceB: "Broker Application", match: true },
      { field: "Purchase invoice", sourceA: "28,400 miles", sourceB: "Purchase Invoice", match: true },
      { field: "Difference", sourceA: "1,400 miles", sourceB: "Max ±2,000 miles", match: true },
    ],
    documents: [
      { id: "DOC-UW-01", name: "Broker Application", version: "v1", type: "upload" },
      { id: "DOC-PO-02", name: "Purchase Invoice", version: "v1", type: "upload" },
    ],
  },
  // ── Financial fields ──
  {
    id: "PO-CHK-006",
    category: "inter_doc",
    title: "Cash price",
    description: "Exact match cash price across broker application, HP agreement, and purchase invoice.",
    matchType: "exact",
    status: "pass",
    confidence: 0.99,
    outcome: "Cash price £14,000 matches exactly across all three documents.",
    dataRows: [
      { field: "Broker application", sourceA: "£14,000", sourceB: "Broker Application", match: true },
      { field: "HP agreement", sourceA: "£14,000", sourceB: "HP Agreement", match: true },
      { field: "Purchase invoice", sourceA: "£14,000", sourceB: "Purchase Invoice", match: true },
    ],
    documents: [
      { id: "DOC-UW-01", name: "Broker Application", version: "v1", type: "upload" },
      { id: "DOC-PO-01", name: "HP Agreement", version: "v1", type: "upload" },
      { id: "DOC-PO-02", name: "Purchase Invoice", version: "v1", type: "upload" },
    ],
  },
  {
    id: "PO-CHK-007",
    category: "inter_doc",
    title: "Deposit amount",
    description: "Exact match deposit across broker application, HP agreement, and purchase invoice.",
    matchType: "exact",
    status: "pass",
    confidence: 0.99,
    outcome: "Deposit £1,500 matches exactly across all three documents.",
    dataRows: [
      { field: "Broker application", sourceA: "£1,500", sourceB: "Broker Application", match: true },
      { field: "HP agreement", sourceA: "£1,500", sourceB: "HP Agreement", match: true },
      { field: "Purchase invoice", sourceA: "£1,500", sourceB: "Purchase Invoice", match: true },
    ],
    documents: [
      { id: "DOC-UW-01", name: "Broker Application", version: "v1", type: "upload" },
      { id: "DOC-PO-01", name: "HP Agreement", version: "v1", type: "upload" },
      { id: "DOC-PO-02", name: "Purchase Invoice", version: "v1", type: "upload" },
    ],
  },
  {
    id: "PO-CHK-008",
    category: "inter_doc",
    title: "Amount to finance / advance",
    description: "Exact match amount to finance across broker application, HP agreement, and purchase invoice.",
    matchType: "exact",
    status: "pass",
    confidence: 0.99,
    outcome: "Amount to finance £12,500 matches exactly across all three documents.",
    dataRows: [
      { field: "Broker application", sourceA: "£12,500", sourceB: "Broker Application", match: true },
      { field: "HP agreement", sourceA: "£12,500", sourceB: "HP Agreement", match: true },
      { field: "Purchase invoice", sourceA: "£12,500", sourceB: "Purchase Invoice", match: true },
    ],
    documents: [
      { id: "DOC-UW-01", name: "Broker Application", version: "v1", type: "upload" },
      { id: "DOC-PO-01", name: "HP Agreement", version: "v1", type: "upload" },
      { id: "DOC-PO-02", name: "Purchase Invoice", version: "v1", type: "upload" },
    ],
  },
  {
    id: "PO-CHK-009",
    category: "inter_doc",
    title: "Monthly payment",
    description: "Exact match monthly payment across broker application and HP agreement.",
    matchType: "exact",
    status: "pass",
    confidence: 0.99,
    outcome: "Monthly payment £287.43 matches across both documents.",
    dataRows: [
      { field: "Broker application", sourceA: "£287.43", sourceB: "Broker Application", match: true },
      { field: "HP agreement", sourceA: "£287.43", sourceB: "HP Agreement", match: true },
    ],
    documents: [
      { id: "DOC-UW-01", name: "Broker Application", version: "v1", type: "upload" },
      { id: "DOC-PO-01", name: "HP Agreement", version: "v1", type: "upload" },
    ],
  },
  {
    id: "PO-CHK-010",
    category: "inter_doc",
    title: "Total amount payable",
    description: "Exact match total amount payable across broker application and HP agreement.",
    matchType: "exact",
    status: "pass",
    confidence: 0.99,
    outcome: "Total amount payable £17,245.80 matches across both documents.",
    dataRows: [
      { field: "Broker application", sourceA: "£17,245.80", sourceB: "Broker Application", match: true },
      { field: "HP agreement", sourceA: "£17,245.80", sourceB: "HP Agreement", match: true },
    ],
    documents: [
      { id: "DOC-UW-01", name: "Broker Application", version: "v1", type: "upload" },
      { id: "DOC-PO-01", name: "HP Agreement", version: "v1", type: "upload" },
    ],
  },
  {
    id: "PO-CHK-011",
    category: "inter_doc",
    title: "APR",
    description: "Exact match APR across broker application and HP agreement.",
    matchType: "exact",
    status: "pass",
    confidence: 0.99,
    outcome: "APR 9.9% matches across both documents.",
    dataRows: [
      { field: "Broker application", sourceA: "9.9%", sourceB: "Broker Application", match: true },
      { field: "HP agreement", sourceA: "9.9%", sourceB: "HP Agreement", match: true },
    ],
    documents: [
      { id: "DOC-UW-01", name: "Broker Application", version: "v1", type: "upload" },
      { id: "DOC-PO-01", name: "HP Agreement", version: "v1", type: "upload" },
    ],
  },
  // ── Intra-doc ──
  {
    id: "PO-CHK-012",
    category: "intra_doc",
    title: "Invoice line items arithmetic",
    description: "Arithmetic check: invoice line items must sum to stated total.",
    matchType: "arithmetic",
    status: "pass",
    confidence: 0.99,
    outcome: "Invoice arithmetic is correct. Vehicle £14,000 + admin fee £295 + delivery £150 = £14,445 (matches stated total).",
    dataRows: [
      { field: "Vehicle price", sourceA: "£14,000", sourceB: "Invoice", match: true },
      { field: "Administration fee", sourceA: "£295", sourceB: "Invoice", match: true },
      { field: "Delivery charge", sourceA: "£150", sourceB: "Invoice", match: true },
      { field: "Stated total", sourceA: "£14,445", sourceB: "Invoice", match: true },
      { field: "Calculated total", sourceA: "£14,445", sourceB: "£14,000 + £295 + £150", match: true },
    ],
    documents: [
      { id: "DOC-PO-02", name: "Purchase Invoice", version: "v1", type: "upload" },
    ],
  },
  // ── Policy rules ──
  {
    id: "PO-CHK-013",
    category: "policy_rules",
    title: "Invoice extras cap",
    description: "Policy rule: combined admin fee and delivery charge must not exceed £400.",
    matchType: "rule",
    status: "fail",
    confidence: 0.99,
    outcome: "Combined extras total £445, which exceeds the £400 policy cap by £45.",
    failReason: "Admin fee £295 + delivery charge £150 = £445. Cap is £400. Broker must revise the invoice.",
    dataRows: [
      { field: "Administration fee", sourceA: "£295", sourceB: "Invoice", match: true },
      { field: "Delivery charge", sourceA: "£150", sourceB: "Invoice", match: true },
      { field: "Combined total", sourceA: "£445", sourceB: "Max £400", match: false, note: "Exceeds cap by £45" },
    ],
    documents: [
      { id: "DOC-PO-02", name: "Purchase Invoice", version: "v1", type: "upload" },
    ],
  },
  {
    id: "PO-CHK-014",
    category: "policy_rules",
    title: "Advance vs Glass's Guide ratio",
    description: "Policy rule: advance must be less than 70% of Glass's Guide Retail value when no deposit is taken. Deposit present — rule is not triggered.",
    matchType: "rule",
    status: "pass",
    confidence: 0.99,
    outcome: "Deposit of £1,500 is present. The 70% GGR rule only applies to zero-deposit deals. Check not triggered.",
    dataRows: [
      { field: "Deposit", sourceA: "£1,500", sourceB: "Broker Application", match: true, note: "Deposit present — 70% rule does not apply" },
      { field: "Advance", sourceA: "£12,500", sourceB: "HP Agreement", match: true },
      { field: "Glass's Guide Retail", sourceA: "£14,200", sourceB: "Broker Application", match: true },
    ],
    documents: [
      { id: "DOC-UW-01", name: "Broker Application", version: "v1", type: "upload" },
      { id: "DOC-PO-01", name: "HP Agreement", version: "v1", type: "upload" },
    ],
  },
  {
    id: "PO-CHK-015",
    category: "policy_rules",
    title: "Finance company on invoice",
    description: "Exact match: invoice must name 'Northgate Motor Finance Ltd' as the finance company.",
    matchType: "exact",
    status: "pass",
    confidence: 0.99,
    outcome: "Invoice correctly names Northgate Motor Finance Ltd.",
    dataRows: [
      { field: "Finance company", sourceA: "Northgate Motor Finance Ltd", sourceB: "Purchase Invoice", match: true },
      { field: "Required value", sourceA: "Northgate Motor Finance Ltd", sourceB: "Policy", match: true },
    ],
    documents: [
      { id: "DOC-PO-02", name: "Purchase Invoice", version: "v1", type: "upload" },
    ],
  },
  {
    id: "PO-CHK-016",
    category: "policy_rules",
    title: "Trade sale indicator",
    description: "Presence check: invoice must not be marked as a trade sale for consumer finance deals.",
    matchType: "rule",
    status: "pass",
    confidence: 0.99,
    outcome: "Invoice is not marked as a trade sale.",
    dataRows: [
      { field: "Trade sale flag", sourceA: "false", sourceB: "Purchase Invoice", match: true },
    ],
    documents: [
      { id: "DOC-PO-02", name: "Purchase Invoice", version: "v1", type: "upload" },
    ],
  },
  // ── Dealer / payee fields ──
  {
    id: "PO-CHK-017",
    category: "entity_resolution",
    title: "Dealer name entity resolution",
    description: "Entity resolution: dealer referred to as 'Midland Motor Group' (broker/HP/funds form), 'Midland Motor Group Ltd' (supplier declaration/giro), and 'Midland Cars Direct' (invoice). FCA register confirms these are the same entity.",
    matchType: "lookup",
    status: "pass",
    confidence: 0.88,
    outcome: "All dealer name variants resolved to 'Midland Motor Group Ltd' (FCA FRN 123456). 'Midland Cars Direct' is confirmed as a registered trading name on the FCA register.",
    dataRows: [
      { field: "Broker application", sourceA: "Midland Motor Group", sourceB: "Broker Application", match: true },
      { field: "HP agreement", sourceA: "Midland Motor Group", sourceB: "HP Agreement", match: true },
      { field: "Purchase invoice", sourceA: "Midland Cars Direct", sourceB: "Purchase Invoice", match: true, note: "Trading name — confirmed via FCA register" },
      { field: "Supplier declaration", sourceA: "Midland Motor Group Ltd", sourceB: "Supplier Declaration", match: true },
      { field: "Giro slip", sourceA: "Midland Motor Group Ltd", sourceB: "Giro Slip", match: true },
      { field: "Funds form", sourceA: "Midland Motor Group", sourceB: "Funds Form", match: true },
      { field: "FCA register", sourceA: "Midland Motor Group Ltd (trading: Midland Cars Direct)", sourceB: "FCA Register Lookup", match: true },
    ],
    documents: [
      { id: "DOC-UW-01", name: "Broker Application", version: "v1", type: "upload" },
      { id: "DOC-PO-02", name: "Purchase Invoice", version: "v1", type: "upload" },
      { id: "DOC-PO-03", name: "Supplier Declaration", version: "v1", type: "upload" },
      { id: "DOC-PO-05", name: "Giro Slip", version: "v1", type: "upload" },
      { id: "DOC-PO-06", name: "Funds Form", version: "v1", type: "upload" },
      { id: "DOC-PO-07", name: "FCA Register Lookup", version: "v1", type: "system" },
    ],
  },
  {
    id: "PO-CHK-018",
    category: "inter_doc",
    title: "Dealer address",
    description: "Fuzzy match dealer address between supplier declaration and FCA register.",
    matchType: "fuzzy",
    status: "pass",
    confidence: 0.93,
    outcome: "Addresses refer to the same premises. Minor formatting differences: supplier declaration abbreviates 'Ind Est' vs FCA's 'Industrial Estate', and FCA includes 'Solihull' which is absent in the supplier declaration.",
    dataRows: [
      { field: "Supplier declaration", sourceA: "Unit 4 Cranmore Ind Est, Shirley, B90 4LF", sourceB: "Supplier Declaration", match: true },
      { field: "FCA register", sourceA: "Unit 4, Cranmore Industrial Estate, Shirley, Solihull, B90 4LF", sourceB: "FCA Register Lookup", match: true, note: "Abbreviated 'Ind Est' and missing 'Solihull'" },
    ],
    documents: [
      { id: "DOC-PO-03", name: "Supplier Declaration", version: "v1", type: "upload" },
      { id: "DOC-PO-07", name: "FCA Register Lookup", version: "v1", type: "system" },
    ],
  },
  {
    id: "PO-CHK-019",
    category: "system_lookup",
    title: "FCA credit brokerage permission",
    description: "System lookup: dealer must hold active FCA credit brokerage permission.",
    matchType: "lookup",
    status: "pass",
    confidence: 0.99,
    outcome: "Midland Motor Group Ltd (FRN 123456) holds active FCA authorisation with credit brokerage permission.",
    dataRows: [
      { field: "FCA status", sourceA: "Authorised", sourceB: "FCA Register Lookup", match: true },
      { field: "Permission", sourceA: "Credit brokerage", sourceB: "FCA Register Lookup", match: true },
      { field: "FRN", sourceA: "123456", sourceB: "FCA Register Lookup", match: true },
    ],
    documents: [
      { id: "DOC-PO-03", name: "Supplier Declaration", version: "v1", type: "upload" },
      { id: "DOC-PO-07", name: "FCA Register Lookup", version: "v1", type: "system" },
    ],
  },
  {
    id: "PO-CHK-020",
    category: "inter_doc",
    title: "Sort code",
    description: "Exact match sort code (6 digits) between giro slip and funds form.",
    matchType: "exact",
    status: "fail",
    confidence: 0.99,
    outcome: "Sort codes do not match. Giro slip shows 204518; funds form shows 204519. One digit differs.",
    failReason: "Sort code mismatch: giro slip 20-45-18 vs funds form 20-45-19. Broker must provide a corrected document confirming the correct sort code.",
    dataRows: [
      { field: "Giro slip", sourceA: "204518", sourceB: "Giro Slip", match: false },
      { field: "Funds form", sourceA: "204519", sourceB: "Funds Form", match: false, note: "Last digit differs — likely a transcription error" },
    ],
    documents: [
      { id: "DOC-PO-05", name: "Giro Slip", version: "v1", type: "upload" },
      { id: "DOC-PO-06", name: "Funds Form", version: "v1", type: "upload" },
    ],
  },
  {
    id: "PO-CHK-021",
    category: "inter_doc",
    title: "Account number",
    description: "Exact match account number (8 digits) between giro slip and funds form.",
    matchType: "exact",
    status: "pass",
    confidence: 0.99,
    outcome: "Account number 41839205 matches across both documents.",
    dataRows: [
      { field: "Giro slip", sourceA: "41839205", sourceB: "Giro Slip", match: true },
      { field: "Funds form", sourceA: "41839205", sourceB: "Funds Form", match: true },
    ],
    documents: [
      { id: "DOC-PO-05", name: "Giro Slip", version: "v1", type: "upload" },
      { id: "DOC-PO-06", name: "Funds Form", version: "v1", type: "upload" },
    ],
  },
  {
    id: "PO-CHK-022",
    category: "inter_doc",
    title: "Payee name on giro",
    description: "Data extraction + fuzzy match: payee name on giro slip must match the FCA-registered dealer entity.",
    matchType: "fuzzy",
    status: "pass",
    confidence: 0.95,
    outcome: "Giro payee 'Midland Motor Group Ltd' matches the FCA-registered entity name.",
    dataRows: [
      { field: "Giro payee name", sourceA: "Midland Motor Group Ltd", sourceB: "Giro Slip", match: true },
      { field: "FCA registered name", sourceA: "Midland Motor Group Ltd", sourceB: "FCA Register Lookup", match: true },
    ],
    documents: [
      { id: "DOC-PO-05", name: "Giro Slip", version: "v1", type: "upload" },
      { id: "DOC-PO-07", name: "FCA Register Lookup", version: "v1", type: "system" },
    ],
  },
  // ── System lookups ──
  {
    id: "PO-CHK-023",
    category: "system_lookup",
    title: "Gold Check (identity / fraud screening)",
    description: "System lookup: Gold Check must return a clean result before payout.",
    matchType: "lookup",
    status: "pass",
    confidence: 0.99,
    outcome: "Gold Check complete. Docket GC-29481. No issues flagged.",
    dataRows: [
      { field: "Gold Check status", sourceA: "Complete", sourceB: "System — Gold Check", match: true },
      { field: "Result", sourceA: "No issues flagged", sourceB: "System — Gold Check", match: true },
      { field: "Docket", sourceA: "GC-29481", sourceB: "System — Gold Check", match: true },
    ],
    documents: [
      { id: "DOC-SYS-01", name: "System Check Results", version: "20/03/2026", type: "system" },
    ],
  },
  {
    id: "PO-CHK-024",
    category: "system_lookup",
    title: "HPI vehicle finance check",
    description: "System lookup: vehicle must be clear of outstanding finance on HPI database.",
    matchType: "lookup",
    status: "pass",
    confidence: 0.99,
    outcome: "HPI check clear. Registration WR21 XYZ — no outstanding finance, no stolen marker, no write-off.",
    dataRows: [
      { field: "HPI status", sourceA: "Clear", sourceB: "System — HPI", match: true },
      { field: "Outstanding finance", sourceA: "None", sourceB: "System — HPI", match: true },
      { field: "Registration checked", sourceA: "WR21 XYZ", sourceB: "System — HPI", match: true },
    ],
    documents: [
      { id: "DOC-SYS-01", name: "System Check Results", version: "20/03/2026", type: "system" },
    ],
  },
]
```

- [ ] **Step 2: Commit intermediate state**

```bash
git add lib/data/checks.ts
git commit -m "feat: add underwriting and payout check data with real AF-2026-00417 values"
```

---

## Task 7: lib/data/checks.ts — accounts checks + helper functions

Append accounts checks and the two helper functions that pages use to query checks by stage.

**Files:** Modify `lib/data/checks.ts` — append after `payoutChecks`

- [ ] **Step 1: Append accounts checks and helpers to lib/data/checks.ts**

```typescript
// ─── Accounts checks ─────────────────────────────────────────────────────────
// Source documents: Purchase Invoice, Funds Form, Giro Slip
// Focus: invoice arithmetic, VAT, bank detail verification

const accountsChecks: DealCheck[] = [
  {
    id: "AC-CHK-001",
    category: "intra_doc",
    title: "Invoice line items arithmetic",
    description: "Arithmetic check: invoice line items must sum to stated total. Same check as payout — accounts team verifies independently.",
    matchType: "arithmetic",
    status: "pass",
    confidence: 0.99,
    outcome: "Invoice arithmetic confirmed: £14,000 + £295 + £150 = £14,445.",
    dataRows: [
      { field: "Vehicle price", sourceA: "£14,000", sourceB: "Purchase Invoice", match: true },
      { field: "Administration fee", sourceA: "£295", sourceB: "Purchase Invoice", match: true },
      { field: "Delivery charge", sourceA: "£150", sourceB: "Purchase Invoice", match: true },
      { field: "Stated total", sourceA: "£14,445", sourceB: "Purchase Invoice", match: true },
    ],
    documents: [
      { id: "DOC-AC-01", name: "Purchase Invoice (MCD-2026-0892)", version: "v1", type: "upload" },
    ],
  },
  {
    id: "AC-CHK-002",
    category: "intra_doc",
    title: "VAT calculation",
    description: "Arithmetic check: if VAT is applicable, VAT amount must equal net × VAT rate. Not applicable for this deal.",
    matchType: "arithmetic",
    status: "pass",
    confidence: 0.99,
    outcome: "VAT not applicable for this deal (private sale, non-VAT-registered vehicle). Check not triggered.",
    dataRows: [
      { field: "VAT applicable", sourceA: "false", sourceB: "Purchase Invoice", match: true },
    ],
    documents: [
      { id: "DOC-AC-01", name: "Purchase Invoice (MCD-2026-0892)", version: "v1", type: "upload" },
    ],
  },
  {
    id: "AC-CHK-003",
    category: "system_lookup",
    title: "Sort code / account verification",
    description: "System lookup: sort code and account number must be verified by bank verification service. Cannot verify when sort code is inconsistent across documents.",
    matchType: "lookup",
    status: "fail",
    confidence: 0.99,
    outcome: "Bank verification cannot proceed. Sort code is inconsistent between giro slip (204518) and funds form (204519). Must be resolved by payout before accounts can verify.",
    failReason: "Prerequisite unresolved: sort code mismatch from payout stage (giro 20-45-18 vs funds form 20-45-19). Accounts cannot run bank verification until payout resolves which sort code is correct.",
    dataRows: [
      { field: "Giro slip sort code", sourceA: "204518", sourceB: "Giro Slip", match: false },
      { field: "Funds form sort code", sourceA: "204519", sourceB: "Funds Form", match: false, note: "Cannot determine correct value" },
      { field: "Account number", sourceA: "41839205", sourceB: "Both documents", match: true },
      { field: "Bank verification", sourceA: "Blocked", sourceB: "Bank Verification Service", match: false },
    ],
    documents: [
      { id: "DOC-AC-02", name: "Funds Form", version: "v1", type: "upload" },
      { id: "DOC-AC-03", name: "Giro Slip", version: "v1", type: "upload" },
    ],
  },
  {
    id: "AC-CHK-004",
    category: "inter_doc",
    title: "Customer details — invoice vs HP agreement",
    description: "Fuzzy match customer name and address between purchase invoice and HP agreement.",
    matchType: "fuzzy",
    status: "pass",
    confidence: 0.93,
    outcome: "Customer identity confirmed. 'A J Piers' (invoice) matches 'Adam James Piers' (HP agreement) via fuzzy match. Address uses 'Birchwood Ln' on invoice vs 'Birchwood Lane' on HP agreement — same property.",
    dataRows: [
      { field: "Name — Invoice", sourceA: "A J Piers", sourceB: "Purchase Invoice", match: true },
      { field: "Name — HP agreement", sourceA: "Adam James Piers", sourceB: "HP Agreement", match: true, note: "Initials vs full name — fuzzy match pass" },
      { field: "Address — Invoice", sourceA: "14 Birchwood Ln, Solihull, B91 3QR", sourceB: "Purchase Invoice", match: true },
      { field: "Address — HP agreement", sourceA: "14 Birchwood Lane, Solihull, B91 3QR", sourceB: "HP Agreement", match: true, note: "'Ln' vs 'Lane' — fuzzy match pass" },
    ],
    documents: [
      { id: "DOC-AC-01", name: "Purchase Invoice (MCD-2026-0892)", version: "v1", type: "upload" },
      { id: "DOC-PO-01", name: "HP Agreement", version: "v1", type: "upload" },
    ],
  },
  {
    id: "AC-CHK-005",
    category: "inter_doc",
    title: "Bank details — funds form vs giro slip",
    description: "Exact match bank account number between funds form and giro slip. Sort code is checked separately.",
    matchType: "exact",
    status: "fail",
    confidence: 0.99,
    outcome: "Account number matches (41839205) but sort code is inconsistent. See AC-CHK-003.",
    failReason: "Sort code mismatch between funds form (204519) and giro slip (204518). Account number is consistent but cannot confirm bank details until sort code is resolved.",
    dataRows: [
      { field: "Account number — Funds form", sourceA: "41839205", sourceB: "Funds Form", match: true },
      { field: "Account number — Giro slip", sourceA: "41839205", sourceB: "Giro Slip", match: true },
      { field: "Sort code — Funds form", sourceA: "204519", sourceB: "Funds Form", match: false },
      { field: "Sort code — Giro slip", sourceA: "204518", sourceB: "Giro Slip", match: false, note: "One digit differs" },
    ],
    documents: [
      { id: "DOC-AC-02", name: "Funds Form", version: "v1", type: "upload" },
      { id: "DOC-AC-03", name: "Giro Slip", version: "v1", type: "upload" },
    ],
  },
]

// ─── Exports ──────────────────────────────────────────────────────────────────

const stageChecksMap: Record<string, DealCheck[]> = {
  underwriting: underwritingChecks,
  payout: payoutChecks,
  accounts: accountsChecks,
}

export function getChecksForStage(stageId: string): DealCheck[] {
  return stageChecksMap[stageId] ?? []
}

export function getChecksByCategory(checks: DealCheck[]): Record<CheckCategory, DealCheck[]> {
  const grouped: Partial<Record<CheckCategory, DealCheck[]>> = {}
  for (const check of checks) {
    if (!grouped[check.category]) grouped[check.category] = []
    grouped[check.category]!.push(check)
  }
  return grouped as Record<CheckCategory, DealCheck[]>
}
```

- [ ] **Step 2: Type-check**

```bash
cd /home/junaid/Dev-Personal/field-recon-engine && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors from `lib/data/checks.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/data/checks.ts
git commit -m "feat: add accounts checks and stage helper functions"
```

---

## Task 8: lib/data/deal-detail.ts + lib/data/conversations.ts

Deal detail (issues, timeline, AI summary) and PAS conversation threads, all grounded in AF-2026-00417.

**Files:** Create `lib/data/deal-detail.ts` and `lib/data/conversations.ts`

- [ ] **Step 1: Create lib/data/deal-detail.ts**

```typescript
import type { Deal } from "./deals"

export interface DealIssue {
  id: string
  severity: "high" | "medium" | "low"
  title: string
  description: string
  section: string
}

export interface TimelineEvent {
  id: string
  timestamp: string
  actor: string
  action: string
  detail?: string
  type: "system" | "human" | "broker" | "ai"
}

export interface DealDetail {
  deal: Deal
  stage: string
  status: "in_progress" | "awaiting_broker" | "completed"
  issues: DealIssue[]
  timeline: TimelineEvent[]
  aiSummary: string
}

const issuesByStage: Record<string, DealIssue[]> = {
  underwriting: [
    {
      id: "ISS-UW-1",
      severity: "medium",
      title: "Employment duration change",
      description: "Duration at current employer increased from '2 years' (Jan 2025) to '3 years' (Mar 2026). Plausible but requires manual confirmation of same employer.",
      section: "checks",
    },
  ],
  payout: [
    {
      id: "ISS-PO-1",
      severity: "high",
      title: "Sort code mismatch",
      description: "Giro slip shows 20-45-18; funds form shows 20-45-19. Cannot release payment until the correct sort code is confirmed.",
      section: "checks",
    },
    {
      id: "ISS-PO-2",
      severity: "high",
      title: "Invoice extras exceed policy cap",
      description: "Admin fee £295 + delivery charge £150 = £445. Cap is £400. Broker must revise the invoice.",
      section: "documents",
    },
  ],
  accounts: [
    {
      id: "ISS-AC-1",
      severity: "high",
      title: "Bank verification blocked by sort code mismatch",
      description: "Sort code inconsistency from payout stage (giro 20-45-18 vs funds form 20-45-19) prevents bank verification. Must be resolved before funding.",
      section: "checks",
    },
    {
      id: "ISS-AC-2",
      severity: "medium",
      title: "Invoice extras cap not resolved",
      description: "£445 in extras (£295 admin + £150 delivery) exceeds £400 cap. Flagged from payout stage — still outstanding.",
      section: "documents",
    },
  ],
}

const sharedTimeline: TimelineEvent[] = [
  { id: "TL-01", timestamp: "18/03/2026 09:14", actor: "System", action: "Application received", detail: "Submitted via CarMoney broker portal", type: "system" },
  { id: "TL-02", timestamp: "18/03/2026 09:15", actor: "AI Agent", action: "Underwriting pre-check run", detail: "Previous application AF-2024-08831 found and compared", type: "ai" },
  { id: "TL-03", timestamp: "18/03/2026 09:16", actor: "AI Agent", action: "Employment duration flagged", detail: "Duration changed from '2 years' to '3 years' — sent for manual review", type: "ai" },
  { id: "TL-04", timestamp: "19/03/2026 11:30", actor: "J. Hadley (Underwriting)", action: "Manual review completed", detail: "Employment duration accepted — same employer confirmed via phone", type: "human" },
  { id: "TL-05", timestamp: "19/03/2026 11:35", actor: "System", action: "Passed to payout", detail: "Underwriting sign-off recorded", type: "system" },
  { id: "TL-06", timestamp: "20/03/2026 09:17", actor: "System", action: "Document pack received", detail: "7 documents uploaded by CarMoney: HP Agreement, Invoice, Supplier Declaration, Mandate, Giro, Funds Form, FCA Lookup", type: "system" },
  { id: "TL-07", timestamp: "20/03/2026 09:18", actor: "AI Agent", action: "Payout checks run", detail: "24 checks run — 2 failures identified: sort code mismatch and extras cap exceeded", type: "ai" },
  { id: "TL-08", timestamp: "20/03/2026 09:19", actor: "System", action: "PAS raised — sort code mismatch", detail: "Automated query sent to broker: giro 20-45-18 vs funds form 20-45-19", type: "system" },
  { id: "TL-09", timestamp: "20/03/2026 09:20", actor: "System", action: "PAS raised — invoice extras", detail: "Automated query sent to broker: £445 extras exceeds £400 cap", type: "system" },
  { id: "TL-10", timestamp: "20/03/2026 14:45", actor: "CarMoney (Midland Motor Group)", action: "Broker response received", detail: "Sort code: confirmed correct sort code is 20-45-18 (giro). Funds form was a transcription error.", type: "broker" },
  { id: "TL-11", timestamp: "21/03/2026 09:05", actor: "AI Agent", action: "Re-analysis triggered", detail: "Awaiting revised invoice to resolve extras cap before re-run", type: "ai" },
]

export function getDealDetail(stageId: string, deal: Deal): DealDetail {
  const aiSummaryByStage: Record<string, string> = {
    underwriting: `**Adam Piers** has applied for vehicle finance of **£12,500** for a **2021 Ford Focus ST-Line** submitted via CarMoney on 18 March 2026.\n\nA previous application (AF-2024-08831, January 2025) was found on file. All customer details are consistent except employment duration, which increased from '2 years' to '3 years' — plausible given 14 months have elapsed but flagged for manual confirmation.\n\n**Status:** Manual review required — confirm same employer before passing to payout.`,
    payout: `**Adam Piers** — **AF-2026-00417**. Document pack received 20 March 2026. 24 payout checks run — 22 pass, 2 fail.\n\n**Outstanding issues:**\n- Sort code mismatch: giro 20-45-18 vs funds form 20-45-19. PAS raised. Broker has responded confirming giro is correct — awaiting corrected funds form.\n- Invoice extras £445 exceed £400 policy cap. PAS raised. Awaiting revised invoice from dealer.\n\n**Risk:** Both issues are potentially simple corrections. No fraud indicators. Vehicle clear on HPI. FCA permission confirmed for Midland Motor Group Ltd.`,
    accounts: `**Adam Piers** — **AF-2026-00417** passed from payout with 2 unresolved issues.\n\n**Blocking funding:**\n- Sort code inconsistency (giro 20-45-18 vs funds form 20-45-19) prevents bank verification. Payout has broker response confirming giro is correct — corrected funds form not yet received.\n- Invoice extras £445 > £400 cap — still outstanding from payout.\n\nAll other financial checks pass: invoice arithmetic correct, VAT not applicable, customer details confirmed.`,
  }

  return {
    deal,
    stage: stageId,
    status: "in_progress",
    issues: issuesByStage[stageId] ?? [],
    timeline: sharedTimeline,
    aiSummary: aiSummaryByStage[stageId] ?? "",
  }
}
```

- [ ] **Step 2: Create lib/data/conversations.ts**

```typescript
export interface ConversationMessage {
  id: string
  sender: string
  senderRole: "broker" | "customer" | "internal" | "agent"
  content: string
  timestamp: string
  isInternalNote?: boolean
}

export interface ConversationThread {
  id: string
  subject: string
  participants: string[]
  status: "open" | "resolved" | "awaiting"
  lastActivity: string
  messages: ConversationMessage[]
  aiSummary: string
  aiConfidence?: number
  aiQuestions?: string[]
  suggestedAction?: string
}

export const stageConversations: Record<string, ConversationThread[]> = {
  underwriting: [
    {
      id: "PAS-UW-001",
      subject: "Employment duration — AF-2026-00417",
      participants: ["CarMoney (Midland Motor Group)", "J. Hadley (Underwriting)"],
      status: "resolved",
      lastActivity: "19/03/2026",
      messages: [
        { id: "m1", sender: "AI Agent", senderRole: "agent", content: "Automated check: Employment duration changed from '2 years' (previous application AF-2024-08831, Jan 2025) to '3 years' (current application). Please confirm applicant is still at the same employer.", timestamp: "18/03/2026 09:16" },
        { id: "m2", sender: "CarMoney (Midland Motor Group)", senderRole: "broker", content: "Confirmed — Adam Piers is still employed at the same company (Solihull Manufacturing Ltd). The increase from 2 to 3 years reflects the additional time since the last application.", timestamp: "18/03/2026 14:30" },
        { id: "m3", sender: "J. Hadley (Underwriting)", senderRole: "internal", content: "Confirmed via phone with broker. Same employer — no change. Underwriting passed.", timestamp: "19/03/2026 11:30", isInternalNote: true },
      ],
      aiSummary: "Employment duration discrepancy resolved. Applicant remains at same employer — duration increase is consistent with elapsed time since previous application.",
      aiConfidence: 0.97,
      suggestedAction: "No further action required. Mark as resolved.",
    },
  ],
  payout: [
    {
      id: "PAS-PO-001",
      subject: "Sort code mismatch — AF-2026-00417",
      participants: ["CarMoney (Midland Motor Group)", "Payout Team"],
      status: "awaiting",
      lastActivity: "20/03/2026",
      messages: [
        { id: "m1", sender: "AI Agent", senderRole: "agent", content: "Automated PAS: Sort code discrepancy detected. Giro slip shows 20-45-18; funds form shows 20-45-19. Please confirm correct sort code and resubmit the incorrect document.", timestamp: "20/03/2026 09:19" },
        { id: "m2", sender: "CarMoney (Midland Motor Group)", senderRole: "broker", content: "Apologies for the error. Correct sort code is 20-45-18 as on the giro slip. The funds form had a transcription error on the last digit. We will resubmit a corrected funds form shortly.", timestamp: "20/03/2026 14:45" },
        { id: "m3", sender: "Payout Team", senderRole: "internal", content: "Broker has confirmed giro slip sort code (20-45-18) is correct. Awaiting corrected funds form before re-run.", timestamp: "20/03/2026 15:00", isInternalNote: true },
      ],
      aiSummary: "Sort code discrepancy: giro 20-45-18 vs funds form 20-45-19. Broker confirmed giro is correct — transcription error on funds form. Corrected funds form not yet received.",
      aiConfidence: 0.96,
      suggestedAction: "Wait for corrected funds form. Re-run sort code check on receipt.",
    },
    {
      id: "PAS-PO-002",
      subject: "Invoice extras cap exceeded — AF-2026-00417",
      participants: ["CarMoney (Midland Motor Group)", "Payout Team"],
      status: "open",
      lastActivity: "20/03/2026",
      messages: [
        { id: "m1", sender: "AI Agent", senderRole: "agent", content: "Automated PAS: Invoice extras exceed policy cap. Administration fee £295 + delivery charge £150 = £445. Maximum permitted is £400. Please provide a revised invoice with combined extras not exceeding £400.", timestamp: "20/03/2026 09:20" },
        { id: "m2", sender: "Payout Team", senderRole: "internal", content: "Sent to broker. Awaiting revised invoice.", timestamp: "20/03/2026 09:21", isInternalNote: true },
      ],
      aiSummary: "Invoice extras of £445 (admin £295 + delivery £150) exceed the £400 cap. Broker has been notified. No response yet.",
      aiConfidence: 0.99,
      aiQuestions: ["Has broker acknowledged the cap limit?", "Is either the admin fee or delivery charge negotiable?"],
      suggestedAction: "Chase broker if no response within 24 hours.",
    },
  ],
  accounts: [
    {
      id: "PAS-AC-001",
      subject: "Sort code — funding blocked — AF-2026-00417",
      participants: ["CarMoney (Midland Motor Group)", "Accounts Team"],
      status: "awaiting",
      lastActivity: "21/03/2026",
      messages: [
        { id: "m1", sender: "Accounts Team", senderRole: "internal", content: "Picked up from payout. Sort code inconsistency (giro 20-45-18, funds form 20-45-19) is blocking bank verification and therefore funding. Payout has broker confirmation that 20-45-18 is correct. Waiting on corrected funds form from broker.", timestamp: "21/03/2026 09:00", isInternalNote: true },
        { id: "m2", sender: "AI Agent", senderRole: "agent", content: "Bank verification cannot proceed until sort code is consistent across documents. Once corrected funds form is received, verification will be re-triggered automatically.", timestamp: "21/03/2026 09:01" },
      ],
      aiSummary: "Funding blocked pending corrected funds form (sort code 20-45-19 → 20-45-18). Broker confirmed correct sort code via payout PAS. No further broker action needed once document is resubmitted.",
      aiConfidence: 0.97,
      suggestedAction: "Await corrected funds form. Bank verification will auto-trigger on receipt.",
    },
  ],
}

export function getConversationsForStage(stageId: string): ConversationThread[] {
  return stageConversations[stageId] ?? []
}
```

- [ ] **Step 3: Type-check all data files**

```bash
cd /home/junaid/Dev-Personal/field-recon-engine && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/data/deal-detail.ts lib/data/conversations.ts
git commit -m "feat: add deal detail, timeline, AI summaries and PAS conversations"
```

---

## Task 9: Port shared UI components

Port all non-routing components from `dealflow-dashboard/src/components/` to `components/`. These are pure React — only the `import` source for `Deal` type changes.

**Files:** Create all listed component files

The source files to copy from are in `/home/junaid/Dev-Personal/dealflow-dashboard/src/components/`. For each, the change is: replace `from "@/data/mock*"` with `from "@/lib/data/*"` and replace any React Router imports (`useNavigate`, `useParams` from `react-router-dom`) with Next.js equivalents (`useRouter`, `useParams` from `next/navigation`). Add `"use client"` at top of every file.

- [ ] **Step 1: Port ConfidenceBadge.tsx**

Copy `dealflow-dashboard/src/components/ConfidenceBadge.tsx` to `components/ConfidenceBadge.tsx`. Add `"use client"` at the top. No other changes needed (no routing, no data imports).

- [ ] **Step 2: Port KpiCard.tsx**

Copy `dealflow-dashboard/src/components/KpiCard.tsx` to `components/KpiCard.tsx`. Add `"use client"` at the top. No other changes needed.

- [ ] **Step 3: Port AgentChatButton.tsx**

Copy `dealflow-dashboard/src/components/AgentChatButton.tsx` to `components/AgentChatButton.tsx`. Add `"use client"` at the top.

- [ ] **Step 4: Port StageDistributionChart.tsx**

Copy `dealflow-dashboard/src/components/StageDistributionChart.tsx` to `components/StageDistributionChart.tsx`. Add `"use client"` at the top. Check if it imports `recharts` — if so, run `npm install recharts` first.

```bash
cd /home/junaid/Dev-Personal/field-recon-engine && npm install recharts
```

- [ ] **Step 5: Port TeamBreakdownCard.tsx**

Copy `dealflow-dashboard/src/components/TeamBreakdownCard.tsx` to `components/TeamBreakdownCard.tsx`. Add `"use client"` at the top.

- [ ] **Step 6: Port DealTopBanner.tsx**

Copy `dealflow-dashboard/src/components/DealTopBanner.tsx` to `components/DealTopBanner.tsx`. Add `"use client"` at the top. Update imports:
- `from "@/data/mockDeals"` → `from "@/lib/data/deals"` (for the `Deal` type)
- `from "@/data/mockDealDetails"` → `from "@/lib/data/deal-detail"` (for `DealIssue`)

- [ ] **Step 7: Port DealCard.tsx**

Copy `dealflow-dashboard/src/components/DealCard.tsx` to `components/DealCard.tsx`.

Add `"use client"` at top.

Replace React Router imports:
```typescript
// Remove:
import { useNavigate, useParams } from "react-router-dom"

// Add:
import { useRouter, useParams } from "next/navigation"
```

Replace navigation calls:
```typescript
// Remove:
const navigate = useNavigate()
// ...
onClick={() => teamId && navigate(`/team/${teamId}/deal/${deal.id}`)}

// Add:
const router = useRouter()
// ...
onClick={() => stageId && router.push(`/stage/${stageId}/deal/${deal.id}`)}
```

Replace params destructuring:
```typescript
// Remove:
const { teamId } = useParams<{ teamId: string }>()

// Add:
const params = useParams<{ stageId: string }>()
const stageId = params?.stageId
```

Update data import:
```typescript
// Remove:
import type { Deal } from "@/data/mockDeals"

// Add:
import type { Deal } from "@/lib/data/deals"
```

- [ ] **Step 8: Commit**

```bash
git add components/
git commit -m "feat: port shared UI components from dealflow-dashboard"
```

---

## Task 10: Port NavLink.tsx + AppSidebar.tsx + AppLayout.tsx

These contain the most React Router usage. NavLink uses `NavLink` from react-router-dom; AppSidebar uses `useLocation`, `useNavigate`; AppLayout uses `<Outlet />`.

**Files:** Create `components/NavLink.tsx`, `components/AppSidebar.tsx`, `components/AppLayout.tsx`

- [ ] **Step 1: Create components/NavLink.tsx**

The original uses `NavLink` from react-router-dom for active-state detection. Rewrite using Next.js `Link` and `usePathname`:

```typescript
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface NavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  activeClassName?: string
  end?: boolean
}

export function NavLink({ href, children, className = "", activeClassName = "", end = false }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = end ? pathname === href : pathname.startsWith(href)
  return (
    <Link href={href} className={`${className} ${isActive ? activeClassName : ""}`}>
      {children}
    </Link>
  )
}
```

- [ ] **Step 2: Create components/AppSidebar.tsx**

Copy `dealflow-dashboard/src/components/AppSidebar.tsx` to `components/AppSidebar.tsx`.

Add `"use client"` at top.

Replace React Router imports:
```typescript
// Remove:
import { useLocation, useNavigate } from "react-router-dom"
import { NavLink } from "@/components/NavLink"

// Add:
import { usePathname, useRouter } from "next/navigation"
import { NavLink } from "@/components/NavLink"
```

Replace `useLocation()` with `usePathname()`:
```typescript
// Remove:
const location = useLocation()
const navigate = useNavigate()

// Add:
const pathname = usePathname()
const router = useRouter()
```

Replace all `location.pathname` with `pathname`.

Replace navigation calls:
```typescript
// Remove:
navigate(`/team/${currentTeamId}`)

// Add:
router.push(`/stage/${currentStageId}`)
```

Update path regex patterns (change `team` to `stage`):
```typescript
// Remove:
const dealMatch = location.pathname.match(/^\/team\/(\w+)\/deal\/([^/]+)/)
const teamFromPath = location.pathname.match(/^\/team\/(\w+)/)?.[1]

// Add:
const dealMatch = pathname.match(/^\/stage\/(\w+)\/deal\/([^/]+)/)
const stageFromPath = pathname.match(/^\/stage\/(\w+)/)?.[1]
```

Rename `currentTeamId` → `currentStageId`, `teamFromPath` → `stageFromPath` throughout.

Update data import:
```typescript
// Remove:
import { teamDealsMap } from "@/data/mockDeals"

// Add:
import { stageDealsMap } from "@/lib/data/deals"
```

Replace `teamDealsMap` → `stageDealsMap`, `teamId` → `stageId` throughout.

Update nav items URLs (`/team/` → `/stage/`):
```typescript
const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Underwriting", url: "/stage/underwriting", icon: Shield },
  { title: "Payout", url: "/stage/payout", icon: FileCheck },
  { title: "Accounts", url: "/stage/accounts", icon: Calculator },
]
```

Update all deal section path construction:
```typescript
// Remove:
const sectionPath = section.hash === "summary"
  ? `/team/${currentTeamId}/deal/${currentDealId}`
  : `/team/${currentTeamId}/deal/${currentDealId}/${section.hash}`

// Add:
const sectionPath = section.hash === "summary"
  ? `/stage/${currentStageId}/deal/${currentDealId}`
  : `/stage/${currentStageId}/deal/${currentDealId}/${section.hash}`
```

- [ ] **Step 3: Create components/AppLayout.tsx**

```typescript
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-card px-6 gap-3">
            <SidebarTrigger className="text-muted-foreground" />
            <h1 className="text-lg font-semibold text-foreground">DealFlow</h1>
          </header>
          <div className="flex-1 overflow-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
```

Note: `AppLayout` itself does not need `"use client"` — it just passes `{children}`. `AppSidebar` is already client-side.

- [ ] **Step 4: Type-check**

```bash
cd /home/junaid/Dev-Personal/field-recon-engine && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors in components.

- [ ] **Step 5: Commit**

```bash
git add components/NavLink.tsx components/AppSidebar.tsx components/AppLayout.tsx
git commit -m "feat: port AppLayout, AppSidebar, NavLink with Next.js routing"
```

---

## Task 11: Root layout + top dashboard

Wire the AppLayout into Next.js root layout and replace the default page with the Dashboard.

**Files:** Modify `app/layout.tsx`, replace `app/page.tsx`

- [ ] **Step 1: Update app/layout.tsx**

Replace the current contents of `app/layout.tsx` with:

```typescript
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { AppLayout } from "@/components/AppLayout"

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DealFlow — Vehicle Finance",
  description: "Automated deal checking system",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Replace app/page.tsx**

Copy `dealflow-dashboard/src/pages/Dashboard.tsx` to `app/page.tsx`.

Add `"use client"` at top.

Remove any React Router imports. No data imports needed — Dashboard uses only hardcoded chart data and KPI values.

The component function must be the `default export` named however you like (e.g. `export default function DashboardPage`).

- [ ] **Step 3: Run dev server and verify**

```bash
cd /home/junaid/Dev-Personal/field-recon-engine && npm run dev
```

Open `http://localhost:3000`. Expected: sidebar + header visible, dashboard KPI cards and charts visible. No console errors.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/page.tsx
git commit -m "feat: wire AppLayout into root, add top-level dashboard"
```

---

## Task 12: Stage dashboard page

**Files:** Create `app/stage/[stageId]/page.tsx`

- [ ] **Step 1: Create app/stage/[stageId]/page.tsx**

Copy `dealflow-dashboard/src/pages/TeamDashboard.tsx` to `app/stage/[stageId]/page.tsx`.

Add `"use client"` at top.

Replace React Router imports:
```typescript
// Remove:
import { useParams } from "react-router-dom"

// Add:
import { useParams } from "next/navigation"
```

Replace data imports:
```typescript
// Remove:
import { teamDealsMap } from "@/data/mockDeals"

// Add:
import { stageDealsMap, stageLabels } from "@/lib/data/deals"
```

Replace `teamDealsMap` → `stageDealsMap`, `teamLabels` (the local const) → `stageLabels` (imported), `teamId` → `stageId` throughout.

Update `useParams` usage (Next.js `useParams` returns a plain object, not typed generics in the same way):
```typescript
const params = useParams<{ stageId: string }>()
const stageId = params?.stageId ?? ""
const label = stageLabels[stageId] || stageId
const deals = stageDealsMap[stageId]
```

For DealCard, update the `accentColor` classes — these use `bg-primary`, `bg-status-warning`, `bg-status-success`, `bg-status-info` which all now resolve correctly from Task 2.

- [ ] **Step 2: Verify in browser**

Navigate to `http://localhost:3000/stage/underwriting`. Expected: deal cards with queues visible, AF-2026-00417 appearing first in Action Required. Click on AF-2026-00417 — should attempt to navigate to `/stage/underwriting/deal/AF-2026-00417` (404 for now — deal detail not yet created).

- [ ] **Step 3: Commit**

```bash
git add app/stage/
git commit -m "feat: add stage dashboard page"
```

---

## Task 13: Deal layout

**Files:** Create `app/stage/[stageId]/deal/[dealId]/layout.tsx`

The deal layout wraps all deal sub-pages with the `DealTopBanner`. In the dealflow-dashboard this was handled inline in each page — extract it here to a shared layout so the banner appears on every deal page without duplication.

- [ ] **Step 1: Create app/stage/[stageId]/deal/[dealId]/layout.tsx**

```typescript
export default function DealLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

This is intentionally minimal — each deal page includes its own `DealTopBanner` (as in the original). The layout simply establishes the route segment. If you want to extract the banner into the layout later, that's a future concern.

- [ ] **Step 2: Commit**

```bash
git add app/stage/
git commit -m "feat: add deal route layout segment"
```

---

## Task 14: Deal detail page

**Files:** Create `app/stage/[stageId]/deal/[dealId]/page.tsx`

- [ ] **Step 1: Create app/stage/[stageId]/deal/[dealId]/page.tsx**

Copy `dealflow-dashboard/src/pages/DealDetail.tsx` to `app/stage/[stageId]/deal/[dealId]/page.tsx`.

Add `"use client"` at top.

Replace React Router imports:
```typescript
// Remove:
import { useParams, useNavigate } from "react-router-dom"

// Add:
import { useParams, useRouter } from "next/navigation"
```

Replace `useNavigate` → `useRouter`, `navigate(...)` → `router.push(...)`.

Replace data imports and wiring:
```typescript
// Remove:
import { teamDealsMap } from "@/data/mockDeals"
import { getDealDetail } from "@/data/mockDealDetails"
import type { DealIssue, TimelineEvent } from "@/data/mockDealDetails"

// Add:
import { getDealById } from "@/lib/data/deals"
import { getDealDetail } from "@/lib/data/deal-detail"
import type { DealIssue, TimelineEvent } from "@/lib/data/deal-detail"
```

Replace the `detail` derivation logic:
```typescript
// Remove the existing useMemo that digs through teamDealsMap:
const detail = useMemo(() => {
  if (!teamId || !dealId) return null
  const teamData = teamDealsMap[teamId]
  if (!teamData) return null
  const allDeals = [...]
  return getDealDetail(dealId, allDeals, teamId)
}, [teamId, dealId])

// Replace with:
const params = useParams<{ stageId: string; dealId: string }>()
const stageId = params?.stageId ?? ""
const dealId = params?.dealId ?? ""

const detail = useMemo(() => {
  const deal = getDealById(stageId, dealId)
  if (!deal) return null
  return getDealDetail(stageId, deal)
}, [stageId, dealId])
```

Update "Go to first issue" navigation to use `/stage/` routes:
```typescript
// Remove:
navigate(route ? `/team/${teamId}/deal/${dealId}/${route}` : `/team/${teamId}/deal/${dealId}`)

// Add:
router.push(route ? `/stage/${stageId}/deal/${dealId}/${route}` : `/stage/${stageId}/deal/${dealId}`)
```

Update `DealTopBanner` prop `team` → `stage` if the component uses that prop name (check DealTopBanner source — if it uses `team: string`, pass `stage: stageId`).

- [ ] **Step 2: Commit**

```bash
git add app/stage/
git commit -m "feat: add deal detail page"
```

---

## Task 15: Deal checks page

**Files:** Create `app/stage/[stageId]/deal/[dealId]/checks/page.tsx`

- [ ] **Step 1: Create checks page**

Copy `dealflow-dashboard/src/pages/DealChecks.tsx` to `app/stage/[stageId]/deal/[dealId]/checks/page.tsx`.

Add `"use client"` at top.

Replace React Router imports:
```typescript
// Remove:
import { useParams } from "react-router-dom"

// Add:
import { useParams } from "next/navigation"
```

Replace data imports:
```typescript
// Remove:
import { teamDealsMap } from "@/data/mockDeals"
import { getDealDetail } from "@/data/mockDealDetails"
import { getChecksForTeam, getChecksByCategory, categoryLabels, matchTypeLabels } from "@/data/mockChecks"
import type { DealCheck, CheckCategory, CheckStatus } from "@/data/mockChecks"

// Add:
import { getDealById } from "@/lib/data/deals"
import { getDealDetail } from "@/lib/data/deal-detail"
import { getChecksForStage, getChecksByCategory, categoryLabels, matchTypeLabels } from "@/lib/data/checks"
import type { DealCheck, CheckCategory, CheckStatus } from "@/lib/data/checks"
```

Replace params and data wiring:
```typescript
const params = useParams<{ stageId: string; dealId: string }>()
const stageId = params?.stageId ?? ""
const dealId = params?.dealId ?? ""

const detail = useMemo(() => {
  const deal = getDealById(stageId, dealId)
  if (!deal) return null
  return getDealDetail(stageId, deal)
}, [stageId, dealId])

const checks = useMemo(() => getChecksForStage(stageId), [stageId])
```

Replace `teamId` → `stageId` throughout.

- [ ] **Step 2: Commit**

```bash
git add app/stage/
git commit -m "feat: add deal checks page with grounded check data"
```

---

## Task 16: Deal documents page

**Files:** Create `app/stage/[stageId]/deal/[dealId]/documents/page.tsx`

- [ ] **Step 1: Create documents page**

Copy `dealflow-dashboard/src/pages/DealDocuments.tsx` to `app/stage/[stageId]/deal/[dealId]/documents/page.tsx`.

Add `"use client"` at top.

Replace React Router imports with Next.js equivalents (same pattern as previous tasks).

Replace data imports:
```typescript
// Remove:
import { getDocumentsForTeam, getDocumentsByGroup, docTypeLabels } from "@/data/mockDocuments"
import type { DealDocument } from "@/data/mockDocuments"

// Add:
import { getDocumentsForStage, getDocumentsByGroup, docStatusLabels } from "@/lib/data/documents"
import type { DealDocument } from "@/lib/data/documents"
```

Note: `lib/data/documents.ts` exports `docStatusLabels` not `docTypeLabels` — update any references.

Replace params and data wiring:
```typescript
const params = useParams<{ stageId: string; dealId: string }>()
const stageId = params?.stageId ?? ""
const dealId = params?.dealId ?? ""

const detail = useMemo(() => {
  const deal = getDealById(stageId, dealId)
  if (!deal) return null
  return getDealDetail(stageId, deal)
}, [stageId, dealId])

const documents = useMemo(() => getDocumentsForStage(stageId), [stageId])
```

Replace `teamId` → `stageId` throughout.

- [ ] **Step 2: Commit**

```bash
git add app/stage/
git commit -m "feat: add deal documents page with grounded document pack"
```

---

## Task 17: Deal conversations page

**Files:** Create `app/stage/[stageId]/deal/[dealId]/conversations/page.tsx`

- [ ] **Step 1: Create conversations page**

Copy `dealflow-dashboard/src/pages/DealConversations.tsx` to `app/stage/[stageId]/deal/[dealId]/conversations/page.tsx`.

Add `"use client"` at top.

Replace React Router imports with Next.js equivalents.

Replace data imports:
```typescript
// Remove:
import { mockConversations, ConversationThread } from "@/data/mockConversations"

// Add:
import { getConversationsForStage } from "@/lib/data/conversations"
import type { ConversationThread } from "@/lib/data/conversations"
```

Replace `mockConversations` with `getConversationsForStage(stageId)`:
```typescript
const params = useParams<{ stageId: string; dealId: string }>()
const stageId = params?.stageId ?? ""
const dealId = params?.dealId ?? ""
const conversations = getConversationsForStage(stageId)
const [selectedThread, setSelectedThread] = useState<ConversationThread>(conversations[0])
```

Replace `teamId` → `stageId` throughout (data lookups, DealTopBanner props).

- [ ] **Step 2: Commit**

```bash
git add app/stage/
git commit -m "feat: add deal conversations page with PAS threads"
```

---

## Task 18: Deal decision page

**Files:** Create `app/stage/[stageId]/deal/[dealId]/decision/page.tsx`

- [ ] **Step 1: Create decision page**

Copy `dealflow-dashboard/src/pages/DealDecision.tsx` to `app/stage/[stageId]/deal/[dealId]/decision/page.tsx`.

Add `"use client"` at top.

Replace React Router imports with Next.js equivalents.

Replace data imports:
```typescript
// Remove:
import { teamDealsMap } from "@/data/mockDeals"
import { getDealDetail } from "@/data/mockDealDetails"
import { getChecksForTeam } from "@/data/mockChecks"
import type { CheckStatus } from "@/data/mockChecks"

// Add:
import { getDealById } from "@/lib/data/deals"
import { getDealDetail } from "@/lib/data/deal-detail"
import { getChecksForStage } from "@/lib/data/checks"
import type { CheckStatus } from "@/lib/data/checks"
```

Replace params and data wiring:
```typescript
const params = useParams<{ stageId: string; dealId: string }>()
const stageId = params?.stageId ?? ""
const dealId = params?.dealId ?? ""

const detail = useMemo(() => {
  const deal = getDealById(stageId, dealId)
  if (!deal) return null
  return getDealDetail(stageId, deal)
}, [stageId, dealId])

const checks = useMemo(() => getChecksForStage(stageId), [stageId])
```

The `derivePendingActions` function in `DealDecision` uses `teamId` as a key — update to `stageId`. The pending actions content references underwriting/payout/accounts which remain valid.

Update the application details section (`getApplicationDetails`) to use real deal data:
```typescript
function getApplicationDetails(): ApplicationSection[] {
  return [
    {
      title: "Applicant Details",
      rows: [
        { label: "Full name", value: "Adam James Piers" },
        { label: "Date of birth", value: "15/03/1988" },
        { label: "Address", value: "14 Birchwood Lane, Solihull, B91 3QR" },
        { label: "Employment", value: "Full-time, 3 years at current employer" },
      ],
    },
    {
      title: "Vehicle",
      rows: [
        { label: "Make / model", value: "2021 Ford Focus ST-Line 1.0T EcoBoost" },
        { label: "Registration", value: "WR21 XYZ" },
        { label: "Mileage", value: "28,400 miles (at invoice)" },
      ],
    },
    {
      title: "Finance",
      rows: [
        { label: "Cash price", value: "£14,000" },
        { label: "Deposit", value: "£1,500" },
        { label: "Amount financed", value: "£12,500" },
        { label: "Monthly payment", value: "£287.43 × 48 months" },
        { label: "Total payable", value: "£17,245.80" },
        { label: "APR", value: "9.9%" },
      ],
    },
    {
      title: "Dealer",
      rows: [
        { label: "Name", value: "Midland Motor Group Ltd" },
        { label: "FCA FRN", value: "123456" },
        { label: "Broker", value: "CarMoney" },
      ],
    },
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add app/stage/
git commit -m "feat: add deal decision page with real application details"
```

---

## Task 19: Final type-check and build

**Files:** none — verification only

- [ ] **Step 1: Full type-check**

```bash
cd /home/junaid/Dev-Personal/field-recon-engine && npx tsc --noEmit 2>&1
```

Expected: no errors. Fix any type mismatches found (common ones: `useParams` returning `{ [key: string]: string }` instead of a typed object — use optional chaining `params?.stageId ?? ""`).

- [ ] **Step 2: Lint**

```bash
npm run lint 2>&1
```

Expected: no errors. Fix any lint issues.

- [ ] **Step 3: Production build**

```bash
npm run build 2>&1
```

Expected: build completes successfully. All pages rendered as static or server components where possible.

- [ ] **Step 4: Smoke test in browser**

With `npm run dev`, verify each route:

| Route | Expected |
|---|---|
| `/` | Dashboard with KPIs and charts |
| `/stage/underwriting` | Deal queues, AF-2026-00417 first in Action Required |
| `/stage/payout` | Deal queues, AF-2026-00417 with "2 checks failing" context |
| `/stage/accounts` | Deal queues, AF-2026-00417 with "Sort code unverified" context |
| `/stage/underwriting/deal/AF-2026-00417` | Deal detail with 1 issue, timeline starting 18/03/2026 |
| `/stage/payout/deal/AF-2026-00417/checks` | 24 checks, 2 FAIL (sort code + extras cap) |
| `/stage/payout/deal/AF-2026-00417/documents` | 7 documents, 3 with issue status |
| `/stage/payout/deal/AF-2026-00417/conversations` | 2 PAS threads |
| `/stage/payout/deal/AF-2026-00417/decision` | Real application details, pending actions |

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete port of dealflow-dashboard UI grounded in AF-2026-00417 domain data"
```
