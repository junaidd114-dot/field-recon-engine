import { z } from "zod"

const ukDate = z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/)

export const SupplierDeclarationSchema = z.object({
  document: z.literal("Supplier Declaration"),
  dealer: z.string(),
  date_signed: ukDate,

  dealer_details: z.object({
    // Entity resolution — may differ from HP agreement, invoice, giro, FCA register
    registered_name: z.string(),
    // Fuzzy match against FCA register
    address: z.string(),
    // System lookup — verified against FCA register; must have credit brokerage permission
    fca_reference_number: z.string().regex(/^\d{6}$/),
  }),

  declaration: z.object({
    signed_by: z.string(),
    date: ukDate,
    // Presence check — all four confirmations must be present; document must show no alterations
    confirmations: z.array(z.string()).min(4),
  }),
})

export type SupplierDeclaration = z.infer<typeof SupplierDeclarationSchema>
