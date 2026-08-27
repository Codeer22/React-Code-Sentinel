import test from "node:test";
import assert from "node:assert/strict";

import {
  noUselessFragmentRule,
} from "../components/no-useless-fragment.js";

import {
  analyzeRule,
} from "./test-utils.js";

test(
  "reports imported Fragment alias with one child",
  () => {
    const diagnostics = analyzeRule(
      noUselessFragmentRule,
      `
        import { Fragment as Group } from "react";
        export function App() {
          return (
            <Group>
              <div>Hello</div>
            </Group>
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "ignores unrelated local Fragment component",
  () => {
    const diagnostics = analyzeRule(
      noUselessFragmentRule,
      `
        function Fragment({ children }) {
          return <section>{children}</section>;
        }

        export function App() {
          return (
            <Fragment>
              <div>Hello</div>
            </Fragment>
          );
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);
