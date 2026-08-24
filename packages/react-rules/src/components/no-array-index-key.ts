import ts from "@typescript/typescript6";

import type {
  Diagnostic,
} from "@react-code-sentinel/core";

import type {
  SemanticRule,
} from "@react-code-sentinel/analyzers";

import {
  getKeyAttribute,
} from "../utils/jsx.js";

import {
  isMapCall,
  getMapCallback,
} from "../utils/maps.js";

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

function referencesIdentifier(
  node: ts.Node,
  identifier: ts.Identifier,
  typeChecker: ts.TypeChecker,
): boolean {
  const targetSymbol =
    typeChecker.getSymbolAtLocation(identifier);

  if (targetSymbol === undefined) {
    return false;
  }

  let found = false;

  function visit(current: ts.Node): void {
    if (found) {
      return;
    }

    if (
      current !== identifier &&
      ts.isIdentifier(current)
    ) {
      const currentSymbol =
        typeChecker.getSymbolAtLocation(current);

      if (currentSymbol === targetSymbol) {
        found = true;
        return;
      }
    }

    ts.forEachChild(current, visit);
  }

  visit(node);

  return found;
}

function getReturnedJsxIncludingNestedClosures(
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

  const visitedFunctions = new Set<ts.Node>();

  function addExpression(
    expression:
      | ts.Expression
      | undefined,
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

    if (
      ts.isParenthesizedExpression(expression)
    ) {
      addExpression(
        expression.expression,
      );
    }
  }

  function visitFunction(
    functionNode:
      | ts.ArrowFunction
      | ts.FunctionExpression,
  ): void {
    if (visitedFunctions.has(functionNode)) {
      return;
    }

    visitedFunctions.add(functionNode);

    if (
      ts.isArrowFunction(functionNode) &&
      !ts.isBlock(functionNode.body)
    ) {
      addExpression(functionNode.body);
      return;
    }

    if (!ts.isBlock(functionNode.body)) {
      return;
    }

    for (
      const statement of
      functionNode.body.statements
    ) {
      visitStatement(statement);
    }
  }

  function visitStatement(
    statement: ts.Statement,
  ): void {
    if (ts.isReturnStatement(statement)) {
      addExpression(statement.expression);

      if (
        statement.expression !==
        undefined
      ) {
        visitExpression(
          statement.expression,
        );
      }

      return;
    }

    if (ts.isVariableStatement(statement)) {
      for (
        const declaration of
        statement.declarationList.declarations
      ) {
        if (
          declaration.initializer !==
          undefined
        ) {
          visitExpression(
            declaration.initializer,
          );
        }
      }

      return;
    }

    if (ts.isBlock(statement)) {
      for (
        const child of
        statement.statements
      ) {
        visitStatement(child);
      }

      return;
    }

    if (ts.isIfStatement(statement)) {
      visitStatement(
        statement.thenStatement,
      );

      if (
        statement.elseStatement !==
        undefined
      ) {
        visitStatement(
          statement.elseStatement,
        );
      }

      return;
    }

    if (ts.isTryStatement(statement)) {
      visitStatement(
        statement.tryBlock,
      );

      if (
        statement.catchClause !==
        undefined
      ) {
        visitStatement(
          statement.catchClause.block,
        );
      }

      if (
        statement.finallyBlock !==
        undefined
      ) {
        visitStatement(
          statement.finallyBlock,
        );
      }

      return;
    }

    if (ts.isSwitchStatement(statement)) {
      for (
        const clause of
        statement.caseBlock.clauses
      ) {
        for (
          const child of
          clause.statements
        ) {
          visitStatement(child);
        }
      }
    }
  }

  function visitExpression(
    expression: ts.Expression,
  ): void {
    if (
      ts.isArrowFunction(expression) ||
      ts.isFunctionExpression(expression)
    ) {
      visitFunction(expression);
      return;
    }

    ts.forEachChild(
      expression,
      (child) => {
        if (ts.isExpression(child)) {
          visitExpression(child);
        }
      },
    );
  }

  visitFunction(callback);

  return results;
}

export const noArrayIndexKeyRule:
  SemanticRule = {
    meta: {
      id: "react/no-array-index-key",

      name: "No array index key",

      description:
        "Detects React keys that use the array index from a map callback.",

      category: "react",

      kind: "semantic",

      defaultSeverity: "warning",

      recommended: true,

      fixable: false,
    },

    analyze(context) {
      const diagnostics: Diagnostic[] = [];

      function visit(node: ts.Node): void {
        if (!isMapCall(node)) {
          ts.forEachChild(
            node,
            visit,
          );

          return;
        }

        const callback =
          getMapCallback(node);

        if (callback === undefined) {
          return;
        }

        const indexParameter =
          getIndexParameter(callback);

        if (indexParameter === undefined) {
          return;
        }

        for (
          const jsxNode of
          getReturnedJsxIncludingNestedClosures(
            callback,
          )
        ) {
          const keyAttribute =
            getKeyAttribute(jsxNode);

          if (keyAttribute === undefined) {
            continue;
          }

          if (
            keyAttribute.initializer ===
            undefined
          ) {
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
              context.typeChecker,
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

        return;
      }

      visit(context.sourceFile);

      return diagnostics;
    },
  };
