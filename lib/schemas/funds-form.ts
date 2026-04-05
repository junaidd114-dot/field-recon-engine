import { z } from "zod"

const ukDate = z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/)

export const FundsFormSchema = z.object({
  document: z.literal("Funds Form"),
  dealer: z.string(),
  date: ukDate,
  application_reference: z.string(),

  // null when document not yet received; all fields required once present (presence check)
  payment_details: z
    .object({
      // Exact match (6 digits) against giro slip
      sort_code: z.string().regex(/^\d{6}$/),
      // Exact match (8 digits) against giro slip
      account_number: z.string().regex(/^\d{8}$/),
      // Entity resolution — payee name as submitted electronically
      payee_name: z.string(),
    })
    .nullable(),
})

export type FundsForm = z.infer<typeof FundsFormSchema>
