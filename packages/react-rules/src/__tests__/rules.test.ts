import test from "node:test";
import assert from "node:assert";
import {
  analyzeRule,
} from "./test-utils.js";

import {
  noDangerousHtmlRule,
} from "../components/no-dangerous-html.js";

import {
  noDirectMutationPropsRule,
} from "../components/no-direct-mutation-props.js";

import {
  noDirectMutationStateRule,
} from "../components/no-direct-mutation-state.js";

import {
  noUselessFragmentRule,
} from "../components/no-useless-fragment.js";

import {
  noMissingKeyRule,
} from "../components/no-missing-key.js";
import {
  noArrayIndexKeyRule,
} from "../components/no-array-index-key.js";

import {
  noUnstableNestedComponentsRule,
} from "../components/no-unstable-nested-components.js";

import {
  noImplicitAnyPropsRule,
} from "../components/no-implicit-any-props.js";

import {
  noUnsafePropAccessRule,
} from "../components/no-unsafe-prop-access.js";

test(
  "no-missing-key reports JSX returned from map without key",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `
        export function Users({ users }) {
          return (
            <div>
              {users.map((user) => (
                <div>{user.name}</div>
              ))}
            </div>
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
    assert.equal(
      diagnostics[0]?.ruleId,
      "react/no-missing-key",
    );
    assert.equal(
      diagnostics[0]?.severity,
      "warning",
    );
    assert.equal(
      diagnostics[0]?.category,
      "react",
    );
  },
);

test(
  "no-missing-key accepts stable key prop",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `
        export function Users({ users }) {
          return (
            <div>
              {users.map((user) => (
                <div key={user.id}>{user.name}</div>
              ))}
            </div>
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-missing-key detects multiple missing keys",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `
        export function Users({ users }) {
          return (
            <div>
              {users.map((user) => (
                <div>{user.name}</div>
              ))}

              {users.map((user) => (
                <span>{user.email}</span>
              ))}
            </div>
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 2);
  },
);

test(
  "no-missing-key supports block callbacks",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `
        export function Users({ users }) {
          return (
            <div>
              {users.map((user) => {
                return <div>{user.name}</div>;
              })}
            </div>
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-missing-key reports correct source location",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `export function Users({ users }) {
  return users.map((user) => (
    <div>{user.name}</div>
  ));
}
`,
    );

    assert.equal(diagnostics.length, 1);

    const diagnostic = diagnostics[0]!;

    if (diagnostic === undefined) {
      throw new Error(
        "Expected no-missing-key diagnostic.",
      );
    }

    if (diagnostic.location === undefined) {
      throw new Error(
        "Expected diagnostic location.",
      );
    }

    assert.equal(
      diagnostic.location.start.line,
      3,
    );

    assert.equal(
      diagnostic!.location!.start.column,
      5,
    );
  },
);

test(
  "no-unstable-nested-components reports nested component",
  () => {
    const diagnostics = analyzeRule(
      noUnstableNestedComponentsRule,
      `
        export function Parent() {
          function Child() {
            return <div>Hello</div>;
          }

          return <Child />;
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
    assert.equal(
      diagnostics[0]?.ruleId,
      "react/no-unstable-nested-components",
    );
  },
);

test(
  "no-unstable-nested-components allows module-level component",
  () => {
    const diagnostics = analyzeRule(
      noUnstableNestedComponentsRule,
      `
        function Child() {
          return <div>Hello</div>;
        }

        export function Parent() {
          return <Child />;
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-array-index-key reports callback index used as key",
  () => {
    const diagnostics = analyzeRule(
      noArrayIndexKeyRule,
      `
        export function Users({ users }) {
          return (
            <div>
              {users.map((user, index) => (
                <div key={index}>{user.name}</div>
              ))}
            </div>
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 1);

    const diagnostic = diagnostics[0]!;

    if (!diagnostic) {
      throw new Error("Expected a diagnostic");
    }
    assert.equal(
      diagnostic!.ruleId,
      "react/no-array-index-key",
    );
    assert.equal(
      diagnostic!.severity,
      "warning",
    );
    assert.equal(
      diagnostic!.category,
      "react",
    );
  },
);

test(
  "no-array-index-key accepts stable item key",
  () => {
    const diagnostics = analyzeRule(
      noArrayIndexKeyRule,
      `
        export function Users({ users }) {
          return (
            <div>
              {users.map((user, index) => (
                <div key={user.id}>{user.name}</div>
              ))}
            </div>
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-array-index-key detects differently named index parameter",
  () => {
    const diagnostics = analyzeRule(
      noArrayIndexKeyRule,
      `
        export function Users({ users }) {
          return (
            <div>
              {users.map((user, i) => (
                <div key={i}>{user.name}</div>
              ))}
            </div>
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-array-index-key ignores unrelated variable named index",
  () => {
    const diagnostics = analyzeRule(
      noArrayIndexKeyRule,
      `
        const index = "stable";

        export function Users({ users }) {
          return (
            <div>
              {users.map((user) => (
                <div key={index}>{user.name}</div>
              ))}
            </div>
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-array-index-key supports block callbacks",
  () => {
    const diagnostics = analyzeRule(
      noArrayIndexKeyRule,
      `
        export function Users({ users }) {
          return (
            <div>
              {users.map((user, index) => {
                return <div key={index}>{user.name}</div>;
              })}
            </div>
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-array-index-key reports key attribute location",
  () => {
    const diagnostics = analyzeRule(
      noArrayIndexKeyRule,
      `export function Users({ users }) {
  return users.map((user, index) => (
    <div key={index}>{user.name}</div>
  ));
}
`,
    );

    assert.equal(diagnostics.length, 1);

    const diagnostic = diagnostics[0]!;

    assert.ok(diagnostic);
    const location = diagnostic.location;
    assert.ok(location);

    assert.equal(
      location!.start.line,
      3,
    );

    assert.equal(
      location!.start.column,
      10,
    );
  },
);

test(
  "no-useless-fragment reports fragment with one child",
  () => {
    const diagnostics = analyzeRule(
      noUselessFragmentRule,
      `
        export function App() {
          return (
            <>
              <div>Hello</div>
            </>
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 1);

    const diagnostic = diagnostics[0]!;

    assert.ok(diagnostic);
    assert.equal(
      diagnostic!.ruleId,
      "react/no-useless-fragment",
    );
    assert.equal(
      diagnostic!.severity,
      "warning",
    );
    assert.equal(
      diagnostic!.category,
      "react",
    );
  },
);

test(
  "no-useless-fragment allows multiple children",
  () => {
    const diagnostics = analyzeRule(
      noUselessFragmentRule,
      `
        export function App() {
          return (
            <>
              <div>Hello</div>
              <span>World</span>
            </>
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-useless-fragment allows text as the only child",
  () => {
    const diagnostics = analyzeRule(
      noUselessFragmentRule,
      `
        export function App() {
          return (
            <>
              Hello
            </>
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-useless-fragment detects nested useless fragment",
  () => {
    const diagnostics = analyzeRule(
      noUselessFragmentRule,
      `
        export function App() {
          return (
            <>
              <>
                <div>Hello</div>
              </>
            </>
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 2);
  },
);

test(
  "no-direct-mutation-state reports direct property assignment",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationStateRule,
      `
        class Counter extends React.Component {
          increment() {
            this.state.count = 1;
          }

          render() {
            return <div>{this.state.count}</div>;
          }
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
    assert.equal(
      diagnostics[0]?.ruleId,
      "react/no-direct-mutation-state",
    );
    assert.equal(
      diagnostics[0]?.severity,
      "warning",
    );
    assert.equal(
      diagnostics[0]?.category,
      "react",
    );
  },
);

test(
  "no-direct-mutation-state reports compound assignment",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationStateRule,
      `
        class Counter extends React.Component {
          increment() {
            this.state.count += 1;
          }
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-direct-mutation-state reports increment mutation",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationStateRule,
      `
        class Counter extends React.Component {
          increment() {
            this.state.count++;
          }
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-direct-mutation-state reports array mutation",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationStateRule,
      `
        class Users extends React.Component {
          addUser(user) {
            this.state.users.push(user);
          }
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-direct-mutation-state reports element access mutation",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationStateRule,
      `
        class Users extends React.Component {
          update(index) {
            this.state.users[index] = "updated";
          }
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-direct-mutation-state allows setState",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationStateRule,
      `
        class Counter extends React.Component {
          increment() {
            this.setState({
              count: this.state.count + 1,
            });
          }
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-direct-mutation-state ignores unrelated state variable",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationStateRule,
      `
        const state = {
          count: 0,
        };

        state.count = 1;
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-direct-mutation-state reports aliased state property mutation",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationStateRule,
      `
        class Counter extends React.Component {
          increment() {
            const state = this.state;
            state.count = 1;
          }
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-direct-mutation-state ignores shadowed state alias",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationStateRule,
      `
        class Counter extends React.Component {
          increment() {
            const state = {
              count: 0,
            };

            function update(state) {
              state.count = 1;
            }

            update(state);
          }
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-direct-mutation-state reports captured aliased state",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationStateRule,
      `
        class Counter extends React.Component {
          increment() {
            const state = this.state;

            function update() {
              state.count = 1;
            }

            update();
          }
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-direct-mutation-state reports multiple mutations",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationStateRule,
      `
        class Counter extends React.Component {
          update() {
            this.state.count = 1;
            this.state.total += 1;
            this.state.items.push("item");
          }
        }
      `,
    );

    assert.equal(diagnostics.length, 3);
  },
);

test(
  "no-direct-mutation-state reports correct source location",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationStateRule,
      `class Counter extends React.Component {
  increment() {
    this.state.count = 1;
  }
}
`,
    );

    assert.equal(diagnostics.length, 1);

    const diagnostic = diagnostics[0]!;

    if (!diagnostic) {
      throw new Error("Expected a diagnostic");
    }
    assert.ok(diagnostic.location);

    assert.equal(
      diagnostic.location!.start.line,
      3,
    );

    assert.equal(
      diagnostic.location!.start.column,
      5,
    );
  },
);

test(
  "no-dangerous-html reports dangerouslySetInnerHTML",
  () => {
    const diagnostics = analyzeRule(
      noDangerousHtmlRule,
      `
        export function App({ html }) {
          return (
            <div
              dangerouslySetInnerHTML={{
                __html: html,
              }}
            />
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
    assert.equal(
      diagnostics[0]?.ruleId,
      "react/no-dangerous-html",
    );
    assert.equal(
      diagnostics[0]?.severity,
      "warning",
    );
    assert.equal(
      diagnostics[0]?.category,
      "react",
    );
  },
);

test(
  "no-dangerous-html reports multiple dangerous HTML attributes",
  () => {
    const diagnostics = analyzeRule(
      noDangerousHtmlRule,
      `
        export function App({ first, second }) {
          return (
            <>
              <div
                dangerouslySetInnerHTML={{
                  __html: first,
                }}
              />

              <span
                dangerouslySetInnerHTML={{
                  __html: second,
                }}
              />
            </>
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 2);
  },
);

test(
  "no-dangerous-html allows normal JSX rendering",
  () => {
    const diagnostics = analyzeRule(
      noDangerousHtmlRule,
      `
        export function App({ html }) {
          return <div>{html}</div>;
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-dangerous-html reports correct attribute location",
  () => {
    const diagnostics = analyzeRule(
      noDangerousHtmlRule,
      `export function App({ html }) {
  return (
    <div dangerouslySetInnerHTML={{ __html: html }} />
  );
}
`,
    );

    assert.equal(diagnostics.length, 1);

    const diagnostic = diagnostics[0];

    if (!diagnostic) {
      throw new Error("Expected a diagnostic");
    }

    if (!diagnostic.location) {
      throw new Error("Expected the diagnostic to have a location");
    }

    assert.equal(
      diagnostic.location.start.line,
      3,
    );

    assert.equal(
      diagnostic.location.start.column,
      10,
    );
  },
);

test(
  "no-direct-mutation-props reports direct property assignment",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function UserCard(props) {
          props.name = "Updated";
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
    assert.equal(
      diagnostics[0]?.ruleId,
      "react/no-direct-mutation-props",
    );
    assert.equal(
      diagnostics[0]?.severity,
      "warning",
    );
    assert.equal(
      diagnostics[0]?.category,
      "react",
    );
  },
);

test(
  "no-direct-mutation-props reports nested property mutation",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function UserCard(props) {
          props.user.name = "Updated";
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-direct-mutation-props reports compound assignment",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function Counter(props) {
          props.count += 1;
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-direct-mutation-props reports increment mutation",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function Counter(props) {
          props.count++;
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-direct-mutation-props reports array mutation",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function Users(props) {
          props.users.push("new user");
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-direct-mutation-props reports element access mutation",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function Users(props) {
          props.users[0] = "updated";
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-direct-mutation-props allows reading props",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function UserCard(props) {
          return <div>{props.name}</div>;
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-direct-mutation-props allows creating a new value",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function UserCard(props) {
          const copy = {
            ...props.user,
          };

          copy.name = "Updated";
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-direct-mutation-props ignores nested function parameters",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function UserCard(props) {
          function update(props) {
            props.name = "Updated";
          }

          update(otherProps);
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-direct-mutation-props still reports outer prop mutation",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function UserCard(props) {
          function update(value) {
            value.name = "Updated";
          }

          props.name = "Changed";
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-direct-mutation-props reports destructured prop mutation",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function UserCard({ user }) {
          user.name = "Updated";
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-direct-mutation-props reports multiple destructured prop mutations",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function UserCard({ user, items }) {
          user.name = "Updated";
          items.push("new item");
        }
      `,
    );

    assert.equal(diagnostics.length, 2);
  },
);

test(
  "no-missing-key accepts parenthesized JSX",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `
        export function Users({ users }) {
          return users.map((user) => (
            (
              <div>{user.name}</div>
            )
          ));
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-missing-key accepts keyed JSX inside parenthesized expression",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `
        export function Users({ users }) {
          return users.map((user) => (
            (
              <div key={user.id}>{user.name}</div>
            )
          ));
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-missing-key reports multiple JSX returns from block callback",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `
        export function Users({ users }) {
          return users.map((user) => {
            if (user.active) {
              return <div>{user.name}</div>;
            }

            return <span>{user.email}</span>;
          });
        }
      `,
    );

    assert.equal(diagnostics.length, 2);
  },
);

test(
  "no-missing-key reports JSX inside an unkeyed fragment",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `
        export function Users({ users }) {
          return users.map((user) => (
            <>
              <div>{user.name}</div>
              <span>{user.email}</span>
            </>
          ));
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-missing-key accepts keyed fragment",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `
        export function Users({ users }) {
          return users.map((user) => (
            <React.Fragment key={user.id}>
              <div>{user.name}</div>
              <span>{user.email}</span>
            </React.Fragment>
          ));
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-missing-key reports unkeyed fragment returned from block callback",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `
        export function Users({ users }) {
          return users.map((user) => {
            return (
              <>
                <div>{user.name}</div>
              </>
            );
          });
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-missing-key reports unkeyed explicit React fragment",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `
        export function Users({ users }) {
          return users.map((user) => (
            <React.Fragment>
              <div>{user.name}</div>
            </React.Fragment>
          ));
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-array-index-key ignores shadowed index binding",
  () => {
    const diagnostics = analyzeRule(
      noArrayIndexKeyRule,
      `
        export function Users({ users }) {
          return users.map((user, index) => {
            function render(index) {
              return <div key={index}>{user.name}</div>;
            }

            return render(index);
          });
        }
      `,
    );

    assert.equal(
      diagnostics.length,
      0,
    );
  },
);

test(
  "no-array-index-key reports index used in computed key",
  () => {
    const diagnostics = analyzeRule(
      noArrayIndexKeyRule,
      `
        export function Users({ users }) {
          return users.map((user, index) => (
            <div key={user.id + index}>
              {user.name}
            </div>
          ));
        }
      `,
    );

    assert.equal(
      diagnostics.length,
      1,
    );
  },
);

test(
  "no-array-index-key reports index used inside expression",
  () => {
    const diagnostics = analyzeRule(
      noArrayIndexKeyRule,
      `
        export function Users({ users }) {
          return users.map((user, position) => (
            <div key={String(position)}>
              {user.name}
            </div>
          ));
        }
      `,
    );

    assert.equal(
      diagnostics.length,
      1,
    );
  },
);

test(
  "no-array-index-key reports aliased callback index",
  () => {
    const diagnostics = analyzeRule(
      noArrayIndexKeyRule,
      `
        export function Users({ users }) {
          return users.map((user, index) => {
            const itemIndex = index;

            return (
              <div key={itemIndex}>
                {user.name}
              </div>
            );
          });
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-array-index-key ignores same-name outer binding",
  () => {
    const diagnostics = analyzeRule(
      noArrayIndexKeyRule,
      `
        const index = "stable";

        export function Users({ users }) {
          return users.map((user) => (
            <div key={index}>
              {user.name}
            </div>
          ));
        }
      `,
    );

    assert.equal(
      diagnostics.length,
      0,
    );
  },
);

test(
  "no-direct-mutation-props ignores shadowed nested prop binding",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function UserCard(props) {
          function update(props) {
            props.name = "Local";
          }

          props.name = "Actual prop mutation";
        }
      `,
    );

    assert.equal(
      diagnostics.length,
      1,
    );
  },
);

test(
  "no-direct-mutation-props ignores same-name outer binding",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        const props = {
          name: "stable",
        };

        function UserCard() {
          props.name = "Not a React prop";
        }
      `,
    );

    assert.equal(
      diagnostics.length,
      0,
    );
  },
);

test(
  "no-direct-mutation-props ignores shadowed destructured prop",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function UserCard({ user }) {
          function update(user) {
            user.name = "Local";
          }

          user.name = "Actual prop mutation";
        }
      `,
    );

    assert.equal(
      diagnostics.length,
      1,
    );
  },
);

test(
  "no-direct-mutation-props resolves destructured prop binding",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function UserCard({ user }) {
          function update(value) {
            value.name = "Not a prop";
          }

          user.name = "Actual prop mutation";
        }
      `,
    );

    assert.equal(
      diagnostics.length,
      1,
    );
  },
);

test(
  "no-direct-mutation-props reports captured props in nested function",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function UserCard(props) {
          function update() {
            props.name = "mutated";
          }

          update();
        }
      `,
    );

    assert.equal(
      diagnostics.length,
      1,
    );
  },
);

test(
  "no-direct-mutation-props reports captured destructured prop in nested function",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function UserCard({ user }) {
          function update() {
            user.name = "mutated";
          }

          update();
        }
      `,
    );

    assert.equal(
      diagnostics.length,
      1,
    );
  },
);

test(
  "no-direct-mutation-state ignores unrelated state variable",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationStateRule,
      `
        function Counter() {
          const state = {
            count: 0,
          };

          state.count = 1;
        }
      `,
    );

    assert.equal(
      diagnostics.length,
      0,
    );
  },
);

test(
  "no-direct-mutation-state reports nested this.state property mutation",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationStateRule,
      `
        class Counter extends React.Component {
          update() {
            this.state.user.name = "updated";
          }
        }
      `,
    );

    assert.equal(
      diagnostics.length,
      1,
    );
  },
);

test(
  "no-direct-mutation-state reports this.state element mutation",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationStateRule,
      `
        class Counter extends React.Component {
          update(index, value) {
            this.state.items[index] = value;
          }
        }
      `,
    );

    assert.equal(
      diagnostics.length,
      1,
    );
  },
);

test(
  "no-direct-mutation-state reports this.state array method mutation",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationStateRule,
      `
        class Counter extends React.Component {
          addItem(item) {
            this.state.items.push(item);
          }
        }
      `,
    );

    assert.equal(
      diagnostics.length,
      1,
    );
  },
);

test(
  "no-direct-mutation-state allows setState",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationStateRule,
      `
        class Counter extends React.Component {
          update() {
            this.setState({
              count: 1,
            });
          }
        }
      `,
    );

    assert.equal(
      diagnostics.length,
      0,
    );
  },
);

test(
  "no-missing-key ignores JSX returned from nested function",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `
        export function Users({ users }) {
          function helper() {
            return <div>Helper</div>;
          }

          return users.map((user) => {
            helper();
            return <span>{user.name}</span>;
          });
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-missing-key ignores JSX returned from nested arrow function",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `
        export function Users({ users }) {
          return users.map((user) => {
            const helper = () => {
              return <div>Helper</div>;
            };

            return <span>{user.name}</span>;
          });
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-missing-key reports both conditional returns",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `
        export function Users({ users }) {
          return users.map((user) => {
            if (user.active) {
              return <div>{user.name}</div>;
            }

            return <span>{user.email}</span>;
          });
        }
      `,
    );

    assert.equal(diagnostics.length, 2);
  },
);

test(
  "no-missing-key accepts keyed conditional returns",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `
        export function Users({ users }) {
          return users.map((user) => {
            if (user.active) {
              return <div key={user.id}>{user.name}</div>;
            }

            return <span key={user.id}>{user.email}</span>;
          });
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-unstable-nested-components ignores nested lowercase helper",
  () => {
    const diagnostics = analyzeRule(
      noUnstableNestedComponentsRule,
      `
        export function Parent() {
          function helper() {
            return <div>Hello</div>;
          }

          return helper();
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-unstable-nested-components reports nested component arrow function",
  () => {
    const diagnostics = analyzeRule(
      noUnstableNestedComponentsRule,
      `
        export function Parent() {
          const Child = () => {
            return <div>Hello</div>;
          };

          return <Child />;
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-unstable-nested-components ignores nested function without JSX",
  () => {
    const diagnostics = analyzeRule(
      noUnstableNestedComponentsRule,
      `
        export function Parent() {
          function Child() {
            return "Hello";
          }

          return <div>{Child()}</div>;
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-unstable-nested-components reports component nested through helper",
  () => {
    const diagnostics = analyzeRule(
      noUnstableNestedComponentsRule,
      `
        export function Parent() {
          function helper() {
            function Child() {
              return <div>Hello</div>;
            }

            return <Child />;
          }

          return <div>{helper()}</div>;
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-unstable-nested-components reports deeply nested component",
  () => {
    const diagnostics = analyzeRule(
      noUnstableNestedComponentsRule,
      `
        export function Parent() {
          function Middle() {
            function Child() {
              return <div>Hello</div>;
            }

            return <Child />;
          }

          return <Middle />;
        }
      `,
    );

    assert.equal(diagnostics.length, 2);
  },
);

test(
  "no-unstable-nested-components reports uppercase nested function used as component",
  () => {
    const diagnostics = analyzeRule(
      noUnstableNestedComponentsRule,
      `
        export function Parent() {
          function RenderThing() {
            return <div>Hello</div>;
          }

          return <RenderThing />;
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-unstable-nested-components ignores uppercase JSX helper called inside JSX expression",
  () => {
    const diagnostics = analyzeRule(
      noUnstableNestedComponentsRule,
      `
        export function Parent() {
          function RenderThing() {
            return <div>Hello</div>;
          }

          return <section>{RenderThing()}</section>;
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-dangerous-html ignores normal JSX rendering",
  () => {
    const diagnostics = analyzeRule(
      noDangerousHtmlRule,
      `
        export function App({ html }) {
          return <div>{html}</div>;
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-dangerous-html ignores similarly named attributes",
  () => {
    const diagnostics = analyzeRule(
      noDangerousHtmlRule,
      `
        export function App({ html }) {
          return (
            <div
              dangerouslySetInnerHTMLSomething={html}
            />
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-dangerous-html ignores spread attributes",
  () => {
    const diagnostics = analyzeRule(
      noDangerousHtmlRule,
      `
        export function App({ props }) {
          return <div {...props} />;
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-dangerous-html still reports explicit dangerous HTML with spread attributes",
  () => {
    const diagnostics = analyzeRule(
      noDangerousHtmlRule,
      `
        export function App({ props }) {
          return (
            <div
              {...props}
              dangerouslySetInnerHTML={{
                __html: props.html,
              }}
            />
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-dangerous-html reports dangerous HTML on custom components",
  () => {
    const diagnostics = analyzeRule(
      noDangerousHtmlRule,
      `
        export function App({ html }) {
          return (
            <Content
              dangerouslySetInnerHTML={{
                __html: html,
              }}
            />
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-dangerous-html reports multiple dangerous HTML usages",
  () => {
    const diagnostics = analyzeRule(
      noDangerousHtmlRule,
      `
        export function App({ first, second }) {
          return (
            <>
              <div
                dangerouslySetInnerHTML={{
                  __html: first,
                }}
              />

              <section
                dangerouslySetInnerHTML={{
                  __html: second,
                }}
              />
            </>
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 2);
  },
);

test(
  "no-dangerous-html reports attribute without a value",
  () => {
    const diagnostics = analyzeRule(
      noDangerousHtmlRule,
      `
        export function App() {
          return <div dangerouslySetInnerHTML />;
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-dangerous-html reports expression-valued dangerous HTML",
  () => {
    const diagnostics = analyzeRule(
      noDangerousHtmlRule,
      `
        export function App({ html }) {
          return (
            <div
              dangerouslySetInnerHTML={html}
            />
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-useless-fragment reports one child surrounded by whitespace",
  () => {
    const diagnostics = analyzeRule(
      noUselessFragmentRule,
      `
        export function App() {
          return (
            <>

              <div>Hello</div>

            </>
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-useless-fragment reports a single JSX expression child",
  () => {
    const diagnostics = analyzeRule(
      noUselessFragmentRule,
      `
        export function App({ value }) {
          return <>{value}</>;
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-useless-fragment allows an empty fragment",
  () => {
    const diagnostics = analyzeRule(
      noUselessFragmentRule,
      `
        export function App() {
          return <></>;
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-useless-fragment allows text and an element",
  () => {
    const diagnostics = analyzeRule(
      noUselessFragmentRule,
      `
        export function App() {
          return (
            <>
              Hello
              <span>World</span>
            </>
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-useless-fragment allows multiple JSX expressions",
  () => {
    const diagnostics = analyzeRule(
      noUselessFragmentRule,
      `
        export function App({ first, second }) {
          return (
            <>
              {first}
              {second}
            </>
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-useless-fragment reports nested fragment with one renderable child",
  () => {
    const diagnostics = analyzeRule(
      noUselessFragmentRule,
      `
        export function App() {
          return (
            <>
              <>
                <div>Hello</div>
              </>
            </>
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 2);
  },
);

test(
  "no-useless-fragment treats a single null expression as one child",
  () => {
    const diagnostics = analyzeRule(
      noUselessFragmentRule,
      `
        export function App() {
          return <>{null}</>;
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-useless-fragment reports a fragment with one element and a comment",
  () => {
    const diagnostics = analyzeRule(
      noUselessFragmentRule,
      `
        export function App() {
          return (
            <>
              {/* This is a comment */}
              <div>Hello</div>
            </>
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-useless-fragment allows two different child types",
  () => {
    const diagnostics = analyzeRule(
      noUselessFragmentRule,
      `
        export function App({ value }) {
          return (
            <>
              {value}
              <span>Hello</span>
            </>
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-array-index-key ignores shadowed nested function index",
  () => {
    const diagnostics = analyzeRule(
      noArrayIndexKeyRule,
      `
        export function Users({ users }) {
          return users.map((user, index) => {
            function helper(index) {
              return <div key={index}>{index}</div>;
            }

            helper("stable");

            return <span key={index}>{user.name}</span>;
          });
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-array-index-key ignores shadowed nested arrow index",
  () => {
    const diagnostics = analyzeRule(
      noArrayIndexKeyRule,
      `
        export function Users({ users }) {
          return users.map((user, index) => {
            const helper = (index) => (
              <div key={index}>{index}</div>
            );

            helper("stable");

            return <span key={index}>{user.name}</span>;
          });
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-array-index-key reports callback index in template expression",
  () => {
    const diagnostics = analyzeRule(
      noArrayIndexKeyRule,
      `
        export function Users({ users }) {
          return users.map((user, index) => (
            <div key={\`item-\${index}\`}>
              {user.name}
            </div>
          ));
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-array-index-key reports callback index in member access",
  () => {
    const diagnostics = analyzeRule(
      noArrayIndexKeyRule,
      `
        export function Users({ users }) {
          return users.map((user, index) => (
            <div key={users[index].id}>
              {user.name}
            </div>
          ));
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-array-index-key ignores shadowed block index in key expression",
  () => {
    const diagnostics = analyzeRule(
      noArrayIndexKeyRule,
      `
        export function Users({ users }) {
          return users.map((user, index) => {
            {
              const index = "stable";
              console.log(index);
            }

            return <span key={index}>{user.name}</span>;
          });
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-array-index-key reports captured callback index",
  () => {
    const diagnostics = analyzeRule(
      noArrayIndexKeyRule,
      `
        export function Users({ users }) {
          return users.map((user, index) => {
            const render = () => (
              <span key={index}>{user.name}</span>
            );

            return render();
          });
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-array-index-key ignores shadowed callback index in nested closure",
  () => {
    const diagnostics = analyzeRule(
      noArrayIndexKeyRule,
      `
        export function Users({ users }) {
          return users.map((user, index) => {
            const render = (index) => (
              <span key={index}>{user.name}</span>
            );

            return render(index);
          });
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-array-index-key reports callback index in conditional key",
  () => {
    const diagnostics = analyzeRule(
      noArrayIndexKeyRule,
      `
        export function Users({ users }) {
          return users.map((user, index) => (
            <span key={user.active ? index : user.id}>
              {user.name}
            </span>
          ));
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-implicit-any-props ignores safely typed destructured props",
  () => {
    const diagnostics = analyzeRule(
      noImplicitAnyPropsRule,
      `
        interface UserProps {
          name: string;
          age: number;
        }

        export function UserCard({
          name,
          age,
        }: UserProps) {
          return (
            <div>
              {name}
              {age}
            </div>
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-implicit-any-props reports explicitly any destructured props",
  () => {
    const diagnostics = analyzeRule(
      noImplicitAnyPropsRule,
      `
        export function UserCard({
          name,
        }: any) {
          return <div>{name}</div>;
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-implicit-any-props reports explicit any props parameter",
  () => {
    const diagnostics = analyzeRule(
      noImplicitAnyPropsRule,
      `
        export function UserCard(
          props: any,
        ) {
          return <div>{props.name}</div>;
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-implicit-any-props ignores lowercase helper with any parameter",
  () => {
    const diagnostics = analyzeRule(
      noImplicitAnyPropsRule,
      `
        function helper(value: any) {
          return value;
        }

        export function UserCard() {
          return <div>{helper("hello")}</div>;
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-unsafe-prop-access ignores safely typed property access",
  () => {
    const diagnostics = analyzeRule(
      noUnsafePropAccessRule,
      `
        interface UserProps {
          name: string;
        }

        export function UserCard(
          props: UserProps,
        ) {
          return <div>{props.name}</div>;
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-unsafe-prop-access reports unknown property access",
  () => {
    const diagnostics = analyzeRule(
      noUnsafePropAccessRule,
      `
        export function UserCard(
          props: unknown,
        ) {
          return <div>{props.name}</div>;
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-unsafe-prop-access reports destructured any prop",
  () => {
    const diagnostics = analyzeRule(
      noUnsafePropAccessRule,
      `
        export function UserCard({
          name,
        }: any) {
          return <div>{name}</div>;
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-unsafe-prop-access ignores safely typed destructured prop",
  () => {
    const diagnostics = analyzeRule(
      noUnsafePropAccessRule,
      `
        interface UserProps {
          name: string;
        }

        export function UserCard({
          name,
        }: UserProps) {
          return <div>{name}</div>;
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-unsafe-prop-access ignores shadowed props parameter",
  () => {
    const diagnostics = analyzeRule(
      noUnsafePropAccessRule,
      `
        export function UserCard(
          props: any,
        ) {
          function render(
            props: {
              name: string;
            },
          ) {
            return <div>{props.name}</div>;
          }

          return render({
            name: "Alice",
          });
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-unsafe-prop-access reports captured outer props",
  () => {
    const diagnostics = analyzeRule(
      noUnsafePropAccessRule,
      `
        export function UserCard(
          props: any,
        ) {
          function render() {
            return <div>{props.name}</div>;
          }

          return render();
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-direct-mutation-props reports aliased prop mutation",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        export function UserCard(
          props: {
            user: {
              name: string;
            };
          },
        ) {
          const user = props.user;

          user.name = "Bob";

          return <div>{user.name}</div>;
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-direct-mutation-props reports chained aliased prop mutation",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        export function UserCard(
          props: {
            user: {
              name: string;
            };
          },
        ) {
          const user = props.user;
          const account = user;

          account.name = "Bob";

          return <div>{account.name}</div>;
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-direct-mutation-props reports destructured aliased prop mutation",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        export function UserCard(
          props: {
            user: {
              name: string;
            };
          },
        ) {
          const { user } = props;

          user.name = "Bob";

          return <div>{user.name}</div>;
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-missing-key reports JSX returned through local variable",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `
        export function Users({ users }) {
          return users.map((user) => {
            const element = <div>{user.name}</div>;

            return element;
          });
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-missing-key reports JSX local variable from conditional branch",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `
        export function Users({ users }) {
          return users.map((user) => {
            if (user.active) {
              const element = (
                <div>{user.name}</div>
              );

              return element;
            }

            return <span>{user.name}</span>;
          });
        }
      `,
    );

    assert.equal(diagnostics.length, 2);
  },
);

test(
  "no-unsafe-prop-access reports aliased props parameter",
  () => {
    const diagnostics = analyzeRule(
      noUnsafePropAccessRule,
      `
        export function UserCard(
          props: any,
        ) {
          const userProps = props;

          return <div>{userProps.name}</div>;
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-direct-mutation-state reports chained aliased state",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationStateRule,
      `
        class Counter extends React.Component {
          increment() {
            const state = this.state;
            const current = state;

            current.count = 1;
          }
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-useless-fragment reports conditional JSX expression as one child",
  () => {
    const diagnostics = analyzeRule(
      noUselessFragmentRule,
      `
        export function App({ condition }) {
          return (
            <>
              {condition
                ? <div>Hello</div>
                : <span>Hello</span>}
            </>
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-missing-key reports JSX assigned to local variable",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `
        export function Users({ users }) {
          return users.map((user) => {
            let element;

            if (user.active) {
              element = <div>{user.name}</div>;
            }

            return element;
          });
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-implicit-any-props reports untyped props parameter",
  () => {
    const diagnostics = analyzeRule(
      noImplicitAnyPropsRule,
      `
        export function UserCard(
          props,
        ) {
          return <div>{props.name}</div>;
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-unsafe-prop-access reports destructured alias from props",
  () => {
    const diagnostics = analyzeRule(
      noUnsafePropAccessRule,
      `
        export function UserCard(
          props: any,
        ) {
          const { name } = props;

          return <div>{name}</div>;
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-array-index-key reports assigned index alias",
  () => {
    const diagnostics = analyzeRule(
      noArrayIndexKeyRule,
      `
        export function Users({ users }) {
          return users.map((user, index) => {
            let itemIndex;

            itemIndex = index;

            return (
              <div key={itemIndex}>
                {user.name}
              </div>
            );
          });
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-direct-mutation-props reports aliased props mutation",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function UserCard(props) {
          const currentProps = props;

          currentProps.name = "Updated";
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-direct-mutation-props reports chained aliased props mutation",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function UserCard(props) {
          const first = props;
          const second = first;

          second.name = "Updated";
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-direct-mutation-props ignores shadowed aliased props",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function UserCard(props) {
          const currentProps = {
            name: "Local",
          };

          function update(props) {
            const currentProps = props;

            currentProps.name = "Updated";
          }

          update(currentProps);
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-direct-mutation-props reports captured aliased props",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function UserCard(props) {
          const currentProps = props;

          function update() {
            currentProps.name = "Updated";
          }

          update();
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-direct-mutation-props reports assigned props alias",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function UserCard(props) {
          let currentProps;

          currentProps = props;

          currentProps.name = "Updated";
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-direct-mutation-state reports assigned state alias",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationStateRule,
      `
        class Counter extends React.Component {
          increment() {
            let currentState;

            currentState = this.state;

            currentState.count = 1;
          }
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-array-index-key ignores alias reassigned to stable key",
  () => {
    const diagnostics = analyzeRule(
      noArrayIndexKeyRule,
      `
        const items = data.map((item, index) => {
          let itemKey = index;

          itemKey = item.id;

          return <div key={itemKey} />;
        });
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-missing-key reports JSX local variable assigned in conditional branch",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `
        const items = data.map((item) => {
          let element;

          if (item.active) {
            element = <div />;
          }

          return element;
        });
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-missing-key reports JSX local variable assigned in both conditional branches",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `
        const items = data.map((item) => {
          let element;

          if (item.active) {
            element = <div />;
          } else {
            element = <span />;
          }

          return element;
        });
      `,
    );

    assert.equal(diagnostics.length, 2);
  },
);

test(
  "no-missing-key reports JSX local variable reassigned before return",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `
        const items = data.map((item) => {
          let element = <div />;

          element = <span />;

          return element;
        });
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-unstable-nested-components ignores uppercase JSX helper called as function",
  () => {
    const diagnostics = analyzeRule(
      noUnstableNestedComponentsRule,
      `
        export function Parent() {
          function RenderThing() {
            return <div>Hello</div>;
          }

          return RenderThing();
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-missing-key reports JSX local variable reassigned before return",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `
        export function Users({ users }) {
          return users.map((user) => {
            let element = <div>{user.name}</div>;

            element = <span>{user.email}</span>;

            return element;
          });
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-missing-key reports JSX local variable assigned in both conditional branches",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `
        export function Users({ users }) {
          return users.map((user) => {
            let element;

            if (user.active) {
              element = <div>{user.name}</div>;
            } else {
              element = <span>{user.email}</span>;
            }

            return element;
          });
        }
      `,
    );

    assert.equal(diagnostics.length, 2);
  },
);

test(
  "no-direct-mutation-props ignores reassigned props alias",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function UserCard(props) {
          let currentProps;

          currentProps = props;
          currentProps = {
            name: "Local",
          };

          currentProps.name = "Updated";
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-direct-mutation-state ignores reassigned state alias",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationStateRule,
      `
        class Counter extends React.Component {
          increment() {
            let currentState;

            currentState = this.state;
            currentState = {
              count: 0,
            };

            currentState.count = 1;
          }
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-missing-key reports JSX local variable reassigned before return",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `
        const items = data.map((item) => {
          let element = <div />;

          element = <span />;

          return element;
        });
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-missing-key reports JSX returned through reassigned local alias",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `
        export function Users({ users }) {
          return users.map((user) => {
            let element = <div>{user.name}</div>;

            let current = element;
            current = <span>{user.email}</span>;

            return current;
          });
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-missing-key reports all JSX values from conditional local alias",
  () => {
    const diagnostics = analyzeRule(
      noMissingKeyRule,
      `
        export function Users({ users }) {
          return users.map((user) => {
            let element;

            if (user.active) {
              element = <div>{user.name}</div>;
            } else {
              element = <span>{user.email}</span>;
            }

            const current = element;

            return current;
          });
        }
      `,
    );

    assert.equal(diagnostics.length, 2);
  },
);

test(
  "no-array-index-key reports alias reassigned to index",
  () => {
    const diagnostics = analyzeRule(
      noArrayIndexKeyRule,
      `
        const items = data.map((item, index) => {
          let itemKey = item.id;

          itemKey = index;

          return <div key={itemKey} />;
        });
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-dangerous-html ignores namespaced JSX attributes",
  () => {
    const diagnostics = analyzeRule(
      noDangerousHtmlRule,
      `
        export function App({ html }) {
          return (
            <div
              custom:dangerouslySetInnerHTML={html}
            />
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);