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
