import Link from "next/link";
import PolicyPage, { Section } from "@/components/design/PolicyPage";
import { BUSINESS } from "@/lib/legal";

export const metadata = { title: "Help & Support — Reelo" };

export default function SupportPage() {
  return (
    <PolicyPage
      title="Help & Support"
      intro="Something not working, or a question about your account? Here is how to reach a human, and the fastest fixes for the problems that come up most."
    >
      <Section heading="Contact us">
        <p>
          Email <strong className="text-white">{BUSINESS.supportEmail}</strong> and we aim to reply within{" "}
          {BUSINESS.responseTime}. Support hours are {BUSINESS.hours}.
        </p>
        <p>
          For billing, payments or refunds, email <strong className="text-white">{BUSINESS.billingEmail}</strong> — see
          the{" "}
          <Link href="/refunds" className="underline underline-offset-2 hover:text-white">
            refund policy
          </Link>{" "}
          first, as it may answer the question outright.
        </p>
        <p>
          Include your account email and, if a video failed, roughly when you tried and which tool you used. That is
          usually enough for us to find it.
        </p>
      </Section>

      <Section heading="Common problems">
        <p>
          <strong className="text-white">A generation failed or timed out.</strong> Video generation depends on external
          AI providers. If one is busy or rejects a request, the tool says so rather than silently failing. Trying again
          a few minutes later resolves most cases.
        </p>
        <p>
          <strong className="text-white">A tool says it is unavailable.</strong> Some tools in Create are not built yet.
          Their pages exist so you can see what they will need, but they cannot generate anything, and they say so
          plainly rather than pretending.
        </p>
        <p>
          <strong className="text-white">You hit a daily limit.</strong> Generation is capped per day to protect against
          runaway costs. The limit resets at midnight UTC.
        </p>
        <p>
          <strong className="text-white">Your video is not in the Library.</strong> The Library is stored in your
          browser, so it does not follow you between devices or survive clearing site data. Download anything you want
          to keep.
        </p>
      </Section>

      <Section heading="Ask Amber first">
        <p>
          Amber is built into every page — the button in the bottom-right corner. She can explain what a tool needs, why
          a generation failed, and what is worth making next. For anything account or payment related, email us instead.
        </p>
      </Section>

      <Section heading="Policies">
        <p>
          <Link href="/refunds" className="underline underline-offset-2 hover:text-white">
            Refund policy
          </Link>{" "}
          ·{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-white">
            Terms of service
          </Link>{" "}
          ·{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-white">
            Privacy policy
          </Link>
        </p>
      </Section>
    </PolicyPage>
  );
}
