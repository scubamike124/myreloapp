import Link from "next/link";
import { redirect } from "next/navigation";
import DesignShell from "@/components/design/DesignShell";
import AuthForm from "@/components/account/AuthForm";
import { dbConfigured } from "@/lib/db";
import { currentUser } from "@/lib/accounts";

export const metadata = { title: "Create your account — Reelo" };

export default async function SignupPage() {
  if (dbConfigured() && (await currentUser())) redirect("/account");

  return (
    <DesignShell>
      <main className="amber-safe mx-auto max-w-[430px] px-6 pb-20 pt-14">
        <h1 className="font-display text-3xl font-extrabold tracking-[-0.02em] text-white">Create your account</h1>
        <p className="mt-2 mb-7 text-[14.5px] text-white/55">Start free with 5 tokens. No card needed.</p>

        {dbConfigured() ? (
          <AuthForm mode="signup" />
        ) : (
          <NotConfigured />
        )}
      </main>
    </DesignShell>
  );
}

/** Honest state rather than a form that cannot work. */
function NotConfigured() {
  return (
    <div className="rounded-xl px-4 py-3.5 text-[13px] leading-relaxed" style={{ border: "1px solid rgba(255,159,67,.3)", background: "rgba(255,159,67,.07)", color: "#ffcf9a" }}>
      <strong className="font-bold">Accounts aren&apos;t switched on yet.</strong> They need a database —
      set <code className="text-[#ffd9ae]">DATABASE_URL</code> in Admin → Key vault. Everything else in Reelo works
      without one; see <Link href="/support" className="underline underline-offset-2">support</Link>.
    </div>
  );
}
