import { z } from "zod"

const ukDate = z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/)

export const PaymentMandateSchema = z.object({
  document: z.literal("Payment Mandate (Direct Debit)"),
  date: ukDate,
  reference: z.string(),

  account_holder: z.object({
    // Fuzzy match against customer name on broker application and HP agreement
    name: z.string(),
  }),

  instruction: z.object({
    // Exact match — must be "Northgate Motor Finance Ltd"
    authorised_to: z.literal("Northgate Motor Finance Ltd"),
    method: z.literal("Direct Debit"),
    signed_by: z.string(),
    date_signed: ukDate,
  }),
})

export type PaymentMandate = z.infer<typeof PaymentMandateSchema>
