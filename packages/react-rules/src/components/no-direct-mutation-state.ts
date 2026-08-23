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

function isStatePropertyAccess(
  node: ts.Node,
): node is ts.PropertyAccessExpression {
  if (!ts.isPropertyAccessExpression(node)) {
    return false;
  }

  return (
    node.expression.kind === ts.SyntaxKind.ThisKeyword &&
    node.name.text === "state"
  );
}

function isStateMutationTarget(
  node: ts.Node,
): boolean {
  if (isStatePropertyAccess(node)) {
    return true;
  }

  if (ts.isPropertyAccessExpression(node)) {
    return isStateMutationTarget(node.expression);
  }

  if (ts.isElementAccessExpression(node)) {
    return isStateMutationTarget(node.expression);
  }

  return false;
}

function isMutationTarget(
  node: ts.Node,
): boolean {
  return isStateMutationTarget(node);
}
function isAssignmentMutation(
  node: ts.BinaryExpression,
): boolean {
  return (
    node.operatorToken.kind ===
      ts.SyntaxKind.EqualsToken ||
    node.operatorToken.kind ===
      ts.SyntaxKind.PlusEqualsToken ||
    node.operatorToken.kind ===
      ts.SyntaxKind.MinusEqualsToken ||
    node.operatorToken.kind ===
      ts.SyntaxKind.AsteriskEqualsToken ||
    node.operatorToken.kind ===
      ts.SyntaxKind.SlashEqualsToken ||
    node.operatorToken.kind ===
      ts.SyntaxKind.PercentEqualsToken ||
    node.operatorToken.kind ===
      ts.SyntaxKind.AmpersandEqualsToken ||
    node.operatorToken.kind ===
      ts.SyntaxKind.BarEqualsToken ||
    node.operatorToken.kind ===
      ts.SyntaxKind.CaretEqualsToken ||
    node.operatorToken.kind ===
      ts.SyntaxKind.LessThanLessThanEqualsToken ||
    node.operatorToken.kind ===
      ts.SyntaxKind.GreaterThanGreaterThanEqualsToken ||
    node.operatorToken.kind ===
      ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken
  );
}
function isPrefixMutation(
  node: ts.PrefixUnaryExpression,
): boolean {
  return (
    node.operator === ts.SyntaxKind.PlusPlusToken ||
    node.operator === ts.SyntaxKind.MinusMinusToken
  );
}

function isPostfixMutation(
  node: ts.PostfixUnaryExpression,
): boolean {
  return (
    node.operator === ts.SyntaxKind.PlusPlusToken ||
    node.operator === ts.SyntaxKind.MinusMinusToken
  );
}

function isStateMutationMethodCall(
  node: ts.CallExpression,
): boolean {
  if (!ts.isPropertyAccessExpression(node.expression)) {
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
  );
}
export const noDirectMutationStateRule: AstRule = {
  meta: {
    id: "react/no-direct-mutation-state",

    name: "No direct mutation of state",

    description:
      "Detects direct mutation of class component state.",

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
        if (
          ts.isBinaryExpression(node) &&
          isAssignmentMutation(node) &&
          isMutationTarget(node.left)
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
          isPrefixMutation(node) &&
          isMutationTarget(node.operand)
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
          isPostfixMutation(node) &&
          isMutationTarget(node.operand)
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
          isStateMutationMethodCall(node)
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

