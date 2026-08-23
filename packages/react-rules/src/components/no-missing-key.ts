import ts from "@typescript/typescript6";

import type {
  Diagnostic,
} from "@react-code-sentinel/core";

import type {
  AstRule,
} from "@react-code-sentinel/analyzers";

import {
  walkAst,
} from "@react-code-sentinel/analyzers";

function createDiagnostic(
  filePath: string,
  node: ts.JsxElement | ts.JsxSelfClosingElement,
): Diagnostic {
  const sourceFile = node.getSourceFile();

  const start =
    sourceFile.getLineAndCharacterOfPosition(
      node.getStart(sourceFile),
    );

  const end =
    sourceFile.getLineAndCharacterOfPosition(
      node.getEnd(),
    );

  return {
    ruleId: "react/no-missing-key",
    severity: "warning",
    category: "react",
    message:
      "JSX element rendered from an iterable is missing a key prop.",
    filePath,
    location: {
      start: {
        line: start.line + 1,
        column: start.character + 1,
      },
      end: {
        line: end.line + 1,
        column: end.character + 1,
      },
    },
    suggestion:
      "Add a stable key prop.",
  };
}

function hasKeyProp(
  node: ts.JsxElement | ts.JsxSelfClosingElement,
): boolean {
  const attributes =
    ts.isJsxElement(node)
      ? node.openingElement.attributes
      : node.attributes;

  return attributes.properties.some(
    (attribute) =>
      ts.isJsxAttribute(attribute) &&
      ts.isIdentifier(attribute.name) &&
      attribute.name.text === "key",
  );
}

function isMapCall(
  node: ts.Node,
): node is ts.CallExpression {
  if (!ts.isCallExpression(node)) {
    return false;
  }

  if (
    !ts.isPropertyAccessExpression(node.expression)
  ) {
    return false;
  }

  return node.expression.name.text === "map";
}

function getCallback(
  node: ts.CallExpression,
): ts.ArrowFunction | ts.FunctionExpression | undefined {
  const callback = node.arguments[0];

  if (callback === undefined) {
    return undefined;
  }

  if (
    ts.isArrowFunction(callback) ||
    ts.isFunctionExpression(callback)
  ) {
    return callback;
  }

  return undefined;
}

function findReturnedJsx(
  callback:
    | ts.ArrowFunction
    | ts.FunctionExpression,
): readonly (
  | ts.JsxElement
  | ts.JsxSelfClosingElement
)[] {
  const results: (
    | ts.JsxElement
    | ts.JsxSelfClosingElement
  )[] = [];

  function addExpression(
    expression: ts.Expression | undefined,
  ): void {
    if (expression === undefined) {
      return;
    }

    if (
      ts.isJsxElement(expression) ||
      ts.isJsxSelfClosingElement(expression)
    ) {
      results.push(expression);
      return;
    }

    if (ts.isParenthesizedExpression(expression)) {
      addExpression(expression.expression);
    }
  }

  if (
    ts.isArrowFunction(callback) &&
    !ts.isBlock(callback.body)
  ) {
    addExpression(callback.body);
    return results;
  }

  const body = callback.body;

  if (!ts.isBlock(body)) {
    return results;
  }

  for (const statement of body.statements) {
    if (!ts.isReturnStatement(statement)) {
      continue;
    }

    addExpression(statement.expression);
  }

  return results;
}
export const noMissingKeyRule: AstRule = {
  meta: {
    id: "react/no-missing-key",

    name: "No missing key",

    description:
      "Detects JSX elements returned from array map callbacks without a key prop.",

    category: "react",

    kind: "ast",

    defaultSeverity: "warning",

    recommended: true,

    fixable: false,
  },

  analyze(context) {
    const diagnostics: Diagnostic[] = [];

    walkAst(context.sourceFile, {
      enter(node) {
        if (!isMapCall(node)) {
          return;
        }

        const callback = getCallback(node);

        if (callback === undefined) {
          return;
        }

        for (const jsxNode of findReturnedJsx(callback)) {
          if (hasKeyProp(jsxNode)) {
            continue;
          }

          diagnostics.push(
            createDiagnostic(
              context.document.filePath,
              jsxNode,
            ),
          );
        }
      },
    });

    return diagnostics;
  },
};
