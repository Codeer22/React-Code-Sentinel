import test from "node:test";
import assert from "node:assert/strict";

import {
  createSemanticContext,
} from "./helpers/create-semantic-context.js";

import {
  noUnsafePropAccessRule,
} from "../components/no-unsafe-prop-access.js";

test(
  "reports unsafe prop access",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          return props.name;
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      1,
    );

    assert.equal(
      diagnostics[0]?.ruleId,
      "react/no-unsafe-prop-access",
    );
  },
);

test(
  "accepts safely typed props",
  () => {
    const context =
      createSemanticContext(`
        interface UserCardProps {
          name: string;
        }

        function UserCard(
          props: UserCardProps,
        ) {
          return props.name;
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      0,
    );
  },
);

test(
  "ignores lowercase helper functions",
  () => {
    const context =
      createSemanticContext(`
        function getUser(
          props: any,
        ) {
          return props.name;
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      0,
    );
  },
);

test(
  "ignores shadowed props parameters",
  () => {
    const context =
      createSemanticContext(`
        interface CardProps {
          title: string;
        }

        interface OtherProps {
          value: any;
        }

        function Card(
          props: CardProps,
        ) {
          function render(
            props: OtherProps,
          ) {
            return props.value;
          }

          return props.title;
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      0,
    );
  },
);

test(
  "reports captured outer props in nested functions",
  () => {
    const context =
      createSemanticContext(`
        function Card(
          props: any,
        ) {
          function render() {
            return props.title;
          }

          return render();
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      1,
    );

    assert.equal(
      diagnostics[0]?.ruleId,
      "react/no-unsafe-prop-access",
    );
  },
);
