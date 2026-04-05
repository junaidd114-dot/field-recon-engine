import { z } from "zod"

const ukDate = z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/)

// Gold Check: identity/fraud screening system
const GoldCheckSchema = z.object({
  // System lookup — "Complete" means the check ran; result field carries the outcome
  status: z.enum(["Complete", "Failed", "Pending"]),
  docket_number: z.string(),
  result: z.string(), // e.g. "No issues flagged"
})

// HPI Vehicle Finance Check: confirms vehicle is not already subject to outstanding finance
const HpiCheckSchema = z.object({
  registration: z.string(),
  outstanding_finance: z.string(), // e.g. "None"
  // System lookup — must return "Clear" for deal to proceed
  status: z.enum(["Clear", "Finance Outstanding", "Stolen", "Scrapped", "Pending"]),
  result: z.string(),
})

export const SystemCheckResultsSchema = z.object({
  document: z.literal("System Check Results"),
  application_reference: z.string(),
  date_run: ukDate,

  // Presence check — both checks must be run and pass before payout
  gold_check: GoldCheckSchema,
  // null when check has not yet been run
  hpi_vehicle_finance_check: HpiCheckSchema.nullable(),
})

export type SystemCheckResults = z.infer<typeof SystemCheckResultsSchema>
