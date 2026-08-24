import ts from "@typescript/typescript6";

import {
  isReactComponentFunction,
} from "../utils/components.js";

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
  const sourceFile =
    node.getSourceFile();

  const start =
    sourceFile.getLineAndCharacterOfPosition(
      node.getStart(sourceFile),
    );

  const end =
    sourceFile.getLineAndCharacterOfPosition(
      node.getEnd(),
    );

  return {
    ruleId:
      "react/no-direct-mutation-props",

    severity:
      "warning",

    category:
      "react",

    message:
      "Do not directly mutate React component props.",

    filePath,

    location: {
      start: {
        line:
          start.line + 1,

        column:
          start.character + 1,
      },

      end: {
        line:
          end.line + 1,

        column:
          end.character + 1,
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
    kind ===
    ts.SyntaxKind.LessThanLessThanEqualsToken ||
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
    operator ===
    ts.SyntaxKind.PlusPlusToken ||
    operator ===
    ts.SyntaxKind.MinusMinusToken
  );
}

function collectBindingNames(
  name: ts.BindingName,
  names: Set<string>,
): void {
  if (ts.isIdentifier(name)) {
    names.add(name.text);
    return;
  }

  if (ts.isObjectBindingPattern(name)) {
    for (const element of name.elements) {
      if (!ts.isBindingElement(element)) {
        continue;
      }

      collectBindingNames(
        element.name,
        names,
      );
    }

    return;
  }

  if (ts.isArrayBindingPattern(name)) {
    for (const element of name.elements) {
      if (!ts.isBindingElement(element)) {
        continue;
      }

      collectBindingNames(
        element.name,
        names,
      );
    }
  }
}

function getParameterBindingNames(
  parameter: ts.ParameterDeclaration,
): ReadonlySet<string> {
  const names = new Set<string>();

  collectBindingNames(
    parameter.name,
    names,
  );

  return names;
}

function getPropsParameter(
  functionNode:
    | ts.FunctionDeclaration
    | ts.ArrowFunction
    | ts.FunctionExpression,
): ts.ParameterDeclaration | undefined {
  return functionNode.parameters[0];
}

function isPropsBinding(
  identifier: ts.Identifier,
  propsParameter: ts.ParameterDeclaration,
  checker: ts.TypeChecker,
): boolean {
  const propsNames =
    getParameterBindingNames(
      propsParameter,
    );

  if (!propsNames.has(identifier.text)) {
    return false;
  }

  const identifierSymbol =
    checker.getSymbolAtLocation(
      identifier,
    );

  if (
    identifierSymbol === undefined
  ) {
    return false;
  }

  const bindingIdentifier =
    ts.isIdentifier(
      propsParameter.name,
    )
      ? propsParameter.name
      : findBindingIdentifier(
        propsParameter.name,
        identifier.text,
      );

  if (
    bindingIdentifier === undefined
  ) {
    return false;
  }

  const parameterSymbol =
    checker.getSymbolAtLocation(
      bindingIdentifier,
    );

  return (
    parameterSymbol !== undefined &&
    parameterSymbol === identifierSymbol
  );
}

function findBindingIdentifier(
  name: ts.BindingName,
  targetName: string,
): ts.Identifier | undefined {
  if (ts.isIdentifier(name)) {
    return name.text === targetName
      ? name
      : undefined;
  }

  if (
    ts.isObjectBindingPattern(name) ||
    ts.isArrayBindingPattern(name)
  ) {
    for (const element of name.elements) {
      if (!ts.isBindingElement(element)) {
        continue;
      }

      const result =
        findBindingIdentifier(
          element.name,
          targetName,
        );

      if (result !== undefined) {
        return result;
      }
    }
  }

  return undefined;
}

function isPropsMutationTarget(
  node: ts.Node,
  propsParameter: ts.ParameterDeclaration,
  checker: ts.TypeChecker,
): boolean {
  if (
    ts.isPropertyAccessExpression(node)
  ) {
    return isPropsMutationTarget(
      node.expression,
      propsParameter,
      checker,
    );
  }

  if (
    ts.isElementAccessExpression(node)
  ) {
    return isPropsMutationTarget(
      node.expression,
      propsParameter,
      checker,
    );
  }

  if (!ts.isIdentifier(node)) {
    return false;
  }

  return isPropsBinding(
    node,
    propsParameter,
    checker,
  );
}

function analyzeMutation(
  node: ts.Node,
  propsParameter: ts.ParameterDeclaration,
  checker: ts.TypeChecker,
  filePath: string,
  diagnostics: Diagnostic[],
): void {
  if (
    ts.isBinaryExpression(node) &&
    isMutationOperator(
      node.operatorToken.kind,
    ) &&
    isPropsMutationTarget(
      node.left,
      propsParameter,
      checker,
    )
  ) {
    diagnostics.push(
      createDiagnostic(
        filePath,
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
      propsParameter,
      checker,
    )
  ) {
    diagnostics.push(
      createDiagnostic(
        filePath,
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
      propsParameter,
      checker,
    )
  ) {
    diagnostics.push(
      createDiagnostic(
        filePath,
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
      methodName !== "push" &&
      methodName !== "pop" &&
      methodName !== "shift" &&
      methodName !== "unshift" &&
      methodName !== "splice" &&
      methodName !== "sort" &&
      methodName !== "reverse"
    ) {
      return;
    }

    if (
      isPropsMutationTarget(
        node.expression.expression,
        propsParameter,
        checker,
      )
    ) {
      diagnostics.push(
        createDiagnostic(
          filePath,
          node.expression,
        ),
      );
    }
  }
}

export const noDirectMutationPropsRule:
  SemanticRule = {
  meta: {
    id:
      "react/no-direct-mutation-props",

    name:
      "No direct mutation of props",

    description:
      "Detects direct mutation of React component props.",

    category:
      "react",

    kind:
      "semantic",

    defaultSeverity:
      "warning",

    recommended:
      true,

    fixable:
      false,
  },

  analyze(context) {
    const diagnostics:
      Diagnostic[] = [];

    const checker =
      context.typeChecker;

    function analyzeComponent(
      functionNode:
        | ts.FunctionDeclaration
        | ts.ArrowFunction
        | ts.FunctionExpression,
    ): void {
      if (
        !isReactComponentFunction(
          functionNode,
        )
      ) {
        return;
      }

      const propsParameter =
        getPropsParameter(
          functionNode,
        );

      if (propsParameter === undefined) {
        return;
      }

      const resolvedPropsParameter =
        propsParameter;

      function visit(
        node: ts.Node,
      ): void {
        analyzeMutation(
          node,
          resolvedPropsParameter,
          checker,
          context.document.filePath,
          diagnostics,
        );

        ts.forEachChild(
          node,
          visit,
        );
      }

      ts.forEachChild(
        functionNode.body ??
        functionNode,
        visit,
      );
    }

    walkAst(
      context.sourceFile,
      {
        enter(node) {
          if (
            ts.isFunctionDeclaration(node) ||
            ts.isArrowFunction(node) ||
            ts.isFunctionExpression(node)
          ) {
            analyzeComponent(node);
          }
        },
      },
    );

    return diagnostics;
  },
};
