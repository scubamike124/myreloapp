/**
 * Applying a percentage discount to a price.
 *
 * The rejection rules are deliberately loud rather than forgiving. A silently
 * clamped -20% price or a 150% discount becomes a refund, and the place that
 * notices is the ledger, not the caller. Throwing puts the failure at the call
 * site where the bad input actually came from.
 */

/** Prices are money, so results are settled at the cent. */
function roundToCents(value: number): number {
  // Scale first, then strip binary-representation noise before rounding:
  // 1.005 * 100 is 100.49999999999999 in float64, which would round *down* to
  // a cent that half-up rounding says should be 1.01. toPrecision(12) collapses
  // that noise without touching any digit a price could legitimately carry.
  const cents = Math.round(Number((value * 100).toPrecision(12)));
  // `+ 0` normalises -0 to 0, so a 100% discount reads as 0 rather than -0.
  return cents / 100 + 0;
}

/**
 * Returns `price` reduced by `discountPercent`, rounded to the nearest cent.
 *
 * `calculateDiscount(100, 20)` is `80`.
 *
 * @throws {TypeError} if either argument is not a finite number.
 * @throws {RangeError} if `price` is negative, or `discountPercent` is outside 0–100.
 */
export function calculateDiscount(price: number, discountPercent: number): number {
  if (typeof price !== "number" || !Number.isFinite(price)) {
    throw new TypeError(`price must be a finite number, received: ${String(price)}`);
  }
  if (typeof discountPercent !== "number" || !Number.isFinite(discountPercent)) {
    throw new TypeError(
      `discountPercent must be a finite number, received: ${String(discountPercent)}`,
    );
  }
  if (price < 0) {
    throw new RangeError(`price must not be negative, received: ${price}`);
  }
  if (discountPercent < 0 || discountPercent > 100) {
    throw new RangeError(`discountPercent must be between 0 and 100, received: ${discountPercent}`);
  }

  return roundToCents(price * ((100 - discountPercent) / 100));
}

/** The amount taken off, rounded to the nearest cent. Same validation rules. */
export function discountAmount(price: number, discountPercent: number): number {
  // Derived from the final price so the two always add back up to `price`
  // at cent precision — rounding each independently can drift by a cent.
  return roundToCents(roundToCents(price) - calculateDiscount(price, discountPercent));
}
