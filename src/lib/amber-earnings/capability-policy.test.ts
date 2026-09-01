import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sporeCanComplete, moltCanComplete } from "./policy";
import { assessSporeCapability } from "./execution-capability";

describe("Amber work capability families", () => {
  it("recognizes scrape / pytest / translate / RAG / CSV dashboard as performable skills", () => {
    const cases = [
      {
        title: "Scrape & structure 500 product listings from e-commerce site",
        description: "Extract product names, prices, descriptions, images, and SKUs. Output as clean JSON.",
        requirements: ["web-scraping", "data-extraction", "json"],
      },
      {
        title: "Generate comprehensive pytest suite for FastAPI REST API",
        description: "Write pytest suites covering all 24 endpoints. Include edge cases, auth flows.",
        requirements: ["python", "testing", "fastapi"],
      },
      {
        title: "Translate 25 pages of technical docs EN to ES, FR, DE",
        description: "Translate developer documentation into three languages. Preserve code blocks.",
        requirements: ["translation", "documentation", "multilingual"],
      },
      {
        title: "Build RAG pipeline over 200 PDF research papers",
        description: "Ingest academic PDFs, chunk and embed them, set up vector store with semantic search.",
        requirements: ["rag", "embeddings", "langchain"],
      },
      {
        title: "Create interactive sales dashboard from CSV data",
        description: "Build interactive dashboard with time series charts and filterable tables.",
        requirements: ["data-viz", "charts", "html"],
      },
    ];
    for (const c of cases) {
      const cap = sporeCanComplete(c);
      assert.equal(cap.ok, true, `${c.title} → ${cap.reasons.join(" | ")}`);
    }
  });

  it("rejects Solidity audit and GPU fine-tune with exact missing capabilities", () => {
    const sol = sporeCanComplete({
      title: "Security audit of Solidity ERC-20 token contract",
      description: "Full security audit. Check for reentrancy, overflow, access control.",
      requirements: ["security", "solidity", "blockchain"],
    });
    assert.equal(sol.ok, false);
    assert.ok(sol.missingCapabilities.some((m) => /Solidity|Blockchain/i.test(m)));

    const ml = sporeCanComplete({
      title: "Fine-tune ResNet-50 image classifier on custom dataset",
      description: "Fine-tune on 5,000 product images across 12 categories.",
      requirements: ["ml", "computer-vision", "pytorch"],
    });
    assert.equal(ml.ok, false);
    assert.ok(ml.missingCapabilities.some((m) => /GPU/i.test(m)));
  });

  it("separates skill fit from Spore pipeline blockers", () => {
    const check = assessSporeCapability({
      hasAgentId: false,
      boardOk: true,
      title: "Create interactive sales dashboard from CSV data",
      description: "Build interactive dashboard with charts from CSV.",
      requirements: ["data-viz", "charts", "html"],
      submitLive: false,
    });
    assert.equal(check.canPerformAllWork, true);
    assert.equal(check.canAcceptOrApply, false);
    assert.equal(check.readyToWork, false);
    assert.ok(check.pipelineBlockers.some((b) => /agent id missing/i.test(b)));

    const submitGap = assessSporeCapability({
      hasAgentId: true,
      boardOk: true,
      title: "Create interactive sales dashboard from CSV data",
      description: "Build interactive dashboard with charts from CSV.",
      requirements: ["data-viz", "charts", "html"],
      submitLive: false,
    });
    assert.equal(submitGap.canPerformAllWork, true);
    assert.equal(submitGap.canAcceptOrApply, false);
    assert.equal(submitGap.canSubmit, false);
    assert.match(submitGap.primaryBlocker, /deliver/i);

    const withSubmit = assessSporeCapability({
      hasAgentId: true,
      boardOk: true,
      title: "Create interactive sales dashboard from CSV data",
      description: "Build interactive dashboard with charts from CSV.",
      requirements: ["data-viz", "charts", "html"],
      submitLive: true,
    });
    assert.equal(withSubmit.canAcceptOrApply, true);
    assert.equal(withSubmit.canSubmit, true);
    assert.equal(withSubmit.readyToWork, true);
  });

  it("rejects Molt social posting as a missing human-account capability", () => {
    const cap = moltCanComplete({
      title: "Post publicly that AI agents can get paid work here, with proof of publication",
      description: "Write and publish ONE public post about MoltJobs, then prove you published it.",
    });
    assert.equal(cap.ok, false);
    assert.ok(cap.missingCapabilities.some((m) => /social account/i.test(m)));
  });
});
