// ---------------------------------------------------------------------------
// Pricing guard.
//
// Two things this catches, both of which had already happened:
//
//   1. A price or token allowance written down twice and drifting apart. The
//      admin dashboard reported Business Center Pro at 3,000 tokens while the
//      pricing page sold it at 750.
//   2. A plan whose token allowance is generous enough to sell videos below
//      cost. At 3,000 tokens that plan worked out to $0.10 per token against a
//      $0.50 provider cost per video — a loss on every generation.
//
// Run with: node scripts/check-pricing.mjs
// ---------------------------------------------------------------------------

import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

let failures = 0;
const fail = (msg) => {
  console.error(`  FAIL  ${msg}`);
  failures++;
};
const pass = (msg) => console.log(`  ok    ${msg}`);

// --- 1. One source of truth -------------------------------------------------

const plans = read("src/lib/plans.ts");
const specs = [...plans.matchAll(/\{ name: "([A-Z ]+)", price: ([\d.]+), tokens: (\d+) \}/g)].map((m) => ({
  name: m[1],
  price: Number(m[2]),
  tokens: Number(m[3]),
}));

if (specs.length !== 7) fail(`expected 7 plans in plans.ts, found ${specs.length}`);
else pass(`plans.ts defines ${specs.length} plans`);

// Nothing outside plans.ts may hard-code a plan's token allowance.
for (const file of ["src/lib/admin.ts", "src/lib/costs.ts", "src/components/Pricing.tsx"]) {
  const src = read(file);
  const literal = /tokens:\s*\d{2,}/.exec(src) || /tokens: "\d+"/.exec(src);
  if (literal) fail(`${file} hard-codes a token allowance (${literal[0]}) — derive it from plans.ts`);
  else pass(`${file} derives its numbers`);
}

// --- 2. No plan sells generation below cost --------------------------------

// Mirrors src/lib/costs.ts. Kept explicit here so the guard fails loudly if the
// provider prices there are edited without re-checking the margins.
const VIDEO_SECONDS = 6;
const P = { veo720: 0.1, image: 0.039, heygenPerMin: 1.0, textIn: 0.3, textOut: 2.5 };
const text = (i, o) => (i / 1e6) * P.textIn + (o / 1e6) * P.textOut;

const LINES = [
  { label: "Talking Photo", cost: P.veo720 * VIDEO_SECONDS, tokens: 4 },
  { label: "Dancing Photo", cost: P.veo720 * VIDEO_SECONDS, tokens: 4 },
  { label: "AI Avatar Studio", cost: P.heygenPerMin * 0.5, tokens: 3 },
  { label: "Website Commercial", cost: P.heygenPerMin * 0.5 + text(8000, 1500), tokens: 3 },
  { label: "Custom Avatar Creator", cost: P.image, tokens: 1 },
  { label: "Bedtime Storybook", cost: P.image * 6 + text(1200, 2500), tokens: 2 },
];

const FLOOR = 0.5; // the stated target is 50-70%

for (const plan of specs) {
  if (plan.price === 0) continue; // FREE earns nothing per token by design
  const perToken = plan.price / plan.tokens;
  let worst = { margin: Infinity, label: "" };
  for (const line of LINES) {
    const revenue = perToken * line.tokens;
    const margin = (revenue - line.cost) / revenue;
    if (margin < worst.margin) worst = { margin, label: line.label };
  }
  const pct = (worst.margin * 100).toFixed(1);
  if (worst.margin < FLOOR) {
    fail(`${plan.name} ($${plan.price} / ${plan.tokens} tokens) makes only ${pct}% on ${worst.label}`);
  } else {
    pass(`${plan.name.padEnd(20)} worst margin ${pct.padStart(5)}% (${worst.label})`);
  }
}

// --- 3. The ladder still rewards buying more -------------------------------

const paid = specs.filter((p) => p.price > 0);
for (let i = 1; i < paid.length; i++) {
  const prev = paid[i - 1].price / paid[i - 1].tokens;
  const here = paid[i].price / paid[i].tokens;
  if (here > prev) fail(`${paid[i].name} costs more per token than ${paid[i - 1].name}`);
}
if (failures === 0) pass("larger plans are cheaper per token, all the way up");

console.log(failures === 0 ? "\nPricing is consistent.\n" : `\n${failures} problem(s).\n`);
process.exit(failures === 0 ? 0 : 1);
