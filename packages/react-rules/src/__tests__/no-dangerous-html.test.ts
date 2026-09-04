import test from "node:test";
import assert from "node:assert/strict";

import {
  noDangerousHtmlRule,
} from "../components/no-dangerous-html.js";

import {
  analyzeRule,
} from "./test-utils.js";

test(
  "reports self-closing dangerous HTML attribute",
  () => {
    const diagnostics = analyzeRule(
      noDangerousHtmlRule,
      `<div dangerouslySetInnerHTML />`,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "reports multiline dangerous HTML attribute",
  () => {
    const diagnostics = analyzeRule(
      noDangerousHtmlRule,
      `
        <div
          className="content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "ignores case-sensitive near matches",
  () => {
    const diagnostics = analyzeRule(
      noDangerousHtmlRule,
      `<div dangerouslysetinnerhtml={html} />`,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "intentionally ignores React.createElement properties",
  () => {
    const diagnostics = analyzeRule(
      noDangerousHtmlRule,
      `React.createElement("div", { dangerouslySetInnerHTML: html });`,
    );

    assert.equal(diagnostics.length, 0);
  },
);
