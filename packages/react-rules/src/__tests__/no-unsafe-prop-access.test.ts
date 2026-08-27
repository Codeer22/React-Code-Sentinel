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

test(
  "reports unsafe destructured props",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          { name }: any,
        ) {
          return name;
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
  "accepts safely typed destructured props",
  () => {
    const context =
      createSemanticContext(`
        interface UserCardProps {
          name: string;
        }

        function UserCard(
          { name }: UserCardProps,
        ) {
          return name;
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
  "reports props accessed through an assignment alias",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          let currentProps;
          currentProps = props;

          return currentProps.name;
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "ignores props alias reassigned to a local object",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          let currentProps;
          currentProps = props;
          currentProps = { name: "Local" };

          return currentProps.name;
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "reports optional chained access on any props",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          return props.user?.name;
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "accepts computed access with a typed index signature",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: Record<string, string>,
        ) {
          return props["name"];
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "reports property access on unknown props",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: unknown,
        ) {
          return props.name;
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "reports nested destructured prop access",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          { user: { name } }: any,
        ) {
          return name;
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "reports access through a rest props binding",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          { ...rest }: any,
        ) {
          return rest.name;
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(diagnostics.length, 1);
  },
);
