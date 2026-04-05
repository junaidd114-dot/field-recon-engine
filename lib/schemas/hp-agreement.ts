import { z } from "zod"

const currencyString = z.string().regex(/^£[\d,]+(\.\d{2})?$/)
const ukDate = z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/)

export const HpAgreementSchema = z.object({
  document: z.literal("HP Agreement"),
  generated_by: z.string(),
  agreement_reference: z.string(),
  date: ukDate,

  hirer_details: z.object({
    // Fuzzy match — may appear as "Adam James Piers" vs "Adam Piers" vs "A J Piers"
    full_name: z.string(),
    // Exact match across broker, HP agreement, previous application
    date_of_birth: ukDate,
    // Fuzzy match across broker, HP agreement, invoice
    address: z.string(),
  }),

  vehicle_details: z.object({
    // Fuzzy match — HP agreement may include full spec (e.g. "1.0T EcoBoost")
    make_model: z.string(),
    // Exact match (ignore spacing) across broker, HP agreement, invoice
    registration: z.string(),
    // Exact match across broker, HP agreement
    year: z.coerce.number().int().min(1900).max(2100),
    // Exact match (17 chars) — caravans only
    vin: z.string().length(17).optional(),
  }),

  financial_details: z.object({
    // All exact match across broker, HP agreement, invoice
    cash_price: currencyString,
    deposit: currencyString,
    advance_amount_financed: currencyString,
    monthly_payment: currencyString,
    total_amount_payable: currencyString,
    apr: z.string().regex(/^\d+(\.\d+)?%$/),
    term: z.string(), // e.g. "48 months"
    // Presence check — must exist
    first_payment_date: ukDate,
  }),

  dealer: z.object({
    // Entity resolution — may differ from invoice/declaration/giro/FCA register
    dealer_name: z.string(),
  }),
})

export type HpAgreement = z.infer<typeof HpAgreementSchema>
