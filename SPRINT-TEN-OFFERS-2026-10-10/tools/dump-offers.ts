// Dumps the offer registry and demo QA as JSON for gen-results.py. Copy into an amberai checkout's scripts/ folder and run: npx tsx scripts/dump-offers.ts > data/offers.json
import { OFFERS } from "../src/lib/offers/registry";
import { runAllDemoQa } from "../src/lib/offers/demos";
import { EVIDENCE_ITEMS } from "../src/lib/offers/evidence-items";
const qa = runAllDemoQa();
const out = OFFERS.map((o) => {
  const checks = qa[o.slug] ?? [];
  return {
    number: o.number, slug: o.slug, name: o.name, buyer: o.buyer, deliverable: o.deliverable,
    price: o.price, status: o.status, bookkeeping: o.bookkeeping,
    qa: { passed: checks.filter((c) => c.passed).length, total: checks.length, failed: checks.filter((c) => !c.passed).map((c) => c.id) },
    evidenceItems: EVIDENCE_ITEMS.filter((i) => i.offer === o.slug).length,
  };
});
console.log(JSON.stringify(out, null, 1));
