import test from "node:test";
import assert from "node:assert/strict";

import ts from "@typescript/typescript6";

import {
  getFunctionName,
  isComponentName,
  isReactComponentFunction,
} from "../utils/components.js";

function getFunction(
  sourceText: string,
  filePath = "App.tsx",
):
  | ts.FunctionDeclaration
  | ts.FunctionExpression
  | ts.ArrowFunction {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  let result:
    | ts.FunctionDeclaration
    | ts.FunctionExpression
    | ts.ArrowFunction
    | undefined;

  function visit(node: ts.Node): void {
    if (
      result === undefined &&
      (
        ts.isFunctionDeclaration(node) ||
        ts.isFunctionExpression(node) ||
        ts.isArrowFunction(node)
      )
    ) {
      result = node;
      return;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (result === undefined) {
    throw new Error("Expected a function node.");
  }

  return result;
}

test(
  "isComponentName accepts React-style component names",
  () => {
    assert.equal(
      isComponentName("UserCard"),
      true,
    );

    assert.equal(
      isComponentName("Dashboard"),
      true,
    );

    assert.equal(
      isComponentName("UserCard2"),
      true,
    );
  },
);

test(
  "isComponentName rejects lowercase names",
  () => {
    assert.equal(
      isComponentName("userCard"),
      false,
    );

    assert.equal(
      isComponentName("helper"),
      false,
    );
  },
);

test(
  "getFunctionName resolves function declarations",
  () => {
    const node = getFunction(`
      function UserCard() {
        return <div />;
      }
    `);

    assert.equal(
      getFunctionName(node),
      "UserCard",
    );
  },
);

test(
  "getFunctionName resolves named arrow functions",
  () => {
    const node = getFunction(`
      const UserCard = () => {
        return <div />;
      };
    `);

    assert.equal(
      getFunctionName(node),
      "UserCard",
    );
  },
);

test(
  "isReactComponentFunction accepts named component functions",
  () => {
    const node = getFunction(`
      function UserCard() {
        return <div />;
      }
    `);

    assert.equal(
      isReactComponentFunction(node),
      true,
    );
  },
);

test(
  "isReactComponentFunction rejects lowercase helper functions",
  () => {
    const node = getFunction(`
      function formatUser() {
        return "user";
      }
    `);

    assert.equal(
      isReactComponentFunction(node),
      false,
    );
  },
);
