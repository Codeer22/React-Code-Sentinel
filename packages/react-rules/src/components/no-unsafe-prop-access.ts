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
    isDirectPropsExpression(
      node.expression,
      propsParameter,
      typeChecker,
    )
  ) {
    return node.name.text;
  }

  if (
    ts.isElementAccessExpression(node) &&
    isDirectPropsExpression(
      node.expression,
      propsParameter,
      typeChecker,
    )
  ) {
    const argument =
      node.argumentExpression;

    if (
      argument !== undefined &&
      (ts.isStringLiteral(argument) ||
        ts.isNumericLiteral(argument))
    ) {
      return argument.text;
    }

    return node.getText();
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
      typeChecker,
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
    /*
     * Direct parameter destructuring:
     *
     * function UserCard({ name }: any) {
     *   return <div>{name}</div>;
     * }
     */
    if (
      ts.isObjectBindingPattern(
        propsParameter.name,
      )
    ) {
      const propsType =
        typeChecker.getTypeAtLocation(
          propsParameter,
        );

      const propertyName =
        getDestructuredPropName(
          node,
          propsParameter,
          typeChecker,
        );

      if (
        propertyName !== undefined
      ) {
        const property =
          propsType.getProperty(
            propertyName,
          );

        if (
          property !== undefined
        ) {
          return typeChecker.getTypeOfSymbolAtLocation(
            property,
            node,
          );
        }
      }
    }

    /*
     * Local destructuring:
     *
     * function UserCard(props: any) {
     *   const { name } = props;
     *   return <div>{name}</div>;
     * }
     */
    const symbol =
      typeChecker.getSymbolAtLocation(
        node,
      );

    if (
      symbol !== undefined
    ) {
      const symbolType =
        typeChecker.getTypeOfSymbolAtLocation(
          symbol,
          node,
        );

      if (
        (symbolType.flags &
          ts.TypeFlags.Any) !==
        0 ||
        (symbolType.flags &
          ts.TypeFlags.Unknown) !==
        0
      ) {
        return symbolType;
      }

      for (
        const declaration
        of symbol.declarations ?? []
      ) {
        if (
          !ts.isBindingElement(
            declaration,
          )
        ) {
          continue;
        }

        const bindingPattern =
          declaration.parent;

        if (
          !ts.isObjectBindingPattern(
            bindingPattern,
          )
        ) {
          continue;
        }

        const variableDeclaration =
          bindingPattern.parent;

        if (
          !ts.isVariableDeclaration(
            variableDeclaration,
          )
        ) {
          continue;
        }

        const initializer =
          variableDeclaration.initializer;

        if (
          initializer === undefined
        ) {
          continue;
        }

        const initializerType =
          typeChecker.getTypeAtLocation(
            initializer,
          );

        const propertyName =
          declaration.propertyName !==
            undefined
            ? declaration.propertyName
            : declaration.name;

        if (
          !ts.isIdentifier(
            propertyName,
          )
        ) {
          continue;
        }

        const property =
          initializerType.getProperty(
            propertyName.text,
          );

        if (
          property !== undefined
        ) {
          return typeChecker.getTypeOfSymbolAtLocation(
            property,
            node,
          );
        }

        return initializerType;
      }
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

function isDirectPropsExpression(
  expression: ts.Expression,
  propsParameter:
    ts.ParameterDeclaration,
  typeChecker:
    ts.TypeChecker,
): boolean {
  if (
    !ts.isIdentifier(expression)
  ) {
    return false;
  }

  const targetSymbol =
    typeChecker.getSymbolAtLocation(
      propsParameter.name,
    );

  if (
    targetSymbol === undefined
  ) {
    return false;
  }

  const accessSymbol =
    typeChecker.getSymbolAtLocation(
      expression,
    );

  if (
    accessSymbol === undefined
  ) {
    return false;
  }

  return symbolReferencesProps(
    accessSymbol,
    targetSymbol,
    typeChecker,
    expression,
  );
}

function bindingPatternContainsSymbol(
  pattern: ts.BindingPattern,
  targetSymbol: ts.Symbol,
  typeChecker: ts.TypeChecker,
): boolean {
  for (const element of pattern.elements) {
    if (!ts.isBindingElement(element)) {
      continue;
    }

    if (ts.isIdentifier(element.name)) {
      if (
        typeChecker.getSymbolAtLocation(
          element.name,
        ) === targetSymbol
      ) {
        return true;
      }

      continue;
    }

    if (
      bindingPatternContainsSymbol(
        element.name,
        targetSymbol,
        typeChecker,
      )
    ) {
      return true;
    }
  }

  return false;
}

function getBindingPropertyName(
  pattern: ts.BindingPattern,
  node: ts.Identifier,
  typeChecker: ts.TypeChecker,
): string | undefined {
  for (const element of pattern.elements) {
    if (!ts.isBindingElement(element)) {
      continue;
    }

    if (ts.isIdentifier(element.name)) {
      if (element.name === node) {
        continue;
      }

      const bindingSymbol =
        typeChecker.getSymbolAtLocation(
          element.name,
        );

      if (
        element.name === node ||
        (bindingSymbol !== undefined &&
          bindingSymbol ===
            typeChecker.getSymbolAtLocation(node))
      ) {
        if (
          element.propertyName !== undefined &&
          ts.isIdentifier(element.propertyName)
        ) {
          return element.propertyName.text;
        }

        return element.name.text;
      }

      continue;
    }

    const nestedName =
      getBindingPropertyName(
        element.name,
        node,
        typeChecker,
      );

    if (nestedName !== undefined) {
      return nestedName;
    }
  }

  return undefined;
}

function isDestructuredPropAccess(
  node: ts.Identifier,
  propsParameter:
    ts.ParameterDeclaration,
  typeChecker:
    ts.TypeChecker,
): boolean {
  const nodeSymbol =
    typeChecker.getSymbolAtLocation(
      node,
    );

  if (
    nodeSymbol === undefined
  ) {
    return false;
  }

  /*
   * Case 1:
   *
   * function UserCard({ name }: any) {
   *   return <div>{name}</div>;
   * }
   */
  if (
    ts.isObjectBindingPattern(
      propsParameter.name,
    )
  ) {
    return bindingPatternContainsSymbol(
      propsParameter.name,
      nodeSymbol,
      typeChecker,
    );
  }

  /*
   * Case 2:
   *
   * function UserCard(props: any) {
   *   const { name } = props;
   *   return <div>{name}</div>;
   * }
   */
  if (
    !ts.isIdentifier(
      propsParameter.name,
    )
  ) {
    return false;
  }

  const propsSymbol =
    typeChecker.getSymbolAtLocation(
      propsParameter.name,
    );

  if (
    propsSymbol === undefined
  ) {
    return false;
  }

  for (
    const declaration
    of nodeSymbol.declarations ?? []
  ) {
    if (
      !ts.isBindingElement(
        declaration,
      )
    ) {
      continue;
    }

    const bindingPattern =
      declaration.parent;

    if (
      !ts.isObjectBindingPattern(
        bindingPattern,
      )
    ) {
      continue;
    }

    const variableDeclaration =
      bindingPattern.parent;

    if (
      !ts.isVariableDeclaration(
        variableDeclaration,
      )
    ) {
      continue;
    }

    const initializer =
      variableDeclaration.initializer;

    if (
      initializer === undefined ||
      !ts.isIdentifier(
        initializer,
      )
    ) {
      continue;
    }

    const initializerSymbol =
      typeChecker.getSymbolAtLocation(
        initializer,
      );

    if (
      initializerSymbol !== undefined &&
      symbolReferencesProps(
        initializerSymbol,
        propsSymbol,
        typeChecker,
        node,
      )
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
  typeChecker:
    ts.TypeChecker,
): string | undefined {
  /*
   * Case 1:
   *
   * function UserCard({ name }: any) {
   *   return <div>{name}</div>;
   * }
   */
  if (
    ts.isObjectBindingPattern(
      propsParameter.name,
    )
  ) {
    return getBindingPropertyName(
      propsParameter.name,
      node,
      typeChecker,
    );
  }

  /*
   * Case 2:
   *
   * function UserCard(props: any) {
   *   const { name: alias } = props;
   *   return <div>{alias}</div>;
   * }
   *
   * Resolve the usage through the symbol,
   * but ignore the declaration itself.
   */
  const symbol =
    typeChecker.getSymbolAtLocation(
      node,
    );

  if (
    symbol === undefined
  ) {
    return undefined;
  }

  for (
    const declaration
    of symbol.declarations ?? []
  ) {
    if (
      !ts.isBindingElement(
        declaration,
      )
    ) {
      continue;
    }

    /*
     * Do not report the BindingElement
     * declaration itself.
     */
    if (
      declaration.name === node
    ) {
      return undefined;
    }

    const bindingPattern =
      declaration.parent;

    if (
      !ts.isObjectBindingPattern(
        bindingPattern,
      )
    ) {
      continue;
    }

    const variableDeclaration =
      bindingPattern.parent;

    if (
      !ts.isVariableDeclaration(
        variableDeclaration,
      )
    ) {
      continue;
    }

    const initializer =
      variableDeclaration.initializer;

    if (
      initializer === undefined ||
      !ts.isIdentifier(
        initializer,
      )
    ) {
      continue;
    }

    const initializerSymbol =
      typeChecker.getSymbolAtLocation(
        initializer,
      );

    if (
      initializerSymbol === undefined
    ) {
      continue;
    }

    if (
      !ts.isIdentifier(
        propsParameter.name,
      )
    ) {
      continue;
    }

    const propsSymbol =
      typeChecker.getSymbolAtLocation(
        propsParameter.name,
      );

    if (
      propsSymbol === undefined ||
      !symbolReferencesProps(
        initializerSymbol,
        propsSymbol,
        typeChecker,
        node,
      )
    ) {
      continue;
    }

    const propertyName =
      declaration.propertyName !==
        undefined
        ? declaration.propertyName
        : declaration.name;

    if (
      ts.isIdentifier(
        propertyName,
      )
    ) {
      return propertyName.text;
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

function symbolReferencesProps(
  initializerSymbol: ts.Symbol,
  propsSymbol: ts.Symbol,
  typeChecker: ts.TypeChecker,
  referenceNode?: ts.Node,
) {
  const visited = new Set<ts.Symbol>();

  function references(
    symbol: ts.Symbol,
  ): boolean {
    if (symbol === propsSymbol) {
      return true;
    }

    if (visited.has(symbol)) {
      return false;
    }

    visited.add(symbol);

    for (
      const declaration
      of symbol.declarations ?? []
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

      const referencedSymbol =
        typeChecker.getSymbolAtLocation(
          declaration.initializer,
        );

      if (
        referencedSymbol !== undefined &&
        references(
          referencedSymbol,
        )
      ) {
        return true;
      }
    }

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
          typeChecker.getSymbolAtLocation(
            node.left,
          ) === initializerSymbol
        ) {
          latestAssignment = node;
        }

        ts.forEachChild(node, visit);
      }

      if (scope !== undefined) {
        visit(scope);
      }

      if (
        latestAssignment !== undefined
      ) {
        const assignmentSymbol =
          typeChecker.getSymbolAtLocation(
            latestAssignment.right,
          );

        if (
          assignmentSymbol !== undefined &&
          references(assignmentSymbol)
        ) {
          return true;
        }
      }
    }

    return false;
  }

  return references(
    initializerSymbol,
  );
}
