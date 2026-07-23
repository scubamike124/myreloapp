// ---------------------------------------------------------------------------
// Business details used across the support and policy pages.
//
// EVERY value here is a PLACEHOLDER. Nothing in this file is a real commitment
// Reelo has made — it exists so the pages can be built and reviewed without
// inventing a refund window, a support address, or a legal entity.
//
// Replace each value, then delete `placeholder: true`. While that flag is on,
// the pages render a visible banner saying the details are not final, so a
// draft can never be mistaken for policy.
// ---------------------------------------------------------------------------

export const BUSINESS = {
  placeholder: true,

  /** Legal entity name, e.g. "Reelo Media Pty Ltd". */
  legalName: "[YOUR REGISTERED BUSINESS NAME]",
  /** Trading name shown to customers. */
  tradingName: "Reelo",
  /** Where the business is registered — sets which consumer law applies. */
  jurisdiction: "[YOUR COUNTRY / STATE]",
  /** Postal address, if you need one for consumer-law compliance. */
  address: "[YOUR BUSINESS ADDRESS]",

  /** Where support email actually lands. */
  supportEmail: "[YOUR SUPPORT EMAIL]",
  /** Billing and refund requests, if different from support. */
  billingEmail: "[YOUR BILLING EMAIL]",
  /** Realistic first-response time — do not promise faster than you can meet. */
  responseTime: "[E.G. 1-2 BUSINESS DAYS]",
  /** Support hours, if you offer them. */
  hours: "[E.G. MON-FRI, 9AM-5PM]",

  /** Cooling-off window for refunds. */
  refundWindow: "[E.G. 14 DAYS]",
  /** How long a refund takes to land back on the card. */
  refundProcessing: "[E.G. 5-10 BUSINESS DAYS]",

  /** Last review date for the policy pages. */
  lastUpdated: "22 July 2026",
} as const;

// Note: the Terms of Service is deliberately written to need none of the
// placeholder fields above — no legal name, no address, no jurisdiction. It
// refers to the operator only as "Reelo" and routes contact through the Support
// page, so it stands as a finished document while the other pages wait on those
// details.
