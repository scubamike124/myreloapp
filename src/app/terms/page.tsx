import Link from "next/link";
import PolicyPage, { Section } from "@/components/design/PolicyPage";
import { BUSINESS } from "@/lib/legal";

export const metadata = { title: "Terms of Service — Reelo" };

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms of Service"
      intro={`The agreement between you and ${BUSINESS.legalName} when you use ${BUSINESS.tradingName}.`}
    >
      <Section heading="Who we are">
        <p>
          {BUSINESS.tradingName} is operated by {BUSINESS.legalName}, registered in {BUSINESS.jurisdiction}. Contact:{" "}
          {BUSINESS.supportEmail}.
        </p>
      </Section>

      <Section heading="What you may use it for">
        <p>
          You may use {BUSINESS.tradingName} to create videos for yourself or your business. You may not use it to
          create material that is unlawful, that harasses or defames someone, that impersonates a real person without
          their consent, or that infringes someone else&apos;s copyright.
        </p>
        <p>
          You must not upload a photograph of someone without their permission to make them appear to speak or move.
          This matters more here than on most platforms, because that is precisely what these tools do.
        </p>
      </Section>

      <Section heading="Who owns what you make">
        <p>
          You own the videos you generate, to the extent they can be owned. We claim no ownership of your uploads or
          outputs. You are responsible for holding the rights to anything you upload.
        </p>
        <p>
          Note that AI-generated material may not attract copyright protection in some jurisdictions, and identical or
          near-identical output may be produced for someone else.
        </p>
      </Section>

      <Section heading="AI providers">
        <p>
          Generation is performed by third-party AI services. Content you submit is transmitted to them for processing
          and is subject to their terms as well as ours. Availability, quality and speed depend on those providers.
        </p>
      </Section>

      <Section heading="Availability">
        <p>
          Parts of {BUSINESS.tradingName} are still being built, and are marked as such in the product. We do not
          guarantee uninterrupted service, and features may change or be withdrawn.
        </p>
      </Section>

      <Section heading="Payment">
        <p>
          Paid plans are billed in advance. Refunds are covered by the{" "}
          <Link href="/refunds" className="underline underline-offset-2 hover:text-white">
            refund policy
          </Link>
          .
        </p>
      </Section>

      <Section heading="Liability">
        <p>
          To the extent permitted by law, {BUSINESS.legalName} is not liable for indirect or consequential loss arising
          from your use of the service. Nothing here excludes liability that cannot lawfully be excluded, including
          under consumer law in {BUSINESS.jurisdiction}.
        </p>
      </Section>

      <Section heading="Changes">
        <p>
          We may update these terms. Material changes will be notified in the product or by email before they take
          effect.
        </p>
      </Section>
    </PolicyPage>
  );
}
