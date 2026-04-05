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
