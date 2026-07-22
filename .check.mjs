import hey from "./src/data/heygen-avatars.json" with { type: "json" };
import chars from "./src/data/character-avatars.json" with { type: "json" };
const all = [...chars, ...hey];
const mk = (k) => new RegExp(`\b${k.trim().replace(/[.*+?^${}()|[\]\]/g, "\$&")}(?:s|es|ing|er)?\b`, "i");
const test = (h, kws) => kws.some((k) => mk(k).test(h));
const CASES = [
  ["cars", ["car", "sedan", "sports car"]],
  ["cats", ["cat", "kitten", "tabby"]],
  ["dogs", ["dog", "puppy", "retriever"]],
  ["technology", ["developer", "tech", "coder", "programmer", "laptop", "macbook", "ipad", "computer", "startup"]],
  ["dragons", ["dragon", "wyvern", "drake"]],
  ["fruit", ["apple", "banana", "orange", "strawberry", "fruit"]],
  ["children", ["child", "kid", "toddler"]],
];
for (const [label, kws] of CASES) {
  const hits = all.filter((a) => test(`${a.name} ${(a.tags ?? []).join(" ")}`, kws));
  console.log(label.padEnd(12), String(hits.length).padStart(4), " e.g. " + hits.slice(0, 4).map((h) => h.name).join(", "));
}
