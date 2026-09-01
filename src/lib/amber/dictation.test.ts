import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { micPermissionError, micUnsupportedMessage } from "./dictation.ts";

describe("mic errors", () => {
  it("explains permission denial instead of failing silently", () => {
    assert.match(micPermissionError("NotAllowedError"), /allow the microphone/i);
    assert.match(micPermissionError("NotFoundError"), /No microphone/i);
    assert.match(micPermissionError("NotReadableError"), /busy/i);
    assert.match(micPermissionError("Other"), /Couldn't open/i);
  });

  it("explains unsupported contexts", () => {
    assert.match(micUnsupportedMessage(), /https or localhost/i);
  });
});
