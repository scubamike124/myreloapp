/**
 * The delivery products, and the promise the bundle makes.
 *
 * The directive's load-bearing rule is "Generate once. Reuse throughout the
 * pipeline. Do not generate two independent stories." A parent who buys the
 * bundle and finds the book and the film tell slightly different stories has
 * been sold the one thing the bundle exists to avoid.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  STORY_PRODUCTS,
  artifactsFor,
  bundleReuses,
  getStoryProduct,
  orderableProducts,
  ALWAYS_PRODUCED,
} from "../products.ts";

test("the three deliveries the directive names all exist", () => {
  const ids = STORY_PRODUCTS.map((p) => p.id).sort();
  assert.deepEqual(ids, ["bundle", "ebook", "movie"]);
});

test("exactly one product is recommended", () => {
  // Two recommendations is no recommendation.
  const recommended = STORY_PRODUCTS.filter((p) => p.recommended);
  assert.equal(recommended.length, 1);
  assert.equal(recommended[0].id, "bundle", "the bundle is the featured choice");
});

test("the bundle is the union of the other two, not a third story", () => {
  const bundle = new Set(artifactsFor("bundle"));
  for (const id of ["ebook", "movie"] as const) {
    for (const artifact of artifactsFor(id)) {
      assert.ok(bundle.has(artifact), `the bundle is missing ${artifact}, which ${id} produces`);
    }
  }
});

test("the bundle genuinely reuses rather than regenerating", () => {
  // If this ever returned nothing, "one story, two products" would have become
  // "two stories" without anyone noticing.
  const shared = bundleReuses();
  assert.ok(shared.length >= 3, `the bundle only shares ${shared.length} artifacts`);
  assert.ok(shared.includes("manuscript"), "the book and the film must share the story");
  assert.ok(shared.includes("character_bible"), "the child must be the same child");
});

test("every product produces the manuscript and the character bible", () => {
  // The choice is offered after the story is written, which is what makes reuse
  // possible at all.
  for (const product of STORY_PRODUCTS) {
    for (const artifact of ALWAYS_PRODUCED) {
      assert.ok(product.artifacts.includes(artifact), `${product.id} is missing ${artifact}`);
    }
  }
});

test("artifacts come back in an order the pipeline can just run", () => {
  const movie = artifactsFor("movie");
  const at = (a: string) => movie.indexOf(a as never);
  assert.ok(at("manuscript") < at("screenplay"), "the screenplay is written from the manuscript");
  assert.ok(at("screenplay") < at("narration_audio"), "narration is recorded from the screenplay");
  assert.ok(at("scene_video") < at("final_cut"), "the cut needs the footage");
});

test("artifacts are not repeated", () => {
  for (const product of STORY_PRODUCTS) {
    const list = artifactsFor(product.id);
    assert.equal(new Set(list).size, list.length, `${product.id} lists an artifact twice`);
  }
});

test("an unknown product id is null rather than a guess", () => {
  assert.equal(getStoryProduct("audiobook"), null);
  assert.deepEqual(artifactsFor("audiobook" as never), []);
});

test("every product can be described on a card", () => {
  // These strings are the entire basis on which a parent chooses.
  for (const p of STORY_PRODUCTS) {
    assert.ok(p.name.length > 3, p.id);
    assert.ok(p.emoji.length > 0, p.id);
    assert.ok(p.summary.length > 20, `${p.id} has no real summary`);
    assert.ok(p.includes.length >= 3, `${p.id} lists too little to choose on`);
  }
});

test("only orderable products are offered", () => {
  // Future products are declared so the pipeline can reason about them; they
  // must not reach checkout before they can be delivered.
  const orderable = orderableProducts();
  assert.ok(orderable.every((p) => !p.comingSoon));
  assert.equal(orderable.length, STORY_PRODUCTS.length, "nothing is marked coming-soon yet");
});
