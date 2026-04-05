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
