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
import { FLAT_TOKEN_COST, usdFromTokens } from "../../token-pricing.ts";

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

test("prices come from the pricing table, not from this file", () => {
  // "Change it everywhere so there isn't a confusion on price." A price that
  // exists in two places is a price that will eventually disagree with itself
  // on a checkout screen, so the products read FLAT_TOKEN_COST and never carry
  // a literal.
  assert.equal(getStoryProduct("ebook")!.tokens, FLAT_TOKEN_COST["storybook-ebook"]);
  assert.equal(getStoryProduct("movie")!.tokens, FLAT_TOKEN_COST["storybook-movie"]);
  assert.equal(getStoryProduct("bundle")!.tokens, FLAT_TOKEN_COST["storybook-bundle"]);
});

test("the agreed prices are the ones in force", () => {
  // The owner's decision, pinned: e-book 1, movie 4. The bundle matches the
  // movie so the book comes free with the film - at 5 it was not cheaper than
  // buying both, which its own card claims.
  assert.equal(getStoryProduct("ebook")!.tokens, 1);
  assert.equal(getStoryProduct("movie")!.tokens, 4);
  assert.equal(getStoryProduct("bundle")!.tokens, 4);
});

test("the bundle costs less than buying both separately", () => {
  // Its card says "cheaper than buying the two separately". If that ever stops
  // being true the card is a false claim, not a marketing choice.
  const ebook = getStoryProduct("ebook")!.tokens;
  const movie = getStoryProduct("movie")!.tokens;
  const bundle = getStoryProduct("bundle")!.tokens;
  assert.ok(bundle < ebook + movie, `bundle ${bundle} is not cheaper than ${ebook} + ${movie}`);
});

test("every product's price clears what it costs to produce", () => {
  // The check that would have caught pricing the movie on the Standard tier: at
  // 4 tokens ($40) a $28.80 film leaves nothing for narration, music, or the
  // re-render the Director AI is required to perform.
  // Provider rates from costs.ts, stated here because that module imports
  // through the "@/" alias the test runner cannot resolve.
  const VEO_FAST_720_PER_SEC = 0.1;
  const GEMINI_IMAGE = 0.039;
  const SCENES = 12;
  const SCENE_SECONDS = 6;

  const video = VEO_FAST_720_PER_SEC * SCENE_SECONDS * SCENES;
  const illustrations = GEMINI_IMAGE * SCENES;
  const cogs: Record<string, number> = {
    ebook: illustrations,
    movie: video,
    bundle: video + illustrations,
  };

  for (const [productId, cost] of Object.entries(cogs)) {
    const revenue = usdFromTokens(getStoryProduct(productId)!.tokens);
    // Doubled, because a single rejected cut re-renders the whole film and the
    // Director AI is required to reject below-threshold work.
    assert.ok(
      revenue > cost * 2,
      `${productId}: ${revenue} does not cover ${cost.toFixed(2)} with one re-render`,
    );
  }
});
