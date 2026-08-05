import PolicyPage, { Section } from "@/components/design/PolicyPage";
import { BUSINESS } from "@/lib/legal";

export const metadata = { title: "Privacy Policy — Reelo", description: "What Reelo collects, how your uploads and generated videos are handled, and your choices." };

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      intro="What we collect, where it goes, and what stays on your own device."
    >
      <Section heading="Your Library, and how long we keep videos">
        <p>
          Signed out, your Library lives only in this browser. It does not follow you between devices, and clearing site
          data deletes it.
        </p>
        <p>
          Signed in, we keep the record on our servers so it follows you — and we store the finished videos themselves
          for <strong className="text-white">30 days</strong>, after which they are deleted automatically. Download
          anything you want to keep permanently.
        </p>
      </Section>

      {/*
        Children's data.

        Added because the storybook makes personalised books from photographs of
        children and this policy said nothing about them at all. Every sentence
        here is checked against what the code does: the photo genuinely is not
        stored (the storybook route sends it and keeps only a derived
        description), consent genuinely is recorded before a photo is accepted
        (user_consents, versioned), and deletion genuinely works
        (/api/storybook/data, reachable from the Story Library).

        If any of those change, this text has to change with them. A policy that
        describes behaviour the code does not have is worse than no policy.

        This is drafted to standard practice for a parent-facing service and
        should still be reviewed by a lawyer for your jurisdictions.
      */}
      <Section heading="Children, and photographs of them">
        <p>
          Reelo is sold to adults. Accounts are for people aged 18 or over, and children may not create one. Our
          storybook makes illustrated stories starring a child — the parent or guardian holds the account and provides
          the photograph.
        </p>
        <p>
          Before a photograph is used, the account holder must confirm that they are 18 or over and are the child&apos;s
          parent or guardian, or have that guardian&apos;s permission. We record which wording was agreed to and when.
          If we change that wording, we ask again rather than assuming the earlier agreement covers it.
        </p>
        <p>
          <strong className="text-white">We do not keep the photograph.</strong> It is sent to our AI provider to draw
          the character and is not stored by us. What we keep is a written description of how the character looks — hair,
          face, clothing — so the same child can appear in later stories without you uploading another picture.
        </p>
        <p>
          You can see exactly what is held and delete it at any time from your Story Library, or by contacting us.
          Deleting a character removes the stored description. You can also delete every character, story and series on
          the account at once. We keep the record that consent was given, because it is the evidence that the use was
          authorised, and it contains no description of a child.
        </p>
        <p>
          We do not use children&apos;s data for advertising, profiling or model training, and we do not sell it. If you
          believe a child has provided us information directly, contact us and we will delete it.
        </p>
      </Section>

      <Section heading="What we send to AI providers">
        <p>
          To generate anything, we send your input — a photo, a script, a website address — to third-party AI services
          for processing. Those providers handle it under their own privacy terms. Do not upload material you are not
          comfortable sending to a third party.
        </p>
        <p>
          {/* Naming them is standard practice and was missing entirely. */}
          Those providers are <strong className="text-white">Google</strong> (Gemini, for text and images, and Veo for
          video) and <strong className="text-white">HeyGen</strong> (for avatar video). Payments are handled by{" "}
          <strong className="text-white">Stripe</strong>, email by <strong className="text-white">Resend</strong>, and
          hosting and storage by <strong className="text-white">Cloudflare</strong> and{" "}
          <strong className="text-white">Supabase</strong>. Processing may take place outside your country.
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
