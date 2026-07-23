import PolicyPage, { Section } from "@/components/design/PolicyPage";
import { BUSINESS } from "@/lib/legal";

export const metadata = { title: "Refund Policy — Reelo", description: "Reelo refund policy for tokens and subscription plans." };

export default function RefundsPage() {
  return (
    <PolicyPage
      title="Refund Policy"
      intro="When you can get your money back, how to ask, and how long it takes."
    >
      <Section heading="The short version">
        <p>
          If {BUSINESS.tradingName} did not do what it said it would, tell us and we will make it right. Email{" "}
          <strong className="text-white">{BUSINESS.billingEmail}</strong> within {BUSINESS.refundWindow} of the charge.
        </p>
      </Section>

      <Section heading="What is refundable">
        <p>Requests inside {BUSINESS.refundWindow} of a charge are eligible when:</p>
        <p>• A paid feature did not work and support could not fix it.</p>
        <p>• You were charged twice, or charged after cancelling.</p>
        <p>• You were billed for a plan you did not knowingly buy.</p>
      </Section>

      <Section heading="What is not refundable">
        <p>
          • Generation credits already spent. Each video, image or scan calls a paid AI provider the moment you run it,
          and that cost cannot be recovered — so unused credits may be refundable, spent ones are not.
        </p>
        <p>• Not liking the creative result of a generation that ran successfully.</p>
        <p>• Charges older than {BUSINESS.refundWindow}, except where the law says otherwise.</p>
      </Section>

      <Section heading="How to request one">
        <p>
          Email <strong className="text-white">{BUSINESS.billingEmail}</strong> with the account email, the date and
          amount of the charge, and one line on what went wrong. We reply within {BUSINESS.responseTime}.
        </p>
        <p>
          Approved refunds go back to the original payment method and typically appear within{" "}
          {BUSINESS.refundProcessing}, depending on your bank.
        </p>
      </Section>

      <Section heading="Cancelling">
        <p>
          Cancelling stops future charges. It does not refund the current period by itself — you keep access until the
          period ends. If you want the current period refunded too, say so in the same email.
        </p>
      </Section>

      <Section heading="Your legal rights">
        <p>
          This policy sits on top of your statutory consumer rights in {BUSINESS.jurisdiction} — it does not replace or
          limit them. Where the law gives you a stronger remedy than this page, the law wins.
        </p>
      </Section>
    </PolicyPage>
  );
}
