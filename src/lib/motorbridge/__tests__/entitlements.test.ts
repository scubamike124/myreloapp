import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PLANS,
  effectivePriceUsd,
  checkVehicleLimit,
  detectLikelyLimitEvasion,
  trialIsActive,
  trialTimeRemainingMs,
  TRIAL_DURATION_MS,
} from "../entitlements.ts";

describe("plan pricing is data, not scattered logic", () => {
  it("every plan with a fixed price has a positive vehicle limit or is trial", () => {
    for (const plan of Object.values(PLANS)) {
      if (plan.priceUsd !== null && plan.id !== "trial") {
        assert.ok(plan.vehicleLimit === null || plan.vehicleLimit > 0, plan.id);
      }
    }
  });

  it("enterprise has no fixed price or vehicle limit — negotiated (§31)", () => {
    assert.equal(PLANS.enterprise.priceUsd, null);
    assert.equal(PLANS.enterprise.vehicleLimit, null);
  });
});

describe("effectivePriceUsd", () => {
  it("returns the plain price for a non-Data-Partner", () => {
    assert.equal(effectivePriceUsd("shop", false), 199);
  });
  it("applies the discount only for an actual Data Partner", () => {
    assert.equal(effectivePriceUsd("shop", true), 159.2);
  });
  it("never discounts a plan with no discount defined, even if flagged as a partner", () => {
    assert.equal(effectivePriceUsd("racer", true), 19);
  });
  it("enterprise stays unpriced regardless of Data Partner status", () => {
    assert.equal(effectivePriceUsd("enterprise", true), null);
  });
});

describe("checkVehicleLimit", () => {
  it("allows under the limit", () => {
    assert.equal(checkVehicleLimit("shop", 29).allowed, true);
  });
  it("blocks at the limit, not one past it", () => {
    assert.equal(checkVehicleLimit("shop", 30).allowed, false);
  });
  it("never blocks enterprise", () => {
    assert.equal(checkVehicleLimit("enterprise", 100000).allowed, true);
  });
});

describe("limit-evasion detection flags for owner review, never auto-bans (§31)", () => {
  it("flags rapid add/remove churn", () => {
    const result = detectLikelyLimitEvasion(20, 5);
    assert.equal(result.allowed, false);
  });
  it("does not flag ordinary fleet turnover", () => {
    const result = detectLikelyLimitEvasion(2, 30);
    assert.equal(result.allowed, true);
  });
});

describe("24-hour trial starts at first use, not account creation (§31)", () => {
  it("is active immediately after starting", () => {
    assert.equal(trialIsActive(new Date().toISOString()), true);
  });
  it("is not active before it has ever started", () => {
    assert.equal(trialIsActive(null), false);
  });
  it("expires after 24 hours", () => {
    const startedAt = new Date(Date.now() - TRIAL_DURATION_MS - 1000).toISOString();
    assert.equal(trialIsActive(startedAt), false);
  });
  it("reports remaining time honestly, floored at zero", () => {
    const startedAt = new Date(Date.now() - TRIAL_DURATION_MS - 5000).toISOString();
    assert.equal(trialTimeRemainingMs(startedAt), 0);
  });
});
