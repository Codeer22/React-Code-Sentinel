import test from "node:test";

import assert from "node:assert/strict";

import {
  runRules,
} from "../rule-runner.js";

import type {
  AnalysisContext,
} from "../../analysis/context.js";

import type {
  Rule,
} from "../rule-types.js";

function createContext(
  rules?: Record<
    string,
    "off" | "warning" | "error" | "info"
  >,
): AnalysisContext {
  return {
    document: {
      filePath: "App.tsx",
      sourceText: "",
    },

    project: {
      rootDirectory: ".",
      files: ["App.tsx"],
    },

    config:
      rules === undefined
        ? {}
        : {
            rules,
          },

    diagnostics: [],
  };
}

const rule: Rule = {
  meta: {
    id: "test/example",
    name: "Example rule",
    description: "Example rule for testing.",
    category: "react",
    kind: "semantic",
    defaultSeverity: "warning",
  },

  analyze() {
    return [
      {
        ruleId: "test/example",
        severity: "warning",
        category: "react",
        message: "Example diagnostic",
        filePath: "App.tsx",
        location: {
          start: {
            line: 1,
            column: 1,
          },
          end: {
            line: 1,
            column: 2,
          },
        },
      },
    ];
  },
};

test(
  "runs rule with default severity",
  () => {
    const result = runRules(
      [rule],
      createContext(),
    );

    assert.equal(
      result.diagnostics.length,
      1,
    );

    assert.equal(
      result.diagnostics[0]?.severity,
      "warning",
    );
  },
);

test(
  "overrides rule severity",
  () => {
    const result = runRules(
      [rule],
      createContext({
        "test/example": "error",
      }),
    );

    assert.equal(
      result.diagnostics.length,
      1,
    );

    assert.equal(
      result.diagnostics[0]?.severity,
      "error",
    );
  },
);

test(
  "disables rule with off",
  () => {
    const result = runRules(
      [rule],
      createContext({
        "test/example": "off",
      }),
    );

    assert.equal(
      result.diagnostics.length,
      0,
    );
  },
);

test(
  "overrides rule severity to info",
  () => {
    const result = runRules(
      [rule],
      createContext({
        "test/example": "info",
      }),
    );

    assert.equal(
      result.diagnostics.length,
      1,
    );

    assert.equal(
      result.diagnostics[0]?.severity,
      "info",
    );
  },
);
