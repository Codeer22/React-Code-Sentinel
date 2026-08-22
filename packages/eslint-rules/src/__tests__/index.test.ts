import {
  strict as assert,
} from "node:assert";

import test from "node:test";

import {
  diagnosticToLintMessage,
} from "../index.js";

test(
  "converts an error diagnostic",
  () => {
    const result =
      diagnosticToLintMessage({
        ruleId:
          "react/no-unstable-nested-components",
        severity: "error",
        category: "react",
        message:
          "Move the component to module scope.",
        filePath: "src/App.tsx",
        location: {
          start: {
            line: 12,
            column: 3,
          },
          end: {
            line: 12,
            column: 9,
          },
        },
      });

    assert.deepEqual(
      result,
      {
        ruleId:
          "react/no-unstable-nested-components",
        severity: 2,
        message:
          "Move the component to module scope.",
        filePath: "src/App.tsx",
        line: 12,
        column: 3,
      },
    );
  },
);

test(
  "converts a warning diagnostic",
  () => {
    const result =
      diagnosticToLintMessage({
        ruleId: "react/example",
        severity: "warning",
        category: "react",
        message: "Example warning.",
        filePath: "App.tsx",
      });

    assert.equal(
      result.severity,
      1,
    );

    assert.equal(
      result.line,
      1,
    );

    assert.equal(
      result.column,
      1,
    );
  },
);

