/**
 * Optional transactional email via Resend.
 * Without RESEND_API_KEY, callers must fall back to support messaging.
 */
export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return false;

  const from = process.env.MAIL_FROM?.trim() || "Reelo <noreply@myreelo.com>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "Reset your Reelo password",
        text: `Reset your Reelo password using this link (expires in 1 hour):\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
