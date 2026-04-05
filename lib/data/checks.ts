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

// ─── Accounts checks ─────────────────────────────────────────────────────────
// Source documents: Purchase Invoice, Funds Form, Giro Slip

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
