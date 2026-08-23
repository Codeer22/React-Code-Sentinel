import test from "node:test";
import assert from "node:assert/strict";

import {
  getReactRules,
  getRecommendedReactRules,
  reactRules,
  recommendedReactRules,
} from "../registry.js";

test(
  "registry contains all React rules",
  () => {
    const ruleIds = reactRules.map(
      (rule) => rule.meta.id,
    );

    assert.deepEqual(
      ruleIds,
      [
        "react/no-unstable-nested-components",
        "react/no-missing-key",
        "react/no-array-index-key",
        "react/no-useless-fragment",
        "react/no-direct-mutation-state",
        "react/no-direct-mutation-props",
        "react/no-dangerous-html",
        "react/no-implicit-any-props",
      ],
    );
  },
);

test(
  "registry rule IDs are unique",
  () => {
    const ruleIds = reactRules.map(
      (rule) => rule.meta.id,
    );

    assert.equal(
      new Set(ruleIds).size,
      ruleIds.length,
    );
  },
);

test(
  "all registered rules have valid metadata",
  () => {
    for (const rule of reactRules) {
      assert.equal(
        typeof rule.meta.id,
        "string",
      );

      assert.ok(
        rule.meta.id.startsWith("react/"),
      );

      assert.equal(
        typeof rule.meta.name,
        "string",
      );

      assert.equal(
        typeof rule.meta.description,
        "string",
      );

      assert.equal(
        rule.meta.category,
        "react",
      );

      assert.ok(
        rule.meta.kind === "ast" ||
        rule.meta.kind === "semantic" ||
        rule.meta.kind === "project",
      );

      assert.equal(
        typeof rule.meta.defaultSeverity,
        "string",
      );

      assert.equal(
        typeof rule.meta.recommended,
        "boolean",
      );

      assert.equal(
        typeof rule.meta.fixable,
        "boolean",
      );
    }
  },
);

test(
  "recommended registry contains only recommended rules",
  () => {
    assert.deepEqual(
      recommendedReactRules.map(
        (rule) => rule.meta.id,
      ),
      reactRules
        .filter(
          (rule) =>
            rule.meta.recommended === true,
        )
        .map(
          (rule) => rule.meta.id,
        ),
    );
  },
);

test(
  "all current React rules are recommended",
  () => {
    assert.equal(
      recommendedReactRules.length,
      reactRules.length,
    );
  },
);

test(
  "getReactRules returns the registered rules",
  () => {
    assert.strictEqual(
      getReactRules(),
      reactRules,
    );
  },
);

test(
  "getRecommendedReactRules returns recommended rules",
  () => {
    assert.strictEqual(
      getRecommendedReactRules(),
      recommendedReactRules,
    );
  },
);
