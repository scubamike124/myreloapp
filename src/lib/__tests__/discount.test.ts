/**
 * What a discount is allowed to do to a price.
 *
 * The interesting cases are not "$100 minus 20%". They are the boundaries —
 * 0% and 100% are legal, -0.01% and 100.01% are not — and the inputs that
 * arrive as numbers but are not usable as money: NaN from a failed parse,
 * Infinity from a division, a negative price from a mis-signed refund.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { calculateDiscount, discountAmount } from "../discount.ts";

test("the stated example holds", () => {
  assert.equal(calculateDiscount(100, 20), 80);
});

test("ordinary prices and percentages", () => {
  assert.equal(calculateDiscount(50, 10), 45);
  assert.equal(calculateDiscount(200, 25), 150);
  assert.equal(calculateDiscount(19.99, 50), 10);      // 9.995 rounds up to the cent
  assert.equal(calculateDiscount(29.99, 15), 25.49);   // 25.4915
  assert.equal(calculateDiscount(1, 33.333), 0.67);    // fractional percentages allowed
});

test("0% and 100% are both legal, and are the edges", () => {
  assert.equal(calculateDiscount(100, 0), 100);
  assert.equal(calculateDiscount(100, 100), 0);
  // 100% off must be a clean 0, not -0: Object.is distinguishes them and
  // -0 leaks into string output as "-0" on a receipt.
  assert.ok(Object.is(calculateDiscount(49.99, 100), 0));
});

test("a free item stays free", () => {
  assert.equal(calculateDiscount(0, 0), 0);
  assert.equal(calculateDiscount(0, 50), 0);
  assert.equal(calculateDiscount(0, 100), 0);
});

test("results are settled at the cent, with no float dust", () => {
  // 0.1 + 0.2 arithmetic in disguise: naive maths gives 8.700000000000001.
  assert.equal(calculateDiscount(29, 70), 8.7);
  assert.equal(calculateDiscount(0.3, 0), 0.3);
  // Half-up at the cent boundary. 1.005 is the classic float64 trap: it is
  // stored just below 1.005, so a plain Math.round(x * 100) gives 1.00.
  assert.equal(calculateDiscount(2.01, 50), 1.01);
});

test("negative prices are rejected", () => {
  assert.throws(() => calculateDiscount(-1, 10), RangeError);
  assert.throws(() => calculateDiscount(-0.01, 0), RangeError);
  assert.throws(() => calculateDiscount(-100, 100), RangeError);
  assert.throws(() => calculateDiscount(-1, 10), /price must not be negative/);
});

test("discounts below 0% or above 100% are rejected", () => {
  assert.throws(() => calculateDiscount(100, -1), RangeError);
  assert.throws(() => calculateDiscount(100, -0.01), RangeError);
  assert.throws(() => calculateDiscount(100, 101), RangeError);
  assert.throws(() => calculateDiscount(100, 100.01), RangeError);
  assert.throws(() => calculateDiscount(100, 1000), /between 0 and 100/);
});

test("a bad price is reported before a bad percentage", () => {
  // Both are wrong here. The message must name the price, or the caller fixes
  // the percentage, re-runs, and gets the same throw.
  assert.throws(() => calculateDiscount(-5, 200), /price/);
});

test("values that are numbers but not amounts are rejected", () => {
  for (const bad of [NaN, Infinity, -Infinity]) {
    assert.throws(() => calculateDiscount(bad, 10), TypeError, `price accepted ${bad}`);
    assert.throws(() => calculateDiscount(100, bad), TypeError, `percent accepted ${bad}`);
  }
});

test("non-numeric arguments are rejected rather than coerced", () => {
  // "100" - 20 would quietly work in JS. It must not: a string price means an
  // unparsed form field reached the till.
  const bad: unknown[] = ["100", null, undefined, {}, [], true];
  for (const value of bad) {
    assert.throws(
      () => calculateDiscount(value as number, 10),
      TypeError,
      `price accepted ${JSON.stringify(value) ?? String(value)}`,
    );
    assert.throws(
      () => calculateDiscount(100, value as number),
      TypeError,
      `percent accepted ${JSON.stringify(value) ?? String(value)}`,
    );
  }
});

test("the discount and the final price add back up to the original", () => {
  for (const [price, percent] of [
    [100, 20],
    [29.99, 15],
    [19.99, 50],
    [7.77, 33],
    [1000, 0],
    [1000, 100],
  ] as const) {
    // Compared in whole cents. Both halves are exact to the cent, but adding
    // two float64 cent values reintroduces dust of its own (10 + 9.99 is
    // 19.990000000000002) — that is the test's arithmetic, not the module's.
    const cents = (n: number) => Math.round(n * 100);
    assert.equal(
      cents(calculateDiscount(price, percent)) + cents(discountAmount(price, percent)),
      cents(price),
      `${percent}% off ${price} does not reconcile`,
    );
  }
});

test("discountAmount rejects the same inputs calculateDiscount does", () => {
  assert.throws(() => discountAmount(-1, 10), RangeError);
  assert.throws(() => discountAmount(100, 101), RangeError);
  assert.throws(() => discountAmount(NaN, 10), TypeError);
});
