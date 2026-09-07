/**
 * Renders a real diff string exactly as the backend produced it — either a
 * unified "--- before / +++ after" block built from an Edit tool's own
 * old_string/new_string, or a "+++ path" full-content block from a Write.
 * Line-level coloring only (real +/- prefixes), never a fabricated
 * side-by-side reconstruction of content the backend didn't actually send.
 */
export function DiffView({ diff }: { diff: string }) {
  const lines = diff.split("\n");
  return (
    <pre className="max-h-80 overflow-auto rounded-lg border border-black/8 bg-black/[.03] px-2.5 py-2 font-mono text-[11.5px] leading-relaxed">
      {lines.map((line, i) => {
        let cls = "text-black/55";
        if (line.startsWith("+++") || line.startsWith("+")) cls = "text-emerald-700";
        else if (line.startsWith("---") || line.startsWith("-")) cls = "text-red-600";
        else if (line.startsWith("@@")) cls = "text-sky-700";
        return (
          <div key={i} className={cls}>
            {line || " "}
          </div>
        );
      })}
    </pre>
  );
}
