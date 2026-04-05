import { z } from "zod"

const ukDate = z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/)

export const FcaRegisterLookupSchema = z.object({
  document: z.literal("FCA Register Lookup"),
  lookup_date: ukDate,
  query: z.string(),

  result: z.object({
    // System lookup — this is the authoritative FCA reference
    fca_reference: z.string().regex(/^\d{6}$/),
    // Entity resolution anchor — registered name is the canonical form
    firm_name: z.string(),
    // Entity resolution — trading names allow fuzzy matching dealer names on other docs
    trading_names: z.array(z.string()),
    // System lookup — must be "Authorised" for deal to proceed
    status: z.enum(["Authorised", "Cancelled", "Lapsed", "Withdrawn", "Appointed Representative"]),
    // System lookup — must include "Credit brokerage"
    permission: z.string(),
    // Fuzzy match against supplier declaration address
    registered_address: z.string(),
  }),
})

export type FcaRegisterLookup = z.infer<typeof FcaRegisterLookupSchema>
