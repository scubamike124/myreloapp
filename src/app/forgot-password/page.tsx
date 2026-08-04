import Link from "next/link";
import { redirect } from "next/navigation";
import DesignShell from "@/components/design/DesignShell";
import ForgotPasswordForm from "@/components/account/ForgotPasswordForm";
import { dbConfigured } from "@/lib/db";
import { currentUser } from "@/lib/accounts";

export const metadata = { title: "Forgot password — Reelo" };
export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  if (dbConfigured() && (await currentUser())) redirect("/account");

  return (
    <DesignShell>
      <main className="amber-safe mx-auto max-w-[430px] px-6 pb-20 pt-14">
        <h1 className="font-display text-3xl font-extrabold tracking-[-0.02em] text-white">Forgot password</h1>
        <p className="mt-2 mb-7 text-[14.5px] text-white/55">
          Enter the email on your Reelo account and we&apos;ll help you get back in.
        </p>
        {dbConfigured() ? (
          <ForgotPasswordForm />
        ) : (
          <p className="text-[13px] text-white/55">
            Accounts aren&apos;t available yet. See <Link href="/support" className="underline">support</Link>.
          </p>
        )}
      </main>
    </DesignShell>
  );
}
