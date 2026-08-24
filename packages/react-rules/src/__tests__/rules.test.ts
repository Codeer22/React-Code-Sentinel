import test from "node:test";
import assert from "node:assert/strict";
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

    const diagnostic = diagnostics[0];

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
      diagnostic.location.start.column,
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

    const diagnostic = diagnostics[0];

    assert.ok(diagnostic);
    assert.equal(
      diagnostic.ruleId,
      "react/no-array-index-key",
    );
    assert.equal(
      diagnostic.severity,
      "warning",
    );
    assert.equal(
      diagnostic.category,
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

    const diagnostic = diagnostics[0];

    assert.ok(diagnostic);
    assert.ok(diagnostic.location);

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

    const diagnostic = diagnostics[0];

    assert.ok(diagnostic);
    assert.equal(
      diagnostic.ruleId,
      "react/no-useless-fragment",
    );
    assert.equal(
      diagnostic.severity,
      "warning",
    );
    assert.equal(
      diagnostic.category,
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

    const diagnostic = diagnostics[0];

    assert.ok(diagnostic);
    assert.ok(diagnostic.location);

    assert.equal(
      diagnostic.location.start.line,
      3,
    );

    assert.equal(
      diagnostic.location.start.column,
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

    assert.ok(diagnostic);
    assert.ok(diagnostic.location);

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
  "no-unstable-nested-components currently treats uppercase JSX-returning helper as component",
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

    assert.equal(diagnostics.length, 1);
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
