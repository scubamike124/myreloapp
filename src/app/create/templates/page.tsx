import DesignShell from "@/components/design/DesignShell";
import TemplateGallery from "@/components/create/TemplateGallery";

export const metadata = {
  title: "Video Templates — Reelo",
  description: "Browse production-ready AI video templates by industry, goal, and platform.",
};

export default function TemplatesPage() {
  return (
    <DesignShell glow="radial-gradient(900px 450px at 40% -10%,rgba(201,162,39,.18),transparent 60%),radial-gradient(700px 500px at 90% 20%,rgba(225,29,42,.12),transparent 55%)">
      <TemplateGallery />
    </DesignShell>
  );
}
