@AGENTS.md

# field-recon-engine

## What this is

A frontend demo for an automated deal-checking system used by a UK motor finance company. When a dealer submits a vehicle finance deal, a pack of documents arrives (broker application, HP agreement, purchase invoice, supplier declaration, payment mandate, giro slip, funds form). The finance company must verify that all these documents are internally consistent, the dealer is FCA-authorised, and the deal passes a set of business rules before paying out.

This demo visualises that checking process — surfacing which fields match, which conflict, and which checks fail across the document pack for a given deal.

## Domain reference

`field_reference_and_check_types.md` at the repo root is the canonical domain reference. Read it before touching any check logic. It defines:

- The five processing stages (underwriting → documents → payout checking → sign-off → accounts)
- All check types: exact match, fuzzy match, numeric tolerance, arithmetic, presence, policy rule, system lookup, entity resolution, data extraction, quality check
- The full field inventory: which fields appear in which documents and what check type applies to each

## Repository structure

```
field-recon-engine/
├── app/                    # Next.js App Router pages and layouts
├── components/             # React components
│   └── ui/                 # shadcn/ui primitives
├── lib/
│   └── schemas/            # Zod schemas (one file per document type)
├── input/                  # Source documents for the demo deal (AF-2026-00417)
│   ├── *.md                # Human-readable document representations
│   └── *.json              # Extracted structured data (one per document)
└── field_reference_and_check_types.md
```

## Stack

- **Next.js** (App Router) — repo root is the Next.js project
- **TypeScript** throughout
- **Tailwind CSS** for styling
- **shadcn/ui** for components — add new components with `npx shadcn@latest add <component>`
- **Zod** for schema definition and runtime validation (`lib/schemas/`)

## Data

The demo deal is **AF-2026-00417** (customer Adam Piers, Ford Focus ST-Line, Midland Motor Group).

Input JSON files in `input/` are the data source — there is no database.

## Schemas

Each document type has a Zod schema in `lib/schemas/`. The schema comments annotate each field with its check type from the field inventory. Key optionality rules:

- `previous_application` — optional (only present when a prior application exists for the customer)
- `vin` — optional (caravans only)
- `vat_amount`, `vat_registration_number` — optional (conditional on `vat_applicable: true`)
- `hpi_vehicle_finance_check` — nullable (check not yet run)

## Commands

```bash
npm run dev      # development server
npm run build    # production build
npm run lint     # ESLint
npx tsc --noEmit # type-check only
```
