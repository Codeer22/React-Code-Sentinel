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

test(
  "accepts unknown component props",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: unknown,
        ) {
          return null;
        }
      `);

    const diagnostics =
      noImplicitAnyPropsRule.analyze(
        context,
      );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "accepts unconstrained generic component props",
  () => {
    const context =
      createSemanticContext(`
        function UserCard<T>(
          props: T,
        ) {
          return null;
        }
      `);

    const diagnostics =
      noImplicitAnyPropsRule.analyze(
        context,
      );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "accepts intersection component props",
  () => {
    const context =
      createSemanticContext(`
        type CardProps = { name: string } & { id: number };

        function UserCard(
          props: CardProps,
        ) {
          return props.name;
        }
      `);

    const diagnostics =
      noImplicitAnyPropsRule.analyze(
        context,
      );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "accepts typed destructuring with a default",
  () => {
    const context =
      createSemanticContext(`
        interface CardProps {
          title?: string;
        }

        function UserCard(
          { title = "Untitled" }: CardProps,
        ) {
          return title;
        }
      `);

    const diagnostics =
      noImplicitAnyPropsRule.analyze(
        context,
      );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "reports function-expression component props resolving to any",
  () => {
    const context =
      createSemanticContext(`
        const UserCard = function (props) {
          return props.name;
        };
      `);

    const diagnostics =
      noImplicitAnyPropsRule.analyze(
        context,
      );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "accepts union component props",
  () => {
    const context =
      createSemanticContext(`
        type CardProps =
          { name: string } | { title: string };

        function UserCard(
          props: CardProps,
        ) {
          return props;
        }
      `);

    const diagnostics =
      noImplicitAnyPropsRule.analyze(
        context,
      );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "accepts constrained generic component props",
  () => {
    const context =
      createSemanticContext(`
        function UserCard<T extends { name: string }>(
          props: T,
        ) {
          return props.name;
        }
      `);

    const diagnostics =
      noImplicitAnyPropsRule.analyze(
        context,
      );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "reports memo callback props resolving to any",
  () => {
    const context =
      createSemanticContext(`
        const UserCard = memo((props: any) => {
          return props.name;
        });
      `);

    const diagnostics =
      noImplicitAnyPropsRule.analyze(
        context,
      );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "reports forwardRef callback props resolving to any",
  () => {
    const context =
      createSemanticContext(`
        const UserCard = forwardRef((props: any, ref: any) => {
          return props.name;
        });
      `);

    const diagnostics =
      noImplicitAnyPropsRule.analyze(
        context,
      );

    assert.equal(diagnostics.length, 1);
  },
);

for (const typeAnnotation of [
  "{}",
  "object",
  "never",
  "any[]",
  "{ name?: string } | undefined",
]) {
  test(
    `accepts component props typed as ${typeAnnotation}`,
    () => {
      const context =
        createSemanticContext(`
          function UserCard(
            props: ${typeAnnotation},
          ) {
            return null;
          }
        `);

      const diagnostics =
        noImplicitAnyPropsRule.analyze(
          context,
        );

      assert.equal(diagnostics.length, 0);
    },
  );
}