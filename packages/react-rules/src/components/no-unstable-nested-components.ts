import ts from "@typescript/typescript6";

import type {
  Diagnostic,
} from "@react-code-sentinel/core";

import type {
  SemanticRule,
} from "@react-code-sentinel/analyzers";

import {
  getReactComponentInfo,
  isReactComponentFunction,
} from "../semantic/component-info.js";

import {
  containsJsx,
} from "../utils/jsx.js";

function createDiagnostic(
  context: Parameters<
    SemanticRule["analyze"]
  >[0],
  node: ts.Node,
  componentName: string,
): Diagnostic {
  const sourceFile =
    context.sourceFile;

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
      "react/no-unstable-nested-components",

    severity:
      "warning",

    category:
      "react",

    message:
      `Component "${componentName}" is defined inside another component. ` +
      "Move it to module scope to avoid recreating its component identity during renders.",

    filePath:
      context.document.filePath,

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
      `Move "${componentName}" outside the parent component.`,
  };
}

function isFunctionNode(
  node: ts.Node,
): node is
  | ts.FunctionDeclaration
  | ts.FunctionExpression
  | ts.ArrowFunction {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node)
  );
}

function findContainingComponent(
  node: ts.Node,
) {
  let current:
    | ts.Node
    | undefined =
    node.parent;

  while (
    current !== undefined
  ) {
    if (
      isReactComponentFunction(
        current,
      )
    ) {
      const component =
        getReactComponentInfo(
          current,
        );

      if (
        component !== undefined
      ) {
        return component;
      }
    }

    current =
      current.parent;
  }

  return undefined;
}

function getFunctionIdentifier(
  node:
    | ts.FunctionDeclaration
    | ts.FunctionExpression
    | ts.ArrowFunction,
): ts.Identifier | undefined {
  if (ts.isFunctionDeclaration(node)) {
    return node.name;
  }

  if (
    ts.isVariableDeclaration(node.parent) &&
    ts.isIdentifier(node.parent.name)
  ) {
    return node.parent.name;
  }

  if (
    ts.isPropertyAssignment(node.parent) &&
    ts.isIdentifier(node.parent.name)
  ) {
    return node.parent.name;
  }

  return undefined;
}

function isComponentJsxTag(
  tagName: ts.JsxTagNameExpression,
  componentName: string,
  componentSymbol:
    | ts.Symbol
    | undefined,
  checker: ts.TypeChecker,
): boolean {
  if (
    !ts.isIdentifier(tagName) &&
    !ts.isPropertyAccessExpression(tagName)
  ) {
    return false;
  }

  if (componentSymbol === undefined) {
    return (
      (ts.isIdentifier(tagName)
        ? tagName.text
        : tagName.name.text) === componentName
    );
  }

  if (
    ts.isPropertyAccessExpression(tagName) &&
    tagName.name.text === componentName
  ) {
    return true;
  }

  const tagSymbol =
    checker.getSymbolAtLocation(
      ts.isPropertyAccessExpression(tagName)
        ? tagName.name
        : tagName,
    );

  return (
    tagSymbol !== undefined &&
    symbolReferencesComponent(
      tagSymbol,
      componentSymbol,
      checker,
      new Set<ts.Symbol>(),
      tagName,
    )
  );
}

function symbolReferencesComponent(
  symbol: ts.Symbol,
  componentSymbol: ts.Symbol,
  checker: ts.TypeChecker,
  visited = new Set<ts.Symbol>(),
  referenceNode?: ts.Node,
): boolean {
  if (symbol === componentSymbol) {
    return true;
  }

  if (visited.has(symbol)) {
    return false;
  }

  visited.add(symbol);

  if (referenceNode !== undefined) {
    const referenceStart =
      referenceNode.getStart();

    let scope:
      | ts.Node
      | undefined =
      referenceNode.parent;

    while (
      scope !== undefined &&
      !ts.isFunctionLike(scope) &&
      !ts.isSourceFile(scope)
    ) {
      scope = scope.parent;
    }

    let latestAssignment:
      | ts.BinaryExpression
      | undefined;

    function visit(
      node: ts.Node,
    ): void {
      if (
        node !== scope &&
        ts.isFunctionLike(node)
      ) {
        return;
      }

      if (
        node.getStart() <
          referenceStart &&
        ts.isBinaryExpression(node) &&
        node.operatorToken.kind ===
          ts.SyntaxKind.EqualsToken &&
        ts.isIdentifier(node.left) &&
        checker.getSymbolAtLocation(node.left) ===
          symbol
      ) {
        latestAssignment = node;
      }

      ts.forEachChild(node, visit);
    }

    if (scope !== undefined) {
      visit(scope);
    }

    if (latestAssignment !== undefined) {
      const assignmentSymbol =
        checker.getSymbolAtLocation(
          latestAssignment.right,
        );

      return (
        assignmentSymbol !== undefined &&
        symbolReferencesComponent(
          assignmentSymbol,
          componentSymbol,
          checker,
          visited,
          referenceNode,
        )
      );
    }
  }

  for (
    const declaration of
      symbol.declarations ?? []
  ) {
    if (
      !ts.isVariableDeclaration(
        declaration,
      ) ||
      declaration.initializer === undefined ||
      !ts.isIdentifier(
        declaration.initializer,
      )
    ) {
      continue;
    }

    const initializerSymbol =
      checker.getSymbolAtLocation(
        declaration.initializer,
      );

    if (
      initializerSymbol !== undefined &&
      symbolReferencesComponent(
        initializerSymbol,
        componentSymbol,
        checker,
        visited,
        referenceNode,
      )
    ) {
      return true;
    }
  }

  return false;
}

function isUsedAsJsxComponent(
  scope: ts.Node,
  component:
    NonNullable<
      ReturnType<typeof getReactComponentInfo>
    >,
  checker: ts.TypeChecker,
): boolean {
  const identifier =
    getFunctionIdentifier(
      component.functionNode,
    );

  const componentSymbol =
    identifier === undefined
      ? undefined
      : checker.getSymbolAtLocation(
          identifier,
        );

  let found = false;

  function visit(node: ts.Node): void {
    if (found) {
      return;
    }

    if (
      ts.isJsxSelfClosingElement(node) &&
      isComponentJsxTag(
        node.tagName,
        component.name,
        componentSymbol,
        checker,
      )
    ) {
      found = true;
      return;
    }

    if (
      ts.isJsxOpeningElement(node) &&
      isComponentJsxTag(
        node.tagName,
        component.name,
        componentSymbol,
        checker,
      )
    ) {
      found = true;
      return;
    }

    ts.forEachChild(
      node,
      visit,
    );
  }

  visit(scope);

  return found;
}

export const noUnstableNestedComponentsRule:
  SemanticRule = {
    meta: {
      id:
        "react/no-unstable-nested-components",

      name:
        "No unstable nested components",

      description:
        "Detects React components declared inside other React components.",

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

    analyze(
      context,
    ): readonly Diagnostic[] {
      const diagnostics:
        Diagnostic[] = [];

      function visit(
        node: ts.Node,
      ): void {
        if (
          !isFunctionNode(node)
        ) {
          ts.forEachChild(
            node,
            visit,
          );

          return;
        }

        const component =
          getReactComponentInfo(
            node,
          );

        if (
          component !== undefined &&
          containsJsx(node)
        ) {
          const parentComponent =
            findContainingComponent(
              node,
            );

          if (
            parentComponent !==
              undefined &&
            isUsedAsJsxComponent(
              parentComponent.functionNode,
              component,
              context.typeChecker,
            )
          ) {
            diagnostics.push(
              createDiagnostic(
                context,
                node,
                component.name,
              ),
            );
          }
        }

        ts.forEachChild(
          node,
          visit,
        );
      }

      visit(
        context.sourceFile,
      );

      return diagnostics;
    },
  };
