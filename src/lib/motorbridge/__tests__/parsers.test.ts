import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseObd2Log } from "../parsers/obd2-log";
import { parseTelemetryCsv } from "../parsers/telemetry-csv";
import { parseJ1939Log } from "../parsers/j1939-log";

const fixture = (name: string) => readFileSync(path.join(__dirname, "..", "fixtures", name), "utf8");

describe("generic OBD-II CSV parser", () => {
  const csv = fixture("obd2-sample.csv");

  it("parses every row into a powertrain sample", () => {
    const result = parseObd2Log(csv, "veh-1", "src-1");
    assert.equal(result.ok, true);
    assert.equal(result.telemetrySessions.length, 1);
    assert.equal(result.telemetrySessions[0].powertrainSamples.length, 5);
  });

  it("reads RPM and normalizes MAP to kPa without losing the reading", () => {
    const result = parseObd2Log(csv, "veh-1", "src-1");
    const first = result.telemetrySessions[0].powertrainSamples[0];
    assert.equal(first.rpm?.value, 850);
    assert.equal(first.gasoline?.boostOrMap?.normalizedUnit, "kpa");
    assert.equal(first.gasoline?.boostOrMap?.normalizedValue, 32);
  });

  it("never invents a value for a column that was not found", () => {
    const noHeaderCsv = "a,b\n1,2\n";
    const result = parseObd2Log(noHeaderCsv, "veh-1", "src-1");
    assert.equal(result.ok, true);
    assert.ok(result.unresolvedFields.length > 0);
    assert.equal(result.telemetrySessions[0].powertrainSamples[0].rpm, null);
  });

  it("fails closed on an empty file rather than fabricating a session", () => {
    const result = parseObd2Log("", "veh-1", "src-1");
    assert.equal(result.ok, false);
    assert.equal(result.telemetrySessions.length, 0);
  });
});

describe("generic motorsport telemetry CSV parser", () => {
  const csv = fixture("telemetry-sample.csv");

  it("parses every row and prefers boost (psi) over MAP when both could apply", () => {
    const result = parseTelemetryCsv(csv, "veh-2", "src-2");
    assert.equal(result.ok, true);
    const first = result.telemetrySessions[0].powertrainSamples[0];
    assert.equal(first.gasoline?.boostOrMap?.unit, "psi");
    assert.ok(Math.abs((first.gasoline?.boostOrMap?.normalizedValue ?? 0) - 6.894757293168 * 2) < 1e-6);
  });

  it("reads lambda without inventing an AFR conversion", () => {
    const result = parseTelemetryCsv(csv, "veh-2", "src-2");
    const first = result.telemetrySessions[0].powertrainSamples[0];
    assert.equal(first.gasoline?.lambdaOrAfr?.lambda, 0.98);
    assert.equal(first.gasoline?.lambdaOrAfr?.afr, null);
  });

  it("marks the session as track use, not street", () => {
    const result = parseTelemetryCsv(csv, "veh-2", "src-2");
    assert.equal(result.telemetrySessions[0].sessionType, "track");
  });
});

describe("generic J1939 heavy-duty log parser", () => {
  const csv = fixture("j1939-sample.csv");

  it("finds columns by SPN number regardless of surrounding label text", () => {
    const result = parseJ1939Log(csv, "veh-3", "src-3");
    assert.equal(result.ok, true);
    const first = result.telemetrySessions[0].powertrainSamples[0];
    assert.equal(first.rpm?.value, 700);
    assert.equal(first.diesel?.defLevelPercent, 64);
  });

  it("classifies DPF status from free text without guessing on unrecognized text", () => {
    const result = parseJ1939Log(csv, "veh-3", "src-3");
    const samples = result.telemetrySessions[0].powertrainSamples;
    assert.equal(samples[0].diesel?.dpfStatus, "normal");
    assert.equal(samples[2].diesel?.dpfStatus, "regenerating");
  });

  it("tags the vehicle category as commercial/fleet, not passenger", () => {
    const result = parseJ1939Log(csv, "veh-3", "src-3");
    assert.equal(result.vehicle.category, "commercial_truck_fleet");
  });

  it("carries engine hours through for duty-cycle analysis (§19)", () => {
    const result = parseJ1939Log(csv, "veh-3", "src-3");
    assert.equal(result.telemetrySessions[0].powertrainSamples[0].diesel?.engineHours, 4210.5);
  });
});
