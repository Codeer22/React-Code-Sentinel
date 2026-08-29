import test from "node:test";
import assert from "node:assert/strict";

import type {
  Diagnostic,
} from "@react-code-sentinel/core";

import {
  shouldFail,
} from "../exit-code.js";

function diagnostic(
  severity: Diagnostic["severity"],
): Diagnostic {
  return {
    ruleId: "test/rule",
    severity,
    category: "react",
    message: "test",
    filePath: "App.tsx",
  };
}

test(
  "fails when diagnostics exist and failOn is undefined",
  () => {
    assert.equal(
      shouldFail(
        [diagnostic("warning")],
        undefined,
      ),
      true,
    );
  },
);

test(
  "does not fail on warnings when failOn is error",
  () => {
    assert.equal(
      shouldFail(
        [diagnostic("warning")],
        "error",
      ),
      false,
    );
  },
);

test(
  "fails on warnings when failOn is warning",
  () => {
    assert.equal(
      shouldFail(
        [diagnostic("warning")],
        "warning",
      ),
      true,
    );
  },
);

test(
  "fails on errors when failOn is error",
  () => {
    assert.equal(
      shouldFail(
        [diagnostic("error")],
        "error",
      ),
      true,
    );
  },
);

test(
  "does not fail when there are no diagnostics",
  () => {
    assert.equal(
      shouldFail([], "error"),
      false,
    );
  },
);
