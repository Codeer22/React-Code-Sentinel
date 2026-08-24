import ts from "@typescript/typescript6";

import type {
  Diagnostic,
} from "@react-code-sentinel/core";

import type {
  SemanticRule,
} from "@react-code-sentinel/analyzers";

import {
  walkAst,
} from "@react-code-sentinel/analyzers";

function createDiagnostic(
  filePath: string,
  node: ts.Node,
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
    ruleId: "react/no-direct-mutation-state",
    severity: "warning",
    category: "react",
    message:
      "Do not directly mutate React component state.",
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
      "Use setState or another supported state update mechanism.",
  };
}

function isMutationOperator(
  kind: ts.SyntaxKind,
): boolean {
  return (
    kind === ts.SyntaxKind.EqualsToken ||
    kind === ts.SyntaxKind.PlusEqualsToken ||
    kind === ts.SyntaxKind.MinusEqualsToken ||
    kind === ts.SyntaxKind.AsteriskEqualsToken ||
    kind === ts.SyntaxKind.SlashEqualsToken ||
    kind === ts.SyntaxKind.PercentEqualsToken ||
    kind === ts.SyntaxKind.AmpersandEqualsToken ||
    kind === ts.SyntaxKind.BarEqualsToken ||
    kind === ts.SyntaxKind.CaretEqualsToken ||
    kind === ts.SyntaxKind.LessThanLessThanEqualsToken ||
    kind === ts.SyntaxKind.GreaterThanGreaterThanEqualsToken ||
    kind ===
      ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken
  );
}

function isUnaryMutation(
  operator: ts.SyntaxKind,
): boolean {
  return (
    operator === ts.SyntaxKind.PlusPlusToken ||
    operator === ts.SyntaxKind.MinusMinusToken
  );
}

function isThisStateProperty(
  node: ts.Node,
  typeChecker: ts.TypeChecker,
): node is ts.PropertyAccessExpression {
  if (!ts.isPropertyAccessExpression(node)) {
    return false;
  }

  if (
    node.expression.kind !==
    ts.SyntaxKind.ThisKeyword
  ) {
    return false;
  }

  if (node.name.text !== "state") {
    return false;
  }

  const symbol =
    typeChecker.getSymbolAtLocation(
      node.name,
    );

  if (symbol === undefined) {
    return true;
  }

  return (
    (symbol.flags &
      (
        ts.SymbolFlags.Property |
        ts.SymbolFlags.Accessor |
        ts.SymbolFlags.GetAccessor |
        ts.SymbolFlags.SetAccessor
      )) !== 0
  );
}

function isStateMutationTarget(
  node: ts.Node,
  typeChecker: ts.TypeChecker,
): boolean {
  if (
    isThisStateProperty(
      node,
      typeChecker,
    )
  ) {
    return true;
  }

  if (
    ts.isPropertyAccessExpression(node)
  ) {
    return isStateMutationTarget(
      node.expression,
      typeChecker,
    );
  }

  if (
    ts.isElementAccessExpression(node)
  ) {
    return isStateMutationTarget(
      node.expression,
      typeChecker,
    );
  }

  return false;
}

function isStateMutationMethodCall(
  node: ts.CallExpression,
  typeChecker: ts.TypeChecker,
): boolean {
  if (
    !ts.isPropertyAccessExpression(
      node.expression,
    )
  ) {
    return false;
  }

  const methodName =
    node.expression.name.text;

  if (
    methodName !== "push" &&
    methodName !== "pop" &&
    methodName !== "shift" &&
    methodName !== "unshift" &&
    methodName !== "splice" &&
    methodName !== "sort" &&
    methodName !== "reverse"
  ) {
    return false;
  }

  return isStateMutationTarget(
    node.expression.expression,
    typeChecker,
  );
}

export const noDirectMutationStateRule:
  SemanticRule = {
  meta: {
    id: "react/no-direct-mutation-state",

    name: "No direct mutation of state",

    description:
      "Detects direct mutation of class component state.",

    category: "react",

    kind: "semantic",

    defaultSeverity: "warning",

    recommended: true,

    fixable: false,
  },

  analyze(context) {
    const diagnostics: Diagnostic[] = [];

    const {
      typeChecker,
    } = context;

    walkAst(context.sourceFile, {
      enter(node) {
        if (
          ts.isBinaryExpression(node) &&
          isMutationOperator(
            node.operatorToken.kind,
          ) &&
          isStateMutationTarget(
            node.left,
            typeChecker,
          )
        ) {
          diagnostics.push(
            createDiagnostic(
              context.document.filePath,
              node.left,
            ),
          );

          return;
        }

        if (
          ts.isPrefixUnaryExpression(node) &&
          isUnaryMutation(node.operator) &&
          isStateMutationTarget(
            node.operand,
            typeChecker,
          )
        ) {
          diagnostics.push(
            createDiagnostic(
              context.document.filePath,
              node.operand,
            ),
          );

          return;
        }

        if (
          ts.isPostfixUnaryExpression(node) &&
          isUnaryMutation(node.operator) &&
          isStateMutationTarget(
            node.operand,
            typeChecker,
          )
        ) {
          diagnostics.push(
            createDiagnostic(
              context.document.filePath,
              node.operand,
            ),
          );

          return;
        }

        if (
          ts.isCallExpression(node) &&
          isStateMutationMethodCall(
            node,
            typeChecker,
          )
        ) {
          diagnostics.push(
            createDiagnostic(
              context.document.filePath,
              node.expression,
            ),
          );
        }
      },
    });

    return diagnostics;
  },
};

