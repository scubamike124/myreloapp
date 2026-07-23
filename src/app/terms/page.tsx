import Link from "next/link";
import PolicyPage, { Section } from "@/components/design/PolicyPage";

export const metadata = { title: "Terms of Service — Reelo", description: "The terms that govern your use of Reelo." };

// A complete, self-contained Terms of Service. It names no legal entity, no
// address and no jurisdiction — the operator is referred to throughout only as
// "Reelo", and contact is routed through the Support page — so it reads as a
// finished document. draft={false} removes the placeholder banner for this page
// only; the other policy pages keep it until their details are filled in.

export default function TermsPage() {
  return (
    <PolicyPage
      draft={false}
      title="Terms of Service"
      intro={`These terms are the agreement between you and Reelo when you create an account or use the service. By using Reelo, you accept them. If you do not agree, please do not use the service.`}
    >
      <Section heading="1. About these terms">
        <p>
          &ldquo;Reelo&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo; and &ldquo;our&rdquo; mean the operator of the Reelo{" "}
          service. &ldquo;You&rdquo; means the person or organisation using it. &ldquo;Content&rdquo; means anything you
          upload, enter or generate, including photos, scripts, prompts, and the videos and images Reelo produces for you.
        </p>
        <p>
          These terms apply alongside our{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-white">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/refunds" className="underline underline-offset-2 hover:text-white">
            Refund Policy
          </Link>
          , which form part of this agreement.
        </p>
      </Section>

      <Section heading="2. Eligibility">
        <p>
          You must be at least 18 years old, or the age of majority where you live, to hold an account and to make
          purchases. If you are between 13 and that age, you may only use Reelo with the involvement and consent of a
          parent or legal guardian who agrees to these terms on your behalf. Reelo is not intended for children under 13,
          and we do not knowingly collect their information.
        </p>
        <p>
          If you use Reelo on behalf of a company or other organisation, you confirm you are authorised to accept these
          terms for it, and &ldquo;you&rdquo; includes that organisation.
        </p>
      </Section>

      <Section heading="3. Your account">
        <p>
          You are responsible for the accuracy of the details you register, for keeping your password secure, and for
          everything done through your account. Tell us promptly if you believe it has been accessed without your
          permission. You may close your account at any time; some records may be retained as described in the Privacy
          Policy or as the law requires.
        </p>
      </Section>

      <Section heading="4. What you may and may not do">
        <p>You may use Reelo to create videos and images for yourself, your business or your clients. You must not use it to:</p>
        <p>
          • break the law, or help anyone else to;
          <br />• create content that is defamatory, harassing, hateful, or that threatens or bullies a person or group;
          <br />• create sexual content involving anyone who is, or appears to be, a minor — this is never permitted and
          will be reported where required;
          <br />• produce non-consensual intimate or sexual imagery of a real person;
          <br />• impersonate a real person or organisation, or create content designed to deceive people about who is
          speaking, in a way likely to cause harm, fraud or confusion;
          <br />• infringe anyone&apos;s copyright, trademark, privacy, publicity or other rights;
          <br />• promote violence, self-harm, illegal goods, or dangerous misinformation;
          <br />• attempt to breach, overload, reverse-engineer, scrape or circumvent the service, its limits or its
          security; or
          <br />• resell or redistribute access to Reelo itself, as opposed to the content you legitimately create with
          it.
        </p>
        <p>
          We may refuse, remove or limit content or accounts that breach these rules, and may report unlawful material
          to the relevant authorities.
        </p>
      </Section>

      <Section heading="5. Likeness, consent and synthetic media">
        <p>
          Reelo animates photographs, generates voices and creates realistic characters. This carries a responsibility
          that ordinary editing tools do not, so it has its own rule:
        </p>
        <p>
          <strong className="text-white">
            You must have the right to use every face, voice, name and likeness in what you upload or create.
          </strong>{" "}
          Do not upload a photograph of another person to make them appear to speak or move, or recreate someone&apos;s
          voice, without their clear and, where appropriate, documented permission. You are solely responsible for
          holding those rights and consents.
        </p>
        <p>
          Where the law requires content to be labelled as AI-generated or synthetic, you are responsible for labelling
          it. You must not present Reelo output as a genuine, unedited recording of real events or real statements by real
          people.
        </p>
      </Section>

      <Section heading="6. Your content">
        <p>
          As between you and us, you own the Content you upload and, to the extent it can be owned, the output you
          generate. We claim no ownership of it.
        </p>
        <p>
          You grant us a limited, non-exclusive licence to host, store, transmit, process and display your Content only
          as needed to operate the service for you — for example, sending it to the AI providers that perform the
          generation, and showing you your own library. This licence ends when the Content is deleted, except for copies
          we are required to keep or that remain in routine backups for a limited time. We do not use your uploads or
          outputs to train our own models.
        </p>
        <p>
          You are responsible for keeping your own copies. Finished videos are retained for a limited period and then
          deleted automatically, as described in the product and the Privacy Policy — download anything you want to keep.
        </p>
      </Section>

      <Section heading="7. AI-generated output">
        <p>
          Output is produced by artificial intelligence and is provided as-is. It may contain errors, may not match your
          intent, and may resemble output generated for other users. In some places AI-generated material may not
          qualify for copyright protection. You are responsible for reviewing output before you publish or rely on it,
          and for ensuring it is lawful and accurate for your use.
        </p>
      </Section>

      <Section heading="8. Our intellectual property">
        <p>
          The Reelo name, the software, the site, its design, and everything in it other than your Content and the output
          you generate, belong to us or our licensors. These terms give you permission to use the service; they do not
          transfer any of those rights to you. You may not copy, modify or create derivative works of the service
          itself.
        </p>
      </Section>

      <Section heading="9. Tokens, plans and payment">
        <p>
          Generating content consumes tokens. Tokens can be included with a plan or bought in packs, and the amount each
          action costs is shown in the product before you confirm it. Prices are shown at the point of purchase.
        </p>
        <p>
          Tokens are a prepaid credit to use the service. They have no cash value, are not a deposit or currency, cannot
          be transferred or sold, and are not redeemable for money except where the law requires or where our{" "}
          <Link href="/refunds" className="underline underline-offset-2 hover:text-white">
            Refund Policy
          </Link>{" "}
          provides. Paid plans are billed in advance and renew as described at checkout until cancelled. You are
          responsible for any taxes that apply to your purchase.
        </p>
        <p>
          A generation that fails through a fault on our side is not charged, or is refunded in tokens. Charges caused by
          your own inputs — for instance a generation that succeeds but that you simply did not like — are covered by the
          Refund Policy.
        </p>
      </Section>

      <Section heading="10. Third-party AI providers">
        <p>
          Generation is performed by third-party AI services. To create anything, your input is transmitted to them for
          processing and is handled under their terms as well as ours. Their availability, quality, speed and pricing
          are outside our control, and a change on their side may affect or interrupt a feature.
        </p>
      </Section>

      <Section heading="11. Availability and changes to the service">
        <p>
          Parts of Reelo are still being built, and are marked as such in the product. We provide the service on a
          reasonable-efforts basis and do not guarantee it will be uninterrupted, error-free or available at any
          particular time. We may add, change, suspend or withdraw features, and impose or adjust usage limits, to
          protect the service and manage costs.
        </p>
      </Section>

      <Section heading="12. Disclaimers">
        <p>
          To the fullest extent permitted by law, the service and all output are provided &ldquo;as is&rdquo; and
          &ldquo;as available&rdquo;, without warranties of any kind, whether express or implied, including any implied
          warranties of merchantability, fitness for a particular purpose, accuracy, or non-infringement. We do not
          warrant that output will be suitable, accurate, original or fit for your intended use.
        </p>
      </Section>

      <Section heading="13. Limitation of liability">
        <p>
          To the fullest extent permitted by law, we are not liable for any indirect, incidental, special,
          consequential or punitive loss, or for lost profits, revenue, data, goodwill or content, arising from or
          relating to your use of the service. Our total liability for any claim relating to the service is limited to
          the greater of the amount you paid us for the service in the three months before the claim arose, or ten US
          dollars.
        </p>
        <p>
          Nothing in these terms excludes or limits liability that cannot lawfully be excluded or limited, including
          rights you may have under mandatory consumer-protection law where you live. Those rights are unaffected by this
          agreement.
        </p>
      </Section>

      <Section heading="14. Indemnity">
        <p>
          You agree to indemnify and hold us harmless from claims, losses and reasonable costs arising from Content you
          upload or create, from your use of the service, or from your breach of these terms or of anyone else&apos;s
          rights — including any claim that you lacked the rights or consents required by section 5.
        </p>
      </Section>

      <Section heading="15. Suspension and termination">
        <p>
          You may stop using Reelo and close your account at any time. We may suspend or terminate your access if you
          breach these terms, if required by law, or to protect the service, other users or third parties. Where it is
          reasonable to do so, we will give notice. On termination, your right to use the service ends; sections that by
          their nature should survive — including ownership, disclaimers, limitation of liability and indemnity —
          continue to apply.
        </p>
      </Section>

      <Section heading="16. Governing law and disputes">
        <p>
          These terms are governed by the law applicable to the operator of Reelo, without affecting any mandatory
          consumer-protection rights of the country in which you live, which continue to apply to you. Wherever
          possible, mandatory local law prevails over any conflicting provision here.
        </p>
        <p>
          If you have a problem, please contact us first through the{" "}
          <Link href="/support" className="underline underline-offset-2 hover:text-white">
            Support page
          </Link>{" "}
          — most issues are resolved that way. If a dispute cannot be resolved informally, it will be handled through the
          courts or dispute-resolution process available to you under the applicable law described above.
        </p>
      </Section>

      <Section heading="17. Changes to these terms">
        <p>
          We may update these terms from time to time. When we make a material change, we will update the date shown on
          this page and notify you in the product or by email before it takes effect. Continuing to use Reelo after a
          change takes effect means you accept the updated terms.
        </p>
      </Section>

      <Section heading="18. Contact">
        <p>
          Questions about these terms can be raised through the{" "}
          <Link href="/support" className="underline underline-offset-2 hover:text-white">
            Support page
          </Link>
          , where you will also find the fastest fixes for common issues.
        </p>
      </Section>
    </PolicyPage>
  );
}
