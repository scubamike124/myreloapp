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
    <pre className="max-h-80 overflow-auto rounded-lg bg-black/40 px-2.5 py-2 font-mono text-[11.5px] leading-relaxed">
      {lines.map((line, i) => {
        let cls = "text-white/55";
        if (line.startsWith("+++") || line.startsWith("+")) cls = "text-emerald-300";
        else if (line.startsWith("---") || line.startsWith("-")) cls = "text-red-300";
        else if (line.startsWith("@@")) cls = "text-sky-300";
        return (
          <div key={i} className={cls}>
            {line || " "}
          </div>
        );
      })}
    </pre>
  );
}
