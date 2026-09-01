import { AGREEMENT_VERSION, COMPANY_LEGAL_NAME_DEFAULT, UNLOCK_PRICE_USD } from "./constants";

export function masterAgreementText(opts?: { companyName?: string; clientName?: string }): string {
  const company = opts?.companyName || COMPANY_LEGAL_NAME_DEFAULT;
  const client = opts?.clientName || "[CLIENT LEGAL NAME]";
  return `PROPERTY RESEARCH, DISCLOSURE & FINDER FEE AGREEMENT
California Pilot Program — Draft for Legal Validation

This document is a working business agreement. It is NOT attorney approved.

This Property Research, Disclosure & Finder Fee Agreement (“Agreement”) is entered into between ${company} (“Company”) and ${client} (“Client”).

1. Purpose
Client is engaging Company to research and identify potential real-property opportunities matching criteria supplied by Client.
Company provides property research and information services.
Company does not represent itself as Client’s real-estate broker, salesperson, attorney, mortgage broker, escrow agent, appraiser, inspector, or fiduciary unless separately and lawfully licensed to perform such service.

2. Research Service
Company may use lawfully accessible sources to research potential property opportunities.
Company does not guarantee: availability; seller willingness; purchase eligibility; accuracy of third-party data; investment profitability; financing; appreciation; condition; title; lien status; or successful acquisition.
Client must independently verify material information before purchasing property.

3. Confidential Preview
Before payment, Company may provide Client with a limited non-identifying description of an opportunity.
Company will withhold information reasonably sufficient to locate or identify the property until the applicable property research package has been purchased.

4. $${UNLOCK_PRICE_USD} Individual Property Research Package
Each property opportunity constitutes a separate property-specific research package.
Client must pay: $${UNLOCK_PRICE_USD} per individual property research package.
Payment for one property does not purchase access to another property.
Therefore: ONE PROPERTY = ONE $${UNLOCK_PRICE_USD} UNLOCK.
If Company identifies ten separate opportunities and Client chooses to purchase research for all ten, ten separate $${UNLOCK_PRICE_USD} payments are required.

5. Property Registration
The Company will maintain electronic records of property research packages provided to Client.
Records may include: Client identity; Opportunity ID; Property ID; payment; disclosure timestamp; agreement version; and applicable proposed success-fee classification.

6. Proposed Success Fee
Subject to applicable law, if Client subsequently completes an eligible purchase of a property first identified and disclosed to Client through Company under this Agreement, the following proposed success-fee schedule applies:
Purchase below $200,000: $5,000
Purchase from $200,000 through $500,000: $10,000
Purchase above $500,000: $15,000
No success fee is due solely because Client purchased a $${UNLOCK_PRICE_USD} research package.
The success-fee provision applies only where legally permissible.
Nothing in this Agreement authorizes Company to collect compensation prohibited by applicable law.

7. Non-Circumvention
Client agrees not to intentionally circumvent Company for the primary purpose of avoiding a lawful payment obligation concerning an opportunity first identified and disclosed by Company.
This provision does not create compensation that applicable law otherwise prohibits.

8. Company’s Limited Role
Company will not perform activities requiring a real-estate license unless Company or the person performing the activity possesses the appropriate license.
Without appropriate licensing, Company will not: negotiate purchase price for Client; negotiate sale price; write Client’s offer; present itself as Client’s agent; negotiate contingencies; negotiate repairs; negotiate credits; negotiate concessions; negotiate closing terms; provide legal advice; provide licensed appraisal services; perform escrow services; or undertake another licensed real-estate activity.

9. Closing Payment
If a success fee is legally permissible and validly owed, the parties may use a lawful payment mechanism, potentially including appropriately authorized closing/escrow instructions where accepted and lawful.
Company’s software cannot independently order an escrow holder to make a prohibited or unauthorized payment.

10. Due Diligence
Client is responsible for obtaining appropriate professional assistance concerning matters including: title; liens; taxes; inspections; permits; zoning; financing; insurance; property condition; environmental matters; valuation; and transaction documents.

11. Electronic Records
Client agrees that transactions, acknowledgments, signatures, disclosures, payment records, and associated records may be maintained electronically where permitted.

12. Compliance With Law
Nothing in this Agreement authorizes Company, Amber, an AI system, employee, contractor, or other representative to perform an activity requiring a professional license they do not possess.
A prohibited activity must not be performed merely because the Client agreed to this Agreement.

CLIENT ACKNOWLEDGMENT
I understand:
Each property research package costs $${UNLOCK_PRICE_USD}.
Each payment applies to one individual property.
Paying $${UNLOCK_PRICE_USD} for one property does not unlock other properties.
Company is not representing itself as my real-estate broker or salesperson.
A separate success fee may apply only if the applicable transaction and compensation structure are legally permitted.
Property and third-party information should be independently verified.

Agreement Version: ${AGREEMENT_VERSION}
`;
}

export function unlockAcknowledgmentText(opportunityId: string, clientName: string): string {
  return `INDIVIDUAL PROPERTY RESEARCH PURCHASE
Client: ${clientName}
Opportunity ID: ${opportunityId}
Research Package Price: $${UNLOCK_PRICE_USD}

I am purchasing one individual property research package associated with the Opportunity ID above. This purchase applies to this opportunity only and does not unlock any additional property opportunities.`;
}
