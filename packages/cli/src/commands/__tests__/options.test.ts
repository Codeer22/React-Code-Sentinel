import test from "node:test";
import assert from "node:assert/strict";

import {
  parseCliOptions,
} from "../options.js";

test(
  "defaults to current directory",
  () => {
    const result = parseCliOptions([]);

    assert.equal(
      result.directory,
      ".",
    );

    assert.deepEqual(
      result.ruleIds,
      [],
    );

    assert.deepEqual(
      result.categories,
      [],
    );
  },
);

test(
  "parses directory",
  () => {
    const result = parseCliOptions([
      "src",
    ]);

    assert.equal(
      result.directory,
      "src",
    );
  },
);

test(
  "parses rule filter",
  () => {
    const result = parseCliOptions([
      "--rule",
      "react/no-unstable-nested-components",
    ]);

    assert.deepEqual(
      result.ruleIds,
      [
        "react/no-unstable-nested-components",
      ],
    );
  },
);

test(
  "parses category filter",
  () => {
    const result = parseCliOptions([
      "--category",
      "react",
    ]);

    assert.deepEqual(
      result.categories,
      ["react"],
    );
  },
);

test(
  "parses repeated filters",
  () => {
    const result = parseCliOptions([
      "--rule",
      "react/no-unstable-nested-components",
      "--category",
      "react",
    ]);

    assert.deepEqual(
      result.ruleIds,
      [
        "react/no-unstable-nested-components",
      ],
    );

    assert.deepEqual(
      result.categories,
      ["react"],
    );
  },
);

test(
  "rejects unknown options",
  () => {
    assert.throws(
      () => parseCliOptions([
        "--unknown",
      ]),
      /Unknown option: --unknown/,
    );
  },
);

test(
  "rejects missing rule ID",
  () => {
    assert.throws(
      () => parseCliOptions([
        "--rule",
      ]),
      /--rule requires a rule ID/,
    );
  },
);

test(
  "rejects missing category",
  () => {
    assert.throws(
      () => parseCliOptions([
        "--category",
      ]),
      /--category requires a category/,
    );
  },
);

test(
  "rejects unknown category",
  () => {
    assert.throws(
      () => parseCliOptions([
        "--category",
        "nonsense",
      ]),
      /Unknown diagnostic category: nonsense/,
    );
  },
);
