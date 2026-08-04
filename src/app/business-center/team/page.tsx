import BusinessShell from "@/components/design/BusinessShell";
import TeamInvites from "@/components/business/TeamInvites";

export const metadata = { title: "Team — Reelo" };

export default function TeamPage() {
  return (
    <BusinessShell active="team" variant="overview">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">Team invites</h1>
        <p className="mt-1 text-[15px]" style={{ color: "#a99a9c" }}>
          Invite collaborators by email. Shared billing seats are not included yet.
        </p>
      </div>
      <TeamInvites />
    </BusinessShell>
  );
}
