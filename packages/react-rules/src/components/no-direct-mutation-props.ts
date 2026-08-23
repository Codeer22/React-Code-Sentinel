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
    ruleId: "react/no-direct-mutation-props",
    severity: "warning",
    category: "react",
    message:
      "Do not directly mutate React component props.",
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
      "Create a new value instead of mutating props.",
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
    kind ===
      ts.SyntaxKind.GreaterThanGreaterThanEqualsToken ||
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

function getParameterName(
  parameter: ts.ParameterDeclaration,
): string | undefined {
  if (ts.isIdentifier(parameter.name)) {
    return parameter.name.text;
  }

  return undefined;
}

function isPropsRoot(
  node: ts.Node,
  propsNames: ReadonlySet<string>,
): boolean {
  return (
    ts.isIdentifier(node) &&
    propsNames.has(node.text)
  );
}

function isPropsMutationTarget(
  node: ts.Node,
  propsNames: ReadonlySet<string>,
): boolean {
  if (ts.isPropertyAccessExpression(node)) {
    return isPropsMutationTarget(
      node.expression,
      propsNames,
    );
  }

  if (ts.isElementAccessExpression(node)) {
    return isPropsMutationTarget(
      node.expression,
      propsNames,
    );
  }

  return isPropsRoot(node, propsNames);
}

function getPropsParameters(
  functionNode:
    | ts.FunctionDeclaration
    | ts.ArrowFunction
    | ts.FunctionExpression,
): ReadonlySet<string> {
  const names = new Set<string>();

  const firstParameter =
    functionNode.parameters[0];

  if (firstParameter === undefined) {
    return names;
  }

  const name = getParameterName(firstParameter);

  if (name !== undefined) {
    names.add(name);
  }

  return names;
}

function isInsideFunction(
  node: ts.Node,
): boolean {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isArrowFunction(node) ||
    ts.isFunctionExpression(node) ||
    ts.isMethodDeclaration(node)
  );
}

export const noDirectMutationPropsRule: AstRule = {
  meta: {
    id: "react/no-direct-mutation-props",

    name: "No direct mutation of props",

    description:
      "Detects direct mutation of React component props.",

    category: "react",

    kind: "ast",

    defaultSeverity: "warning",

    recommended: true,

    fixable: false,
  },

  analyze(context) {
    const diagnostics: Diagnostic[] = [];

    function analyzeFunction(
      functionNode:
        | ts.FunctionDeclaration
        | ts.ArrowFunction
        | ts.FunctionExpression,
    ): void {
      const propsNames =
        getPropsParameters(functionNode);

      if (propsNames.size === 0) {
        return;
      }

      function visit(node: ts.Node): void {
        if (
          node !== functionNode &&
          isInsideFunction(node)
        ) {
          return;
        }

        if (
          ts.isBinaryExpression(node) &&
          isMutationOperator(
            node.operatorToken.kind,
          ) &&
          isPropsMutationTarget(
            node.left,
            propsNames,
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
          isPropsMutationTarget(
            node.operand,
            propsNames,
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
          isPropsMutationTarget(
            node.operand,
            propsNames,
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
          ts.isPropertyAccessExpression(
            node.expression,
          )
        ) {
          const methodName =
            node.expression.name.text;

          if (
            methodName === "push" ||
            methodName === "pop" ||
            methodName === "shift" ||
            methodName === "unshift" ||
            methodName === "splice" ||
            methodName === "sort" ||
            methodName === "reverse"
          ) {
            if (
              isPropsMutationTarget(
                node.expression.expression,
                propsNames,
              )
            ) {
              diagnostics.push(
                createDiagnostic(
                  context.document.filePath,
                  node.expression,
                ),
              );
            }
          }
        }

        ts.forEachChild(node, visit);
      }

      ts.forEachChild(
        functionNode.body ?? functionNode,
        visit,
      );
    }

    walkAst(context.sourceFile, {
      enter(node) {
        if (
          ts.isFunctionDeclaration(node) ||
          ts.isArrowFunction(node) ||
          ts.isFunctionExpression(node)
        ) {
          analyzeFunction(node);
        }
      },
    });

    return diagnostics;
  },
};
