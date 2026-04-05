import { z } from "zod"

const currencyString = z.string().regex(/^£[\d,]+(\.\d{2})?$/)
const ukDate = z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/)

// Individual line items — arithmetic check: items must sum to invoice total
const LineItemSchema = z.object({
  description: z.string(),
  amount: currencyString,
})

// Policy rule: admin fee cap £350, combined extras (admin + delivery) cap £400
const InvoiceExtrasSchema = z.object({
  admin_fee: currencyString.optional(),
  delivery_charge: currencyString.optional(),
})

export const PurchaseInvoiceSchema = z.object({
  document: z.literal("Purchase Invoice"),

  // Presence + quality check — document must be received and OCR-readable
  data: z
    .object({
      invoice_reference: z.string(),
      date: ukDate,

      dealer: z.object({
        // Entity resolution — may differ across HP agreement, declaration, giro, FCA register
        name: z.string(),
      }),

      customer: z.object({
        // Fuzzy match across broker, HP agreement, mandate
        name: z.string(),
        // Fuzzy match across broker, HP agreement
        address: z.string(),
      }),

      vehicle: z.object({
        // Fuzzy match across broker, HP agreement
        make_model: z.string(),
        // Exact match (ignore spacing) across broker, HP agreement
        registration: z.string(),
        // Exact match (17 chars) — caravans only
        vin: z.string().length(17).optional(),
        // Numeric tolerance: within 2,000 miles of broker figure
        mileage: z.string(),
      }),

      financial: z.object({
        // Exact match across broker, HP agreement
        cash_price: currencyString,
        deposit: currencyString,
        amount_to_finance: currencyString,
        // Arithmetic check: line items must sum to this
        line_items: z.array(LineItemSchema),
        line_items_total: currencyString,
        // Policy rule: combined extras cap £400
        extras: InvoiceExtrasSchema.optional(),
        // Presence check — VAT fields only required if applicable
        vat_applicable: z.boolean(),
        vat_amount: currencyString.optional(),
        // Presence check — required when vat_applicable is true
        vat_registration_number: z.string().optional(),
      }),

      // Exact match — must be "Northgate Motor Finance Ltd"
      finance_company: z.literal("Northgate Motor Finance Ltd"),
      // Presence check — must NOT be true for consumer deals
      trade_sale: z.boolean(),
    })
    .nullable(), // null when document not yet received / unreadable
})

export type PurchaseInvoice = z.infer<typeof PurchaseInvoiceSchema>
