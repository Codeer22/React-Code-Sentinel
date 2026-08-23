import test from "node:test";
import assert from "node:assert/strict";

import {
  noImplicitAnyPropsRule,
} from "../components/no-implicit-any-props.js";

import {
  createSemanticContext,
} from "./helpers/create-semantic-context.js";

test(
  "reports component props resolving to any",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(props) {
          return props.name;
        }
      `);

    const diagnostics =
      noImplicitAnyPropsRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      1,
    );

    assert.equal(
      diagnostics[0]?.ruleId,
      "react/no-implicit-any-props",
    );

    assert.match(
      diagnostics[0]?.message ?? "",
      /UserCard/,
    );
  },
);

test(
  "accepts explicitly typed component props",
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
      noImplicitAnyPropsRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      0,
    );
  },
);

test(
  "reports explicitly any-typed component props",
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
      noImplicitAnyPropsRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      1,
    );
  },
);

test(
  "ignores lowercase helper functions",
  () => {
    const context =
      createSemanticContext(`
        function getUser(props) {
          return props.name;
        }
      `);

    const diagnostics =
      noImplicitAnyPropsRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      0,
    );
  },
);

test(
  "reports arrow-function components with any props",
  () => {
    const context =
      createSemanticContext(`
        const UserCard = (props) => {
          return props.name;
        };
      `);

    const diagnostics =
      noImplicitAnyPropsRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      1,
    );
  },
);