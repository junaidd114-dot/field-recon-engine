# Field Reference and Check Types

This document covers the current manual checking process, the field inventory, and the check types. It's a reference for understanding the domain.

---

## Why these checks exist

When a finance company pays a dealer for a vehicle on behalf of a customer, they need to be certain that the deal is legitimate, the information is consistent across all parties, the money is going to the right place, the dealer is authorised to broker credit, and all documents are in order. If any check fails, the deal is paused until the problem is resolved.

---

## How the current process works

Deals pass through five stages. This structure is an artefact of the manual process and is entirely open to change.

**Stage 1: Underwriting.** New applications are checked against any previous applications for the same customer, looking for inconsistencies in name, address, employment, and occupation.

**Stage 2: Documents arrive.** The customer signs the HP agreement and the broker submits the document pack (invoice, supplier declaration, giro, funds form, payment mandate). Someone manually logs that docs have been received.

**Stage 3: Payout checking (CB4C).** A payout administrator works through a checklist of roughly 35 checks, comparing values across all documents. Each check is a yes/no question. A "No" automatically generates a specific query back to the broker via the PAS (Pre-Advance Snag) system. When the broker responds, whoever picks up the deal next re-checks the entire thing from scratch, even if only one item was wrong.

**Stage 4: Sign-off and merge.** Once all checks pass, the administrator creates a compiled document pack and the deal is marked as paid out.

**Stage 5: Accounts funding.** A separate team performs their own checks from a different checklist (customer details, bank details, invoice figures, VAT). This acts as a second-line check by a different department. If they find a problem, the deal is rejected back to payouts.

### Broker communication (PAS system)

When a problem is found at any stage, a PAS (Pre-Advance Snag) is raised. This is the communication mechanism between the finance company and the broker. A PAS contains a specific query or request (e.g. "employment duration doesn't match previous application, please confirm start date" or "invoice extras exceed policy cap, please revise"). The broker sees outstanding PAS items on their portal and responds with corrected information or documents. Responses feed back into the system and the deal is re-checked.

The PAS system supports both automated messages (triggered by specific check failures) and manually written queries from the payout team. This two-way communication channel already exists and can be integrated with.

The company is open to fundamentally changing this process. The existing checklist and stage boundaries exist because the process is manual. What matters is that the right checks happen, problems get caught, and deals move through with as little human involvement as possible.

---

## Check types explained

### Exact match

The values from all sources must be identical (after normalising formatting like spacing, currency symbols, and date formats). Any difference is a problem.

### Fuzzy match

The values should refer to the same thing but may differ in formatting, abbreviation, or completeness. Examples: "Lane" vs "Ln" in an address, "Adam James Piers" vs "A J Piers" for a name, or "Ford Focus ST-Line" vs "Ford Focus ST-Line 1.0T EcoBoost" for a vehicle. The system needs to determine whether these are the same entity despite surface differences.

### Numeric tolerance

The values are numbers that should be close but may not be identical. Each field defines an acceptable tolerance. For example, vehicle mileage allows a difference of up to 2,000 miles between sources (because the broker submits an estimate and the invoice reflects the actual reading at point of sale).

### Arithmetic check

The value must be mathematically correct based on other values. For example, invoice line items must sum to the stated total, or VAT must equal net amount multiplied by the VAT rate.

### Presence check

The system simply checks whether a required document or piece of information exists. There's nothing to compare; it's either present or it isn't.

### Quality check

The document must be legible and its contents must be extractable. This is relevant for scanned documents where OCR quality can vary. A confidence score below threshold means the document can't be reliably read.

### Policy rule

The value is checked against a business rule rather than against another source. Examples: combined invoice extras (admin fees + delivery charges) must not exceed £400; the advance must be less than 70% of the vehicle's Glass's Guide Retail value when there's no deposit.

### System lookup

The value is verified by querying an external system (FCA register, HPI/vehicle finance database, bank verification service). The system checks whether the result confirms or contradicts what's in the deal documents.

### Entity resolution

Multiple sources may refer to the same real-world entity using different names. This is common with dealers, who may appear as a registered company name, a trading name, or an abbreviated version across different documents. The system needs to determine whether these all refer to the same entity. For example: "Midland Motor Group", "Midland Motor Group Ltd", and "Midland Cars Direct" could all be the same dealer if the FCA register shows that "Midland Cars Direct" is a trading name of "Midland Motor Group Ltd".

### Data extraction

A value needs to be extracted from a document (e.g. the payee name printed on a giro slip) and then checked against another source using one of the comparison methods above.

---

## Field inventory

### Customer fields

| Field | Sources | Check type |
| --- | --- | --- |
| Customer name | Broker application, HP agreement, Purchase invoice, Payment mandate, Previous application | Fuzzy match |
| Customer address | Broker application, HP agreement, Purchase invoice, Previous application | Fuzzy match |
| Customer DOB | Broker application, HP agreement, Previous application | Exact match |
| Employment duration | Broker application, Previous application | Exact match |
| Occupation status (FT/PT/SE) | Broker application, Previous application | Exact match |
| Name layout (first / middle / last) | Broker application, Previous application | Fuzzy match |

### Vehicle fields

| Field | Sources | Check type |
| --- | --- | --- |
| Vehicle make/model | Broker application, HP agreement, Purchase invoice | Fuzzy match |
| Vehicle registration | Broker application, HP agreement, Purchase invoice | Exact match (ignore spacing) |
| Vehicle year | Broker application, HP agreement | Exact match |
| VIN | HP agreement, Purchase invoice | Exact match (17 characters, caravans only) |
| Vehicle mileage | Broker application, Purchase invoice | Numeric tolerance (within 2,000 miles) |

### Financial fields

| Field | Sources | Check type |
| --- | --- | --- |
| Cash price | Broker application, HP agreement, Purchase invoice | Exact match |
| Deposit amount | Broker application, HP agreement, Purchase invoice | Exact match |
| Amount to finance / advance | Broker application, HP agreement, Purchase invoice | Exact match |
| Monthly payment | Broker application, HP agreement | Exact match |
| Total amount payable | Broker application, HP agreement | Exact match |
| APR | Broker application, HP agreement | Exact match |
| First payment date | HP agreement | Presence check |
| Invoice line items total | Purchase invoice | Arithmetic check (items must sum to stated total) |
| Invoice extras | Purchase invoice | Policy rule (admin fee cap £350, combined extras cap £400) |
| Advance vs GGR ratio | Broker application (GGR), HP agreement (advance) | Policy rule (advance must be < 70% of GGR if no deposit) |
| VAT amount | Purchase invoice | Arithmetic check (if applicable) or presence check |
| VAT applicability | Purchase invoice | Presence check |
| VAT registration number | Purchase invoice | Presence check (required if VAT applicable) |

### Dealer / payee fields

| Field | Sources | Check type |
| --- | --- | --- |
| Dealer name | HP agreement, Purchase invoice, Supplier declaration, Giro slip, FCA register | Entity resolution |
| Dealer address | Supplier declaration, FCA register | Fuzzy match |
| FCA permission | Supplier declaration, FCA register | System lookup |
| Sort code | Giro slip, Funds form | Exact match (6 digits) |
| Account number | Giro slip, Funds form | Exact match (8 digits) |
| Payee name on giro | Giro slip, FCA register | Data extraction + fuzzy match |
| Finance company on invoice | Purchase invoice | Exact match (must say "Northgate Motor Finance Ltd") |
| Trade sale indicator | Purchase invoice | Presence check (should not be marked as trade sale for consumer deals) |

### Document completeness

| Field | Sources | Check type |
| --- | --- | --- |
| HP Agreement received | Document pack | Presence check |
| Purchase Invoice received | Document pack | Presence check |
| Purchase Invoice readable | Purchase invoice | Quality check (OCR confidence) |
| Funds form received | Document pack | Presence check |
| Funds form correctly completed | Funds form | Presence check (all required fields populated) |
| Giro slip received | Document pack | Presence check |
| Supplier Declaration received | Document pack | Presence check |
| Supplier Declaration legible | Supplier declaration | Quality check (OCR confidence) |
| Supplier Declaration correctly completed | Supplier declaration | Presence check (mandatory fields, no alterations) |
| Payment Mandate received | Document pack | Presence check |

### System lookups

Field	Sources	Check type
Gold Check status	Gold Check system	System lookup
Vehicle finance clear	HPI system	System lookup
Sort code / account verified	Bank verification service	System lookup
FCA permission valid	FCA register	System lookup