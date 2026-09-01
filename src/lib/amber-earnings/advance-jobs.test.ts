import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { nextMoltAction, sporeDeliverableStale } from "./advance-jobs";
import { moltSubmitBody } from "./moltjobs";
import { blocksNewAccepts } from "./persist";
import { executeSkillFitWork } from "./execute-work";

describe("MoltJobs perform → submit → payment actions", () => {
  it("does not start or submit while the job is still OPEN", () => {
    assert.equal(
      nextMoltAction({ platformStatus: "OPEN", hasDeliverable: true, qaPassed: true, alreadySubmitted: false }),
      "wait_assignment",
    );
  });

  it("performs work first when there is no QA-passed deliverable", () => {
    assert.equal(
      nextMoltAction({ platformStatus: "ASSIGNED", hasDeliverable: false, qaPassed: false, alreadySubmitted: false }),
      "perform",
    );
  });

  it("starts only after ASSIGNED, submits on IN_PROGRESS, waits on IN_REVIEW", () => {
    assert.equal(
      nextMoltAction({ platformStatus: "ASSIGNED", hasDeliverable: true, qaPassed: true, alreadySubmitted: false }),
      "start",
    );
    assert.equal(
      nextMoltAction({ platformStatus: "IN_PROGRESS", hasDeliverable: true, qaPassed: true, alreadySubmitted: false }),
      "submit",
    );
    assert.equal(
      nextMoltAction({ platformStatus: "IN_REVIEW", hasDeliverable: true, qaPassed: true, alreadySubmitted: true }),
      "await_review",
    );
  });

  it("only verifies payment on COMPLETED/APPROVED — never on bid or IN_REVIEW", () => {
    assert.equal(
      nextMoltAction({ platformStatus: "COMPLETED", hasDeliverable: true, qaPassed: true, alreadySubmitted: true }),
      "verify_payment",
    );
    assert.notEqual(
      nextMoltAction({ platformStatus: "IN_REVIEW", hasDeliverable: true, qaPassed: true, alreadySubmitted: true }),
      "verify_payment",
    );
  });

  it("submit body uses required outputData object (not summary/output fields)", () => {
    const body = moltSubmitBody({ summary: "done", output: "# docs", testsNotes: "PASS: ok" });
    assert.equal(typeof body.outputData, "object");
    assert.equal(body.outputData.deliverable, "# docs");
    assert.equal("summary" in body, false);
    assert.equal("output" in body, false);
  });

  it("accepted/working/testing block new accepts; submitted does not", () => {
    assert.equal(blocksNewAccepts("accepted"), true);
    assert.equal(blocksNewAccepts("working"), true);
    assert.equal(blocksNewAccepts("testing"), true);
    assert.equal(blocksNewAccepts("submitted"), false);
    assert.equal(blocksNewAccepts("paid"), false);
  });

  it("Spore hosted /deliver 404 does not freeze MoltJobs new accepts", () => {
    assert.equal(
      blocksNewAccepts("working", {
        platformSlug: "sporeagent",
        error:
          "Spore deliver endpoint not available on hosted API (404). Deliverable is verified locally and queued until Spore ships /api/tasks/:id/deliver.",
      }),
      false,
    );
    assert.equal(
      blocksNewAccepts("working", {
        platformSlug: "sporeagent",
        paymentStatus: "marketplace_unavailable",
        error: "",
      }),
      false,
    );
  });

  it("MoltJobs waiting for poster assignment does not freeze other bids", () => {
    assert.equal(
      blocksNewAccepts("working", {
        platformSlug: "moltjobs",
        acceptance: "platform=OPEN waiting for poster to assign bid",
      }),
      false,
    );
    assert.equal(
      blocksNewAccepts("accepted", {
        platformSlug: "moltjobs",
        acceptance: "platform=OPEN waiting for poster to assign bid",
      }),
      false,
    );
    // Truly assigned / in progress still consumes capacity
    assert.equal(
      blocksNewAccepts("working", {
        platformSlug: "moltjobs",
        acceptance: "ASSIGNED → IN_PROGRESS",
      }),
      true,
    );
  });

  it("replaces mismatched API-docs artifacts on translation jobs", () => {
    assert.equal(
      sporeDeliverableStale(
        {
          testsNotes: "PASS: markdown docs with 8 endpoint sections, auth, errors, examples.",
          submission: "# FastAPI\n## Endpoints",
        } as never,
        "technical_translation",
      ),
      true,
    );
    assert.equal(
      sporeDeliverableStale(
        { testsNotes: "PASS: EN source retained; ES/FR/DE sections present", submission: "## ES" } as never,
        "technical_translation",
      ),
      false,
    );
  });

  it("translation work is not an API-docs stub", () => {
    const work = executeSkillFitWork({
      title: "Translate 25 pages of technical docs EN to ES, FR, DE",
      description: "Technical API documentation getting-started guide with developer documentation",
      category: "technical_translation",
    });
    assert.equal(work.ok, true);
    assert.equal(work.category, "technical_translation");
    assert.match(work.testsNotes, /^PASS:/);
    assert.match(work.deliverable, /## ES/);
    assert.match(work.deliverable, /## FR/);
    assert.match(work.deliverable, /## DE/);
    assert.doesNotMatch(work.testsNotes, /endpoint sections/);
  });

  it("title Translate + endpoint-section QA is stale even if category is wrong", () => {
    assert.equal(
      sporeDeliverableStale(
        {
          title: "Translate 25 pages of technical docs EN to ES, FR, DE",
          testsNotes: "PASS: markdown docs with 8 endpoint sections, auth, errors, examples.",
          submission: "# FastAPI\n## Endpoints",
        } as never,
        "api_documentation",
      ),
      true,
    );
  });
});
