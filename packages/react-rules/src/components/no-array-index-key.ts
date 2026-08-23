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
  node: ts.JsxAttribute,
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
    ruleId: "react/no-array-index-key",
    severity: "warning",
    category: "react",
    message:
      "Array index is used as a React key.",
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
      "Use a stable identifier instead of the array index.",
  };
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

function getIndexParameter(
  callback:
    | ts.ArrowFunction
    | ts.FunctionExpression,
): ts.Identifier | undefined {
  const parameter = callback.parameters[1];

  if (
    parameter !== undefined &&
    ts.isIdentifier(parameter.name)
  ) {
    return parameter.name;
  }

  return undefined;
}

function getReturnedJsx(
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

function getKeyAttribute(
  node:
    | ts.JsxElement
    | ts.JsxSelfClosingElement,
): ts.JsxAttribute | undefined {
  const attributes =
    ts.isJsxElement(node)
      ? node.openingElement.attributes
      : node.attributes;

  for (const attribute of attributes.properties) {
    if (
      ts.isJsxAttribute(attribute) &&
      ts.isIdentifier(attribute.name) &&
      attribute.name.text === "key"
    ) {
      return attribute;
    }
  }

  return undefined;
}

function referencesIdentifier(
  node: ts.Node,
  identifier: ts.Identifier,
): boolean {
  let found = false;

  function visit(current: ts.Node): void {
    if (found) {
      return;
    }

    if (
      current !== identifier &&
      ts.isIdentifier(current) &&
      current.text === identifier.text
    ) {
      found = true;
      return;
    }

    ts.forEachChild(current, visit);
  }

  visit(node);

  return found;
}

export const noArrayIndexKeyRule: AstRule = {
  meta: {
    id: "react/no-array-index-key",

    name: "No array index key",

    description:
      "Detects React keys that use the array index from a map callback.",

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

        const indexParameter =
          getIndexParameter(callback);

        if (indexParameter === undefined) {
          return;
        }

        for (const jsxNode of getReturnedJsx(callback)) {
          const keyAttribute =
            getKeyAttribute(jsxNode);

          if (keyAttribute === undefined) {
            continue;
          }

          if (keyAttribute.initializer === undefined) {
            continue;
          }

          if (
            !ts.isJsxExpression(
              keyAttribute.initializer,
            )
          ) {
            continue;
          }

          const expression =
            keyAttribute.initializer.expression;

          if (expression === undefined) {
            continue;
          }

          if (
            referencesIdentifier(
              expression,
              indexParameter,
            )
          ) {
            diagnostics.push(
              createDiagnostic(
                context.document.filePath,
                keyAttribute,
              ),
            );
          }
        }
      },
    });

    return diagnostics;
  },
};
