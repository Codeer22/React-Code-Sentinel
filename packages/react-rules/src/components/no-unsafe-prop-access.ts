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

export const noUnsafePropAccessRule:
  SemanticRule = {
    meta: {
      id:
        "react/no-unsafe-prop-access",

      name:
        "No unsafe prop access",

      description:
        "Detects React component prop accesses that resolve to any or unknown.",

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
        const component =
          findContainingComponent(
            node,
          );

        if (
          component !== undefined &&
          component.propsParameter !==
            undefined
        ) {
          const propertyName =
            getUnsafePropName(
              node,
              component.propsParameter,
              context.typeChecker,
            );

          if (
            propertyName !== undefined
          ) {
            const propertyType =
              getUnsafePropType(
                node,
                component.propsParameter,
                context.typeChecker,
              );

            if (
              isUnsafeType(
                propertyType,
              )
            ) {
              diagnostics.push(
                createDiagnostic(
                  context,
                  node,
                  component.name,
                  propertyName,
                ),
              );
            }
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

function getUnsafePropName(
  node: ts.Node,
  propsParameter:
    ts.ParameterDeclaration,
  typeChecker:
    ts.TypeChecker,
): string | undefined {
  if (
    ts.isPropertyAccessExpression(
      node,
    ) &&
    isDirectPropsAccess(
      node,
      propsParameter,
      typeChecker,
    )
  ) {
    return node.name.text;
  }

  if (
    ts.isIdentifier(node) &&
    isDestructuredPropAccess(
      node,
      propsParameter,
      typeChecker,
    )
  ) {
    return getDestructuredPropName(
      node,
      propsParameter,
    );
  }

  return undefined;
}

function getUnsafePropType(
  node: ts.Node,
  propsParameter:
    ts.ParameterDeclaration,
  typeChecker:
    ts.TypeChecker,
): ts.Type {
  if (
    ts.isPropertyAccessExpression(
      node,
    )
  ) {
    return typeChecker.getTypeAtLocation(
      node,
    );
  }

  if (
    ts.isIdentifier(node) &&
    isDestructuredPropAccess(
      node,
      propsParameter,
      typeChecker,
    )
  ) {
    const symbol =
      typeChecker.getSymbolAtLocation(
        node,
      );

    if (
      symbol !== undefined
    ) {
      return typeChecker.getTypeOfSymbolAtLocation(
        symbol,
        node,
      );
    }
  }

  return typeChecker.getTypeAtLocation(
    node,
  );
}

function isUnsafeType(
  type: ts.Type,
): boolean {
  return (
    (type.flags &
      ts.TypeFlags.Any) !==
      0 ||
    (type.flags &
      ts.TypeFlags.Unknown) !==
      0
  );
}

function isDirectPropsAccess(
  node: ts.PropertyAccessExpression,
  propsParameter:
    ts.ParameterDeclaration,
  typeChecker:
    ts.TypeChecker,
): boolean {
  if (
    !ts.isIdentifier(
      node.expression,
    )
  ) {
    return false;
  }

  const accessSymbol =
    typeChecker.getSymbolAtLocation(
      node.expression,
    );

  const parameterSymbol =
    typeChecker.getSymbolAtLocation(
      propsParameter.name,
    );

  if (
    accessSymbol === undefined ||
    parameterSymbol === undefined
  ) {
    return false;
  }

  return (
    accessSymbol === parameterSymbol
  );
}

function isDestructuredPropAccess(
  node: ts.Identifier,
  propsParameter:
    ts.ParameterDeclaration,
  typeChecker:
    ts.TypeChecker,
): boolean {
  if (
    !ts.isObjectBindingPattern(
      propsParameter.name,
    )
  ) {
    return false;
  }

  const symbol =
    typeChecker.getSymbolAtLocation(
      node,
    );

  if (
    symbol === undefined
  ) {
    return false;
  }

  for (
    const element
      of propsParameter.name.elements
  ) {
    if (
      !ts.isBindingElement(
        element,
      )
    ) {
      continue;
    }

    const bindingSymbol =
      typeChecker.getSymbolAtLocation(
        element.name,
      );

    if (
      bindingSymbol === symbol
    ) {
      return true;
    }
  }

  return false;
}

function getDestructuredPropName(
  node: ts.Identifier,
  propsParameter:
    ts.ParameterDeclaration,
): string | undefined {
  if (
    !ts.isObjectBindingPattern(
      propsParameter.name,
    )
  ) {
    return undefined;
  }

  for (
    const element
      of propsParameter.name.elements
  ) {
    if (
      !ts.isBindingElement(
        element,
      )
    ) {
      continue;
    }

    if (
      element.name ===
      node
    ) {
      const propertyName =
        element.propertyName;

      if (
        propertyName !== undefined &&
        ts.isIdentifier(
          propertyName,
        )
      ) {
        return propertyName.text;
      }

      return node.text;
    }
  }

  return undefined;
}

function createDiagnostic(
  context:
    Parameters<
      SemanticRule["analyze"]
    >[0],
  node: ts.Node,
  componentName: string,
  propertyName: string,
): Diagnostic {
  const start =
    context.sourceFile
      .getLineAndCharacterOfPosition(
        node.getStart(
          context.sourceFile,
        ),
      );

  const end =
    context.sourceFile
      .getLineAndCharacterOfPosition(
        node.getEnd(),
      );

  return {
    ruleId:
      "react/no-unsafe-prop-access",

    severity:
      "warning",

    category:
      "react",

    message:
      `React component "${componentName}" accesses prop "${propertyName}" with an unsafe type.`,

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
  };
}
