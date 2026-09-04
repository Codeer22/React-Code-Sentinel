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

test(
  "no-direct-mutation-props reports alias re-established after reassignment",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function UserCard(props) {
          let currentProps = props;

          currentProps.name = "First";

          currentProps = {
            name: "Local",
          };

          currentProps = props;

          currentProps.name = "Second";
        }
      `,
    );

    assert.equal(diagnostics.length, 2);
  },
);

test(
  "no-direct-mutation-props ignores mutation after alias is broken",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationPropsRule,
      `
        function UserCard(props) {
          let currentProps = props;

          currentProps = {
            name: "Local",
          };

          currentProps.name = "Local mutation";
        }
      `,
    );

    assert.equal(diagnostics.length, 0);
  },
);

test(
  "no-direct-mutation-state ignores mutation after state alias is broken",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationStateRule,
      `
        class Counter extends React.Component {
          update() {
            let currentState = this.state;

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
  "no-direct-mutation-state reports state alias re-established after reassignment",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationStateRule,
      `
        class Counter extends React.Component {
          update() {
            let currentState = {
              count: 0,
            };

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
  "no-direct-mutation-state reports state alias after breaking and re-establishing it",
  () => {
    const diagnostics = analyzeRule(
      noDirectMutationStateRule,
      `
        class Counter extends React.Component {
          update() {
            let currentState = this.state;

            currentState = {
              count: 0,
            };

            currentState = this.state;

            currentState.count = 1;
          }
        }
      `,
    );

    assert.equal(diagnostics.length, 1);
  },
);
