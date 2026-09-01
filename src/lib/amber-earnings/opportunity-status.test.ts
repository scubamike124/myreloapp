import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { opportunityStatusFrom, type CapabilityCheck } from "./execution-capability";

function check(partial: Partial<CapabilityCheck>): CapabilityCheck {
  return {
    canAccess: true,
    canAcceptOrApply: true,
    canPerformAllWork: true,
    canProduceDeliverable: true,
    canSubmit: true,
    canVerifySubmission: true,
    canTrackPayment: true,
    missing: [],
    missingCapabilities: [],
    missingInputs: [],
    pipelineBlockers: [],
    whyCanPerform: "skill fit",
    whyCannot: "",
    primaryBlocker: "",
    workCategory: "api_documentation",
    readyToWork: true,
    ...partial,
  };
}

describe("opportunityStatusFrom", () => {
  it("does not paint BLOCKED for stale rejected when Amber can still bid and perform", () => {
    assert.equal(opportunityStatusFrom(check({}), "rejected"), "READY_TO_WORK");
    assert.equal(
      opportunityStatusFrom(check({ readyToWork: false }), "rejected"),
      "READY_TO_WORK",
    );
  });

  it("maps canBid+canPerform to READY_TO_WORK even when readyToWork flag was false", () => {
    assert.equal(
      opportunityStatusFrom(
        check({ canAcceptOrApply: true, canPerformAllWork: true, readyToWork: false }),
        undefined,
      ),
      "READY_TO_WORK",
    );
  });

  it("keeps BLOCKED when capability is genuinely missing", () => {
    assert.equal(
      opportunityStatusFrom(
        check({
          canAcceptOrApply: false,
          canPerformAllWork: false,
          readyToWork: false,
          missingCapabilities: ["browser automation"],
        }),
        "rejected",
      ),
      "BLOCKED",
    );
  });

  it("maps in-flight statuses to WORKING", () => {
    assert.equal(opportunityStatusFrom(check({}), "accepted"), "WORKING");
    assert.equal(opportunityStatusFrom(check({}), "working"), "WORKING");
  });
});
