import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeRule,
} from "./test-utils.js";

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
