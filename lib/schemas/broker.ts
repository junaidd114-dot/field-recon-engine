import { z } from "zod"

// Currency strings retain the £ symbol as stored in source docs.
// Numeric comparisons (e.g. advance vs GGR ratio policy rule) will require
// stripping the symbol before arithmetic.
const currencyString = z.string().regex(/^£[\d,]+(\.\d{2})?$/)

// dd/mm/yyyy as it appears across all source documents
const ukDate = z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/)

// Sources: Broker application, Previous application — Exact match
const PreviousApplicationSchema = z.object({
  reference: z.string(),
  approved: z.string(), // e.g. "January 2025"
  details: z.object({
    // Fuzzy match against current application
    name: z.string(),
    date_of_birth: ukDate,
    address: z.string(),
    // Exact match
    employment_status: z.enum(["Full-time", "Part-time", "Self-employed"]),
    time_at_current_employer: z.string(),
  }),
})

export const BrokerSchema = z.object({
  document: z.literal("Broker Application"),
  source: z.string(),
  date_submitted: ukDate,
  application_reference: z.string(),

  customer_details: z.object({
    // Split name — Fuzzy match across HP agreement, invoice, mandate
    first_name: z.string(),
    surname: z.string(),
    // Exact match across broker, HP agreement, previous application
    date_of_birth: ukDate,
    // Fuzzy match across broker, HP agreement, invoice
    address: z.string(),
    // Exact match against previous application
    employment_status: z.enum(["Full-time", "Part-time", "Self-employed"]),
    time_at_current_employer: z.string(),
  }),

  vehicle_details: z.object({
    // Fuzzy match across broker, HP agreement, invoice
    make_model: z.string(),
    // Exact match (ignore spacing) across broker, HP agreement, invoice
    registration: z.string(),
    // Exact match across broker, HP agreement
    year: z.coerce.number().int().min(1900).max(2100),
    // Numeric tolerance: within 2,000 miles of invoice figure
    mileage: z.string(), // stored as "27,000" — strip commas before numeric comparison
  }),

  financial_details: z.object({
    // All exact match across broker, HP agreement, invoice
    cash_price: currencyString,
    deposit: currencyString,
    amount_to_finance: currencyString,
    monthly_payment: currencyString,
    total_amount_payable: currencyString,
    apr: z.string().regex(/^\d+(\.\d+)?%$/),
    // Policy rule: advance must be < 70% of GGR when no deposit
    glasses_guide_retail_estimated: currencyString,
  }),

  // Optional — only present when a previous application exists for this customer
  previous_application: PreviousApplicationSchema.optional(),
})

export type BrokerApplication = z.infer<typeof BrokerSchema>
