import {
  strict as assert,
} from "node:assert";

import test from "node:test";

import {
  runRules,
} from "../rule-runner.js";

import type {
  Rule,
} from "../../types/rule.js";

const rule: Rule = {
  id: "test/example",
  name: "Example Rule",
  description: "Example rule for testing.",
  category: "correctness",

  analyze() {
    return [
      {
        ruleId: "test/example",
        severity: "warning",
        category: "correctness",
        message: "Example diagnostic.",
        filePath: "App.tsx",
      },
    ];
  },
};

function createContext(
  rules?: Record<
    string,
    "off" | "info" | "warning" | "error"
  >,
) {
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
