import test from "node:test";
import assert from "node:assert/strict";

import {
  createSemanticContext,
} from "./helpers/create-semantic-context.js";

import {
  noUnsafePropAccessRule,
} from "../components/no-unsafe-prop-access.js";

/*
 * ============================================================================
 * BASIC PROP ACCESS
 * ============================================================================
 */

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

/*
 * ============================================================================
 * DESTRUCTURED PROPS
 * ============================================================================
 */

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
  "reports unsafe destructured property alias from props",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          const {
            name: displayName,
          } = props;

          return <div>{displayName}</div>;
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
  },
);

test(
  "reports unsafe destructured prop with a default value",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          const {
            name = "Unknown",
          } = props;

          return <div>{name}</div>;
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
  },
);

test(
  "reports unsafe destructured aliased prop with a default",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          const {
            name: displayName = "Unknown",
          } = props;

          return <div>{displayName}</div>;
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
  },
);

test(
  "reports multiple unsafe destructured props",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          const {
            name,
            email,
          } = props;

          return (
            <div>
              {name}
              {email}
            </div>
          );
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      2,
    );
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

    assert.equal(
      diagnostics.length,
      1,
    );
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

    assert.equal(
      diagnostics.length,
      1,
    );
  },
);

test(
  "reports unsafe access through a rest destructured props binding",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          const {
            name,
            ...rest
          } = props;

          return <div>{rest.email}</div>;
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      2,
    );
  },
);

test(
  "reports unsafe access through only a rest destructured props binding",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          const {
            ...rest
          } = props;

          return <div>{rest.email}</div>;
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      2,
    );
  },
);

test(
  "reports unsafe access from named and rest destructured props",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          const {
            name,
            ...rest
          } = props;

          return (
            <div>
              {name}
              {rest.email}
            </div>
          );
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      3,
    );
  },
);

/*
 * ============================================================================
 * PROPS ALIASES
 * ============================================================================
 */

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

    assert.equal(
      diagnostics.length,
      1,
    );
  },
);

test(
  "reports unsafe props access through a chained alias",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          const firstAlias = props;
          const secondAlias = firstAlias;

          return secondAlias.name;
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
  },
);

test(
  "reports unsafe destructured prop from an aliased props binding",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          const p = props;
          const { name } = p;

          return <div>{name}</div>;
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
  },
);

test(
  "reports unsafe access through a chained destructured prop alias",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          const {
            name: displayName,
          } = props;

          const label = displayName;

          return <div>{label}</div>;
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
  },
);

test(
  "reports unsafe access through multiple props aliases",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          const first = props;
          const second = props;

          return (
            <div>
              {first.name}
              {second.email}
            </div>
          );
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      2,
    );
  },
);

test(
  "tracks reassignment independently across props aliases",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          let first = props;
          const second = props;

          first = {
            name: "Local",
          };

          return (
            <div>
              {first.name}
              {second.email}
            </div>
          );
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
  },
);

/*
 * ============================================================================
 * ALIAS REASSIGNMENT
 * ============================================================================
 */

test(
  "reports unsafe props alias after reassignment and re-establishment",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          let currentProps = props;

          currentProps.name;

          currentProps = {
            name: "Local",
          };

          currentProps.name;

          currentProps = props;

          return currentProps.name;
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      2,
    );
  },
);

test(
  "ignores unsafe props alias after alias is broken",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          let currentProps = props;

          currentProps = {
            name: "Local",
          };

          return currentProps.name;
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
  "tracks unsafe props alias across multiple reassignments",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          let currentProps = props;

          currentProps.name;

          currentProps = {
            name: "Local",
          };

          currentProps.name;

          currentProps = props;

          currentProps.name;

          currentProps = {
            name: "Local Again",
          };

          currentProps.name;

          currentProps = props;

          currentProps.name;
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      3,
    );
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
          currentProps = {
            name: "Local",
          };

          return currentProps.name;
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
  "ignores direct props access after props parameter reassignment",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          props = {
            name: "Local",
          };

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
  "ignores destructured access after props alias is reassigned",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          let p = props;

          p = {
            name: "Local",
          };

          const { name } = p;

          return <div>{name}</div>;
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
  "reports destructured access after props alias is restored",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          let p = props;

          p = {
            name: "Local",
          };

          p = props;

          const { name } = p;

          return <div>{name}</div>;
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
  },
);

test(
  "ignores chained alias after intermediate alias is reassigned",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          let p = props;
          let q = p;

          p = {
            name: "Local",
          };

          return <div>{q.name}</div>;
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
  },
);

test(
  "reports chained alias after intermediate alias is restored",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          let p = props;
          let q = p;

          p = {
            name: "Local",
          };

          p = props;

          return <div>{q.name}</div>;
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
  },
);

test(
  "ignores destructured props alias after reassignment",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          let { profile } = props;

          profile = {
            name: "Local",
          };

          return profile.name;
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
  "ignores destructured props alias after compound reassignment",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          let { name } = props;

          name += " Local";

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

/*
 * ============================================================================
 * CONDITIONAL AND CONTROL-FLOW REASSIGNMENT
 * ============================================================================
 */

test(
  "reports unsafe props alias when conditional reassignment may not occur",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
          condition: boolean,
        ) {
          let currentProps = props;

          if (condition) {
            currentProps = {
              name: "Local",
            };
          }

          return currentProps.name;
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
  },
);

test(
  "ignores props alias when all control-flow paths reassign it",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
          condition: boolean,
        ) {
          let currentProps = props;

          if (condition) {
            currentProps = {
              name: "Local",
            };
          } else {
            currentProps = {
              name: "Local Else",
            };
          }

          return currentProps.name;
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
  "reports props access when reassignment may not occur",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
          condition: boolean,
        ) {
          if (condition) {
            props = {
              name: "Local",
            };
          }

          return <div>{props.name}</div>;
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
  },
);

test(
  "ignores props access when every branch reassigns props",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
          condition: boolean,
        ) {
          if (condition) {
            props = {
              name: "A",
            };
          } else {
            props = {
              name: "B",
            };
          }

          return <div>{props.name}</div>;
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
  "reports destructured prop when alias reassignment is conditional",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
          condition: boolean,
        ) {
          let p = props;

          if (condition) {
            p = {
              name: "Local",
            };
          }

          const { name } = p;

          return <div>{name}</div>;
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
  },
);

test(
  "ignores destructured prop when every branch breaks the alias",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
          condition: boolean,
        ) {
          let p = props;

          if (condition) {
            p = {
              name: "A",
            };
          } else {
            p = {
              name: "B",
            };
          }

          const { name } = p;

          return <div>{name}</div>;
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

/*
 * ============================================================================
 * LOOP REASSIGNMENT
 * ============================================================================
 */

test(
  "reports unsafe props alias when loop reassignment may not occur",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
          condition: boolean,
        ) {
          let currentProps = props;

          while (condition) {
            currentProps = {
              name: "Local",
            };
          }

          return currentProps.name;
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
  },
);

test(
  "reports unsafe props alias after loop reassignment and re-establishment",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
          condition: boolean,
        ) {
          let currentProps = props;

          while (condition) {
            currentProps = {
              name: "Local",
            };
          }

          currentProps = props;

          return currentProps.name;
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
  },
);

test(
  "ignores props alias reassigned before access in do while",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
          condition: boolean,
        ) {
          let currentProps = props;

          do {
            currentProps = {
              name: "Local",
            };

            currentProps.name;
          } while (condition);
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
  "reports unsafe props access before reassignment in do while",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
          condition: boolean,
        ) {
          let currentProps = props;

          do {
            currentProps.name;

            currentProps = {
              name: "Local",
            };
          } while (condition);
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
  },
);

test(
  "reports unsafe props alias when for loop reassignment may not occur",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
          condition: boolean,
        ) {
          let currentProps = props;

          for (; condition;) {
            currentProps = {
              name: "Local",
            };
          }

          return currentProps.name;
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
  },
);

test(
  "reports unsafe props alias when for of reassignment may not occur",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
          items: string[],
        ) {
          let currentProps = props;

          for (const item of items) {
            currentProps = {
              name: item,
            };
          }

          return currentProps.name;
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
  },
);

test(
  "reports unsafe props alias when for in reassignment may not occur",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
          items: Record<string, string>,
        ) {
          let currentProps = props;

          for (const key in items) {
            currentProps = {
              name: items[key],
            };
          }

          return currentProps.name;
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
  },
);

test(
  "reports unsafe props alias after for of reassignment and re-establishment",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
          items: string[],
        ) {
          let currentProps = props;

          for (const item of items) {
            currentProps = {
              name: item,
            };
          }

          currentProps = props;

          return currentProps.name;
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
  },
);

test(
  "reports alias access when for-loop reassignment may not occur",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
          enabled: boolean,
        ) {
          let p = props;

          for (
            let i = 0;
            enabled && i < 1;
            i++
          ) {
            p = {
              name: "Local",
            };
          }

          return <div>{p.name}</div>;
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
  },
);

test(
  "ignores alias access after do-while reassignment",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          let p = props;

          do {
            p = {
              name: "Local",
            };
          } while (false);

          return <div>{p.name}</div>;
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

/*
 * ============================================================================
 * ASSIGNMENT OPERATORS
 * ============================================================================
 */

test(
  "reports unsafe destructured props alias after nullish assignment",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          let { name } = props;

          name ??= "Fallback";

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
  },
);

test(
  "reports unsafe destructured props alias after logical or assignment",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          let { name } = props;

          name ||= "Fallback";

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
  },
);

test(
  "reports unsafe destructured props alias after logical and assignment",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          let { name } = props;

          name &&= "Fallback";

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
  },
);

test(
  "ignores alias access after assignment expression",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          let p = props;

          (p = {
            name: "Local",
          });

          return <div>{p.name}</div>;
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
  "reports alias access after assignment expression restores props",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          let p = props;

          p = {
            name: "Local",
          };

          p = props;

          return <div>{p.name}</div>;
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
  },
);

/*
 * ============================================================================
 * PROPERTY MUTATION
 * ============================================================================
 */

test(
  "still reports props access after mutating a props property",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          props.name = "Local";

          return <div>{props.name}</div>;
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      2,
    );
  },
);

test(
  "still reports computed props access after property mutation",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
          key: string,
        ) {
          props[key] = "Local";

          return <div>{props[key]}</div>;
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      2,
    );
  },
);

/*
 * ============================================================================
 * NESTED DESTRUCTURING
 * ============================================================================
 */

test(
  "reports unsafe nested destructured prop alias",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          const {
            user: {
              name,
            },
          } = props;

          return <div>{name}</div>;
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
  },
);

test(
  "reports unsafe nested renamed destructured prop",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          const {
            user: {
              name: displayName,
            },
          } = props;

          return <div>{displayName}</div>;
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
  },
);

/*
 * ============================================================================
 * CLOSURES AND SCOPE
 * ============================================================================
 */

test(
  "reports captured props alias in nested block",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          const currentProps = props;

          {
            currentProps.name;
          }
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
  },
);

test(
  "reports captured props alias in nested function",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          const currentProps = props;

          function renderName() {
            return currentProps.name;
          }

          return renderName();
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
  },
);

test(
  "ignores reassigned local props alias in nested function",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          const currentProps = props;

          function renderName() {
            let localProps = currentProps;

            localProps = {
              name: "Local",
            };

            return localProps.name;
          }

          return renderName();
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
  "reports captured props alias after nested reassignment and re-establishment",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          let currentProps = props;

          function renderName() {
            currentProps = {
              name: "Local",
            };

            currentProps = props;

            return currentProps.name;
          }

          return renderName();
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
  },
);

test(
  "ignores captured props alias after nested reassignment",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          let currentProps = props;

          function renderName() {
            currentProps = {
              name: "Local",
            };

            return currentProps.name;
          }

          return renderName();
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
  "reports outer alias access when nested function reassigns its local alias",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          let p = props;

          function update() {
            p = {
              name: "Local",
            };
          }

          return <div>{p.name}</div>;
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
  },
);

test(
  "ignores nested alias access after outer alias reassignment",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          let p = props;

          p = {
            name: "Local",
          };

          function render() {
            return <div>{p.name}</div>;
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
      0,
    );
  },
);

test(
  "ignores nested alias reassignment when it is deeper than the outer function",
  () => {
    const context =
      createSemanticContext(`
        function Component(
          props: any,
        ) {
          let p = props;

          function outer() {
            function inner() {
              p = {};
            }

            return inner;
          }

          return p.name;
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
  },
);

test(
  "reports nested alias access after deeper nested function reassignment",
  () => {
    const context =
      createSemanticContext(`
        function Component(
          props: any,
        ) {
          let p = props;

          function outer() {
            function inner() {
              p = {};
              return p.name;
            }

            return inner;
          }

          return outer;
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
  "reports outer destructured alias despite deeper nested reassignment",
  () => {
    const context =
      createSemanticContext(`
        function Component(
          props: any,
        ) {
          let { user } = props;

          function outer() {
            function inner() {
              user = {};
            }

            return inner;
          }

          return user.name;
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      2,
    );
  },
);

test(
  "ignores shadowed alias unrelated to props",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          const p = props;

          {
            const p = {
              name: "Local",
            };

            return <div>{p.name}</div>;
          }
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

/*
 * ============================================================================
 * COMPUTED AND OPTIONAL ACCESS
 * ============================================================================
 */

test(
  "reports unsafe dynamic computed props access",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
          key: string,
        ) {
          return <div>{props[key]}</div>;
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
  },
);

test(
  "reports unsafe optional computed props access",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
          key: string,
        ) {
          return <div>{props?.[key]}</div>;
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

    assert.equal(
      diagnostics.length,
      1,
    );
  },
);

/*
 * ============================================================================
 * TYPESCRIPT TYPE CASES
 * ============================================================================
 */

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

    assert.equal(
      diagnostics.length,
      0,
    );
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

    assert.equal(
      diagnostics.length,
      1,
    );
  },
);

test(
  "handles generic props without crashing",
  () => {
    const context =
      createSemanticContext(`
        function UserCard<T extends object>(
          props: T,
        ) {
          return <div>{props.name}</div>;
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
  },
);

/*
 * ============================================================================
 * JSX ACCESS
 * ============================================================================
 */

test(
  "reports unsafe props access inside JSX attribute",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          return <div title={props.name} />;
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
  },
);