import test from "node:test";
import assert from "node:assert/strict";

import ts from "@typescript/typescript6";

import type {
  SemanticRule,
} from "@react-code-sentinel/analyzers";

import {
  runRules,
} from "@react-code-sentinel/core";

import {
  createSemanticContext,
} from "./helpers/create-semantic-context.js";

test(
  "semantic analysis resolves React component props type",
  () => {
    const context =
      createSemanticContext(`
        interface User {
          name: string;
        }

        interface UserCardProps {
          user: User;
        }

        function UserCard(
          props: UserCardProps,
        ) {
          return props.user.name;
        }
      `);

    let resolvedPropsType = "";

    const rule: SemanticRule = {
      meta: {
        id: "test/react-props-type",

        name:
          "React props type probe",

        description:
          "Probes semantic React props resolution.",

        category:
          "react",

        kind:
          "semantic",

        defaultSeverity:
          "warning",
      },

      analyze(ruleContext) {
        let componentFunction:
          ts.FunctionDeclaration |
          undefined;

        for (
          const statement
            of ruleContext.sourceFile.statements
        ) {
          if (
            ts.isFunctionDeclaration(
              statement,
            ) &&
            statement.name?.text ===
              "UserCard"
          ) {
            componentFunction =
              statement;

            break;
          }
        }

        assert.ok(
          componentFunction,
        );

        const propsParameter =
          componentFunction.parameters[0];

        assert.ok(
          propsParameter,
        );

        assert.ok(
          ts.isIdentifier(
            propsParameter.name,
          ),
        );

        const propsType =
          ruleContext.typeChecker
            .getTypeAtLocation(
              propsParameter,
            );

        resolvedPropsType =
          ruleContext.typeChecker
            .typeToString(
              propsType,
            );

        return [];
      },
    };

    const result =
      runRules(
        [rule],
        context,
      );

    assert.equal(
      result.diagnostics.length,
      0,
    );

    assert.equal(
      resolvedPropsType,
      "UserCardProps",
    );
  },
);