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
