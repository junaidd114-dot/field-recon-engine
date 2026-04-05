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
