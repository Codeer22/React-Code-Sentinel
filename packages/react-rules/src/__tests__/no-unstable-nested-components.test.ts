import test from "node:test";
import assert from "node:assert/strict";

import {
  noUnstableNestedComponentsRule,
} from "../components/no-unstable-nested-components.js";

import {
  createSemanticContext,
} from "./helpers/create-semantic-context.js";

test(
  "reports nested React component declaration",
  () => {
    const context =
      createSemanticContext(`
        function Parent() {
          function Child() {
            return <div />;
          }

          return <Child />;
        }
      `);

    const diagnostics =
      noUnstableNestedComponentsRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      1,
    );

    assert.equal(
      diagnostics[0]?.ruleId,
      "react/no-unstable-nested-components",
    );
  },
);

test(
  "allows module-level React component",
  () => {
    const context =
      createSemanticContext(`
        function Child() {
          return <div />;
        }

        function Parent() {
          return <Child />;
        }
      `);

    const diagnostics =
      noUnstableNestedComponentsRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      0,
    );
  },
);

test(
  "ignores nested lowercase helper functions",
  () => {
    const context =
      createSemanticContext(`
        function Parent() {
          function renderChild() {
            return <div />;
          }

          return renderChild();
        }
      `);

    const diagnostics =
      noUnstableNestedComponentsRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      0,
    );
  },
);

test(
  "reports nested arrow component",
  () => {
    const context =
      createSemanticContext(`
        function Parent() {
          const Child = () => {
            return <div />;
          };

          return <Child />;
        }
      `);

    const diagnostics =
      noUnstableNestedComponentsRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      1,
    );
  },
);

test(
  "allows nested non-component function",
  () => {
    const context =
      createSemanticContext(`
        function Parent() {
          function calculateValue() {
            return 42;
          }

          return <div>{calculateValue()}</div>;
        }
      `);

    const diagnostics =
      noUnstableNestedComponentsRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      0,
    );
  },
);

test(
  "reports nested memo component",
  () => {
    const context =
      createSemanticContext(`
        function Parent() {
          const Child = memo(() => <div />);

          return <Child />;
        }
      `);

    const diagnostics =
      noUnstableNestedComponentsRule.analyze(
        context,
      );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "reports nested component used through an object property",
  () => {
    const context =
      createSemanticContext(`
        function Parent() {
          const components = {
            Child: () => <div />,
          };

          return <components.Child />;
        }
      `);

    const diagnostics =
      noUnstableNestedComponentsRule.analyze(
        context,
      );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "reports nested function-expression component",
  () => {
    const context =
      createSemanticContext(`
        function Parent() {
          const Child = function () {
            return <div />;
          };

          return <Child />;
        }
      `);

    const diagnostics =
      noUnstableNestedComponentsRule.analyze(
        context,
      );

    assert.equal(diagnostics.length, 1);
  },
);
