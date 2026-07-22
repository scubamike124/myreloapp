import PolicyPage, { Section } from "@/components/design/PolicyPage";
import { BUSINESS } from "@/lib/legal";

export const metadata = { title: "Privacy Policy — Reelo" };

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      intro="What we collect, where it goes, and what stays on your own device."
    >
      <Section heading="What stays in your browser">
        <p>
          Your Library — the record of what you have generated — is stored in your browser&apos;s local storage, not on
          our servers. It does not follow you between devices, and clearing site data deletes it. Download anything you
          want to keep.
        </p>
      </Section>

      <Section heading="What we send to AI providers">
        <p>
          To generate anything, we send your input — a photo, a script, a website address — to third-party AI services
          for processing. Those providers handle it under their own privacy terms. Do not upload material you are not
          comfortable sending to a third party.
        </p>
        <p>
          Voice input is recorded in your browser and sent for transcription only when you press the microphone button.
          Audio is not retained by us after transcription.
        </p>
      </Section>

      <Section heading="What we collect">
        <p>
          • Technical data needed to serve the site, including your IP address, which is used for rate limiting so one
          visitor cannot exhaust the service for everyone.
        </p>
        <p>• Any information you send us directly, such as a support email.</p>
        <p>
          • Approximate location, inferred from your browser&apos;s language and timezone, used to make trend advice
          relevant to your country. It is not stored.
        </p>
      </Section>

      <Section heading="What we do not do">
        <p>We do not sell your personal information, and we do not use your uploads to train our own models.</p>
      </Section>

      <Section heading="Your rights">
        <p>
          Depending on where you live, you may have the right to access, correct, export or delete the personal
          information we hold. Email {BUSINESS.supportEmail} and we will respond within {BUSINESS.responseTime}.
        </p>
        <p>
          Anything held only in your browser is already under your control — clearing site data removes it immediately
          and permanently.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          {BUSINESS.legalName}, {BUSINESS.address}. Questions: {BUSINESS.supportEmail}.
        </p>
      </Section>
    </PolicyPage>
  );
}
