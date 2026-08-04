// ---------------------------------------------------------------------------
// Business details used across the support and policy pages (production).
// ---------------------------------------------------------------------------

export const BUSINESS = {
  placeholder: false,

  /** Legal entity name — update if you register a separate company. */
  legalName: "Reelo",
  tradingName: "Reelo",
  jurisdiction: "United States",
  /** Mailing address for formal requests — email is the primary contact channel. */
  address: "support@myreelo.com",

  supportEmail: process.env.SUPPORT_EMAIL?.trim() || "support@myreelo.com",
  billingEmail: process.env.BILLING_EMAIL?.trim() || "billing@myreelo.com",
  responseTime: "1–2 business days",
  hours: "Mon–Fri, 9am–5pm PT",

  refundWindow: "14 days",
  refundProcessing: "5–10 business days",

  lastUpdated: "26 July 2026",
} as const;

// Note: the Terms of Service is deliberately written to need none of the
// placeholder fields above — no legal name, no address, no jurisdiction. It
// refers to the operator only as "Reelo" and routes contact through the Support
// page, so it stands as a finished document while the other pages wait on those
// details.
