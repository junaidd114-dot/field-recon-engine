import { z } from "zod"

const ukDate = z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/)

export const GiroSlipSchema = z.object({
  document: z.literal("Giro Slip"),
  // Entity resolution — may differ from registered name on declaration/FCA register
  from: z.string(),
  date: ukDate,

  // null when document not yet received; fields required once present
  payee_bank_details: z
    .object({
      // Data extraction + fuzzy match against FCA register firm/trading name
      payee_name: z.string(),
      // Exact match (6 digits) against funds form
      sort_code: z.string().regex(/^\d{6}$/),
      // Exact match (8 digits) against funds form
      account_number: z.string().regex(/^\d{8}$/),
    })
    .nullable(),
})

export type GiroSlip = z.infer<typeof GiroSlipSchema>
