# Design: Port dealflow-dashboard UI into field-recon-engine

**Date:** 2026-04-05  
**Status:** Approved

---

## Overview

Port the complete dealflow-dashboard UI (Vite/React/React Router) into field-recon-engine (Next.js App Router), replacing all generic mock data with domain-correct data grounded in:

- `input/` JSON files (deal AF-2026-00417: Adam Piers, Ford Focus ST-Line, Midland Motor Group)
- `field_reference_and_check_types.md` (check types, field inventory, processing stages)
- `lib/schemas/` (Zod schema definitions per document type)

The result is a working demo of the automated deal-checking system with one fully grounded deal (AF-2026-00417) navigable across three stages, surrounded by lightweight placeholder deals in each stage dashboard.

---

## Routing Structure

Next.js App Router file-based routing:

```
app/
├── layout.tsx                             # Root shell — AppLayout + sidebar
├── page.tsx                               # Top-level overview dashboard
├── stage/
│   └── [stageId]/
│       ├── page.tsx                       # Stage dashboard (underwriting / payout / accounts)
│       └── deal/
│           └── [dealId]/
│               ├── layout.tsx             # Deal shell — top banner + tab nav
│               ├── page.tsx               # Deal detail / summary
│               ├── checks/page.tsx
│               ├── documents/page.tsx
│               ├── conversations/page.tsx
│               └── decision/page.tsx
```

Valid `stageId` values: `underwriting`, `payout`, `accounts`.  
The fully grounded deal is `AF-2026-00417`. Other deal IDs render with placeholder data or a "no data" state.

---

## Component Porting

All components from `dealflow-dashboard/src/components/` are ported to `components/` with the following mechanical changes only — no logic changes:

| Change | From | To |
|---|---|---|
| Routing hook | `useParams()` from `react-router-dom` | `useParams()` from `next/navigation` |
| Link component | `<Link to="...">` | `<Link href="...">` from `next/link` |
| Navigation hook | `useNavigate()` | `useRouter()` from `next/navigation` |
| Router wrapper | `<BrowserRouter>` / `<Routes>` | Removed — Next.js file-system routing |
| Client directive | (not needed in Vite) | `"use client"` added to any component using hooks |

shadcn/ui components required: `card`, `badge`, `button`, `separator`, `tooltip`, `sonner`, `toaster`. Any not already present in field-recon-engine are added via `npx shadcn@latest add <component>`.

Pages ported from `dealflow-dashboard/src/pages/`:

| Source | Destination |
|---|---|
| `Dashboard.tsx` | `app/page.tsx` |
| `TeamDashboard.tsx` | `app/stage/[stageId]/page.tsx` |
| `DealDetail.tsx` | `app/stage/[stageId]/deal/[dealId]/page.tsx` |
| `DealChecks.tsx` | `app/stage/[stageId]/deal/[dealId]/checks/page.tsx` |
| `DealDocuments.tsx` | `app/stage/[stageId]/deal/[dealId]/documents/page.tsx` |
| `DealConversations.tsx` | `app/stage/[stageId]/deal/[dealId]/conversations/page.tsx` |
| `DealDecision.tsx` | `app/stage/[stageId]/deal/[dealId]/decision/page.tsx` |

---

## Data Layer

All data lives in `lib/data/`. These files replace the `src/data/mock*.ts` files from dealflow-dashboard. Data imports in ported components are updated accordingly (e.g. `@/data/mockChecks` → `@/lib/data/checks`).

### `lib/data/deals.ts`

Deal queues per stage. Each stage has:
- `actionRequired`: 3–5 deals. AF-2026-00417 is the first and only fully grounded entry.
- `awaitingBroker`: 2–3 lightweight placeholder entries.
- `completedToday`: 2–3 lightweight placeholder entries.
- `recent`: display-only, not clickable.

Lightweight entries carry: `id`, `applicant`, `vehicle`, `value`, `status`, `context`. No drill-down data behind them.

### `lib/data/documents.ts`

Document pack per stage, using real document types from the deal pack:

| Stage | Documents |
|---|---|
| `underwriting` | Broker Application, Previous Application |
| `payout` | HP Agreement, Purchase Invoice, Supplier Declaration, Payment Mandate, Giro Slip, Funds Form, FCA Register Lookup |
| `accounts` | Purchase Invoice, Funds Form, Giro Slip |

Document statuses (`received` / `verified` / `issue` / `missing`) reflect a realistic mid-processing state. At least one document per stage has `issue` status to demonstrate the UI state.

### `lib/data/checks.ts`

Check definitions per stage, derived from `field_reference_and_check_types.md`. Data rows are populated with real field values from the input JSONs.

**Underwriting** — customer fields vs previous application:

| Check | Type | Fields |
|---|---|---|
| Customer name consistency | Fuzzy match | `Adam Piers` vs `Adam J Piers` (previous application) |
| Date of birth match | Exact match | `15/03/1988` across broker + previous application |
| Address consistency | Fuzzy match | `14 Birchwood Lane, Solihull, B91 3QR` vs previous (missing comma variant) |
| Employment status match | Exact match | `Full-time` across both applications |
| Employment duration | Exact match | `3 years` (current) vs `2 years` (previous) — **intentional discrepancy** |
| Name layout | Fuzzy match | First/middle/last layout check |

**Payout** — cross-document checks across HP agreement, invoice, supplier declaration, giro, funds form, FCA register:

| Check | Type |
|---|---|
| Vehicle make/model | Fuzzy match across broker, HP agreement, invoice |
| Vehicle registration | Exact match (ignore spacing): `WR21XYZ` |
| Vehicle year | Exact match: `2021` |
| Vehicle mileage | Numeric tolerance ±2,000 miles |
| Cash price | Exact match: `£14,000` |
| Deposit | Exact match: `£1,500` |
| Amount to finance | Exact match: `£12,500` |
| Monthly payment | Exact match: `£287.43` |
| Total amount payable | Exact match: `£17,245.80` |
| APR | Exact match: `9.9%` |
| Invoice line items total | Arithmetic check |
| Invoice extras cap | Policy rule: admin fee + delivery ≤ £400 |
| Advance vs GGR ratio | Policy rule: `£12,500` advance vs `£14,200` GGR — passes 70% threshold |
| Dealer name | Entity resolution: Midland Motor Group across documents + FCA register |
| Dealer address | Fuzzy match: supplier declaration vs FCA register |
| FCA permission | System lookup: credit broking permission active |
| Sort code | Exact match: giro vs funds form |
| Account number | Exact match: giro vs funds form |
| Payee name on giro | Data extraction + fuzzy match vs FCA register |
| Finance company on invoice | Exact match: must read "Northgate Motor Finance Ltd" |
| Trade sale indicator | Presence check: must not be marked trade sale |
| Document completeness | Presence checks: all 7 documents received |

**Accounts** — financial verification:

| Check | Type |
|---|---|
| Invoice line items sum | Arithmetic check |
| VAT calculation | Arithmetic check (if VAT applicable) |
| Sort code / account verified | System lookup: bank verification service |
| Customer details match | Fuzzy match: invoice vs HP agreement |
| Bank details match | Exact match: funds form vs giro |

Each check has: `id`, `category`, `title`, `description`, `matchType`, `status`, `confidence`, `outcome`, `failReason?`, `dataRows`, `documents`. The `DealCheck` type and all related types (`CheckCategory`, `CheckStatus`, `CheckMatchType`, `CheckDataRow`, `CheckDocument`) are defined in `lib/data/checks.ts` — ported directly from `mockChecks.ts` with no changes to the type definitions.

### `lib/data/deal-detail.ts`

Issues, timeline, and AI summary per stage for AF-2026-00417.

Issues are derived from checks that fail or warn in that stage. Timeline reflects the real deal chronology starting 18/03/2026 (date submitted per broker.json).

### `lib/data/conversations.ts`

PAS threads per stage. At minimum:
- Underwriting: employment duration discrepancy query (3 years vs 2 years from previous application)
- Payout: one query per failing/warning check (e.g. dealer entity confirmation request)

---

## Key Constraints

- `"use client"` is required on every component using React hooks — App Router defaults to server components.
- Read `node_modules/next/dist/docs/` before writing any Next.js-specific code (per AGENTS.md).
- Currency strings retain `£` symbol as stored in source docs; numeric comparisons strip it before arithmetic.
- `previous_application` is optional on BrokerSchema — present in this deal, used in underwriting checks.
- `hpi_vehicle_finance_check` is nullable — reflect "not yet run" state where appropriate.
