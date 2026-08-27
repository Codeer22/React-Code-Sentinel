import test from "node:test";
import assert from "node:assert/strict";

import {
  noDirectMutationPropsRule,
} from "../components/no-direct-mutation-props.js";

import {
  noDirectMutationStateRule,
} from "../components/no-direct-mutation-state.js";

import {
  analyzeRule,
} from "./test-utils.js";

const mutatingMethods = [
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
] as const;

for (const method of mutatingMethods) {
  test(
    `no-direct-mutation-props reports ${method}`,
    () => {
      const diagnostics = analyzeRule(
        noDirectMutationPropsRule,
        `function UserCard(props) { props.items.${method}(); }`,
      );

      assert.equal(diagnostics.length, 1);
    },
  );

  test(
    `no-direct-mutation-state reports ${method}`,
    () => {
      const diagnostics = analyzeRule(
        noDirectMutationStateRule,
        `class UserCard extends React.Component { update() { this.state.items.${method}(); } }`,
      );

      assert.equal(diagnostics.length, 1);
    },
  );
}

test(
  "no-direct-mutation-props reports nested destructured object mutation",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function UserCard({ user }) {
          user.profile.name = "Updated";
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-direct-mutation-props reports delete through an element alias",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function UserCard(props) {
          const items = props.items;
          delete items[0];
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);

test(
  "no-direct-mutation-state reports nested state alias mutation",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationStateRule,
      `
        class UserCard extends React.Component {
          update() {
            const state = this.state;
            state.items[0]++;
          }
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);
