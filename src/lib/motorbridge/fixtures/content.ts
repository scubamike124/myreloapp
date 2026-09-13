/**
 * Fixture content as plain string exports rather than files read from disk
 * at runtime. Tests and the local Node CLI can always read a file — the
 * deployed target for this app (OpenNext on Cloudflare Workers, see
 * package.json's `deploy` script and src/lib/db.ts's `isCloudflareWorkers`
 * check) cannot: there is no filesystem at runtime, only what got bundled.
 * A single canonical string per fixture, imported by both the unit tests
 * and the "Test My Log" sample-loading API route, means there is exactly
 * one file that can drift out of sync with itself: none.
 */

export const OBD2_SAMPLE_CSV = `Timestamp,RPM,Vehicle Speed (km/h),Coolant Temp (C),Intake Air Temp (C),Throttle Position (%),Intake Manifold Pressure (kPa),Engine Load (%),Fuel Level (%)
2026-09-13T14:00:00Z,850,0,88,32,12,32,18,64
2026-09-13T14:00:01Z,1500,12,89,33,28,45,35,64
2026-09-13T14:00:02Z,2400,28,90,34,55,72,58,64
2026-09-13T14:00:03Z,3100,41,91,35,72,88,71,64
2026-09-13T14:00:04Z,2000,45,91,35,20,40,30,64
`;

export const TELEMETRY_SAMPLE_CSV = `Time (s),RPM,TPS (%),MAP (kPa),Lambda,Ignition Timing (deg),Boost (psi),Coolant Temp (C),Oil Pressure (psi),Knock Retard (deg)
0.00,4200,18,55,0.98,12,2,84,58,0
0.10,5800,62,110,0.91,18,9,86,61,0
0.20,6900,95,168,0.86,22,14,88,63,0.5
0.30,7400,100,182,0.84,20,16,90,64,1.2
0.40,7100,88,150,0.87,19,12,90,64,0
`;

export const J1939_SAMPLE_CSV = `Timestamp,SPN190 Engine Speed (rpm),SPN110 Coolant Temp (C),SPN102 Boost Pressure (kPa),SPN1761 DEF Level (%),SPN3251 DPF Status,SPN247 Engine Hours
2026-09-13T09:00:00Z,700,82,15,64,normal,4210.5
2026-09-13T09:00:10Z,1400,85,120,64,normal,4210.5
2026-09-13T09:00:20Z,1900,88,165,63,regenerating,4210.6
2026-09-13T09:00:30Z,1600,91,140,63,regenerating,4210.6
2026-09-13T09:00:40Z,850,89,20,63,normal,4210.7
`;

export const FIXTURE_CONTENT_BY_CONNECTOR: Record<string, string> = {
  generic_obdii_csv: OBD2_SAMPLE_CSV,
  generic_telemetry_csv: TELEMETRY_SAMPLE_CSV,
  generic_j1939_log: J1939_SAMPLE_CSV,
};
