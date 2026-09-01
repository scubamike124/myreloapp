import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseSfTaxSaleRuns } from "./sf-tax-sale";

function tm(x: number, y: number, text: string) {
  return { x, y, text };
}

describe("SF tax-sale PDF column parse", () => {
  it("keeps APN, situs, and minimum bid and never stores the assessee column", () => {
    const y = 317.9;
    const parcels = parseSfTaxSaleRuns([
      tm(12.7, y, "22"),
      tm(32.3, y, "3115"),
      tm(55.6, y, "022"),
      tm(84.0, y, "578"),
      tm(92.7, y, "HEARST AVE"),
      tm(142.7, y, "DAVIS NANCY J & DARRYL E"),
      tm(229.2, y, "$180,706.37"),
    ]);
    assert.equal(parcels.length, 1);
    assert.equal(parcels[0].apn, "3115022");
    assert.match(parcels[0].situs, /578 HEARST AVE/i);
    assert.equal(parcels[0].minimumBidCents, 18070637);
    const blob = JSON.stringify(parcels);
    assert.equal(blob.includes("DAVIS"), false);
    assert.equal(blob.includes("NANCY"), false);
  });

  it("skips header rows", () => {
    const parcels = parseSfTaxSaleRuns([
      tm(12, 400, "VOL"),
      tm(32, 400, "BLOCK"),
      tm(55, 400, "LOT"),
      tm(84, 400, "SITUS"),
      tm(142, 400, "CURRENT ASSESSEE"),
      tm(229, 400, "MINIMUM BID"),
    ]);
    assert.equal(parcels.length, 0);
  });

  it("dedupes linearized PDF duplicates of the same row", () => {
    const y = 317.9;
    const row = [
      tm(12.7, y, "22"),
      tm(32.3, y, "3115"),
      tm(55.6, y, "022"),
      tm(84.0, y, "578"),
      tm(92.7, y, "HEARST AVE"),
      tm(229.2, y, "$180,706.37"),
    ];
    const parcels = parseSfTaxSaleRuns([...row, ...row]);
    assert.equal(parcels.length, 1);
    assert.equal(parcels[0].apn, "3115022");
  });
});
