<!-- Amber OS proof-of-life v8 (final): 2026-09-01T20:09:36Z -->

# Amber OS — Proof of Life (v8, final)

**Canonical path:** `docs/AMBER_PROOF.md` — this is the only `AMBER_PROOF.md`
in the repository. Do not add a second copy at the repository root or anywhere
else; update this file in place instead.

| Field | Value |
| --- | --- |
| Version | v8 (final) |
| Generated (UTC) | 2026-09-01T20:09:36Z |
| Commit at generation | `0104b10` |
| Supersedes | v7 marker dated 2026-08-27T04:01:17Z |

## What this file is

A proof-of-life marker for the Amber OS pipeline. It records that an agent ran
end to end against this repository, that the project test suite was executed,
and what the result was. It carries no application logic and no code imports
it — it is documentation only.

Sibling markers, same purpose, different pipeline stages:

- `docs/AUTODEPLOY_PROOF.md` — autodeploy stage
- `docs/PIPELINE_PROOF.md` — full pipeline stage

## Verification

Command:

```
npm test -- --test-timeout=60000
```

Result: **90 passed, 0 failed, 0 skipped** (`# tests 90 / # pass 90 / # fail 0`,
duration ~522 ms). The suite covers `src/lib/__tests__/*.test.ts` and
`src/lib/storybook/__tests__/*.test.ts`.

## Screenshots

Not captured. This revision changes one Markdown document and renders no UI,
and the execution environment has no Chrome or Chromium binary, so
`npm run test:responsive` (which requires `CHROME_PATH` or a Chrome install)
cannot run here. Capture desktop + mobile defaults on a machine with Chrome
installed if visual evidence is required for this change.

## Formatting contract

Kept stable so successive versions produce clean, reviewable diffs:

- Line 1 is the machine-readable HTML comment marker,
  `<!-- Amber OS proof-of-life v<N> (final): <ISO-8601 UTC> -->`.
- The timestamp is ISO-8601 UTC with a `Z` suffix and second precision.
- The file is UTF-8, LF line endings, and ends with exactly one newline.
- No trailing whitespace.
