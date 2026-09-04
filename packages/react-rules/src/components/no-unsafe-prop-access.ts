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

function isAssignmentOperator(
  kind: ts.SyntaxKind,
): boolean {
  switch (kind) {
    case ts.SyntaxKind.EqualsToken:
    case ts.SyntaxKind.PlusEqualsToken:
    case ts.SyntaxKind.MinusEqualsToken:
    case ts.SyntaxKind.AsteriskEqualsToken:
    case ts.SyntaxKind.SlashEqualsToken:
    case ts.SyntaxKind.PercentEqualsToken:
    case ts.SyntaxKind.AsteriskAsteriskEqualsToken:
    case ts.SyntaxKind.LessThanLessThanEqualsToken:
    case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
    case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
    case ts.SyntaxKind.AmpersandEqualsToken:
    case ts.SyntaxKind.BarEqualsToken:
    case ts.SyntaxKind.CaretEqualsToken:
    case ts.SyntaxKind.AmpersandAmpersandEqualsToken:
    case ts.SyntaxKind.BarBarEqualsToken:
    case ts.SyntaxKind.QuestionQuestionEqualsToken:
      return true;

    default:
      return false;
  }
}

function isUnconditionalReassignmentOperator(
  kind: ts.SyntaxKind,
): boolean {
  switch (kind) {
    case ts.SyntaxKind.EqualsToken:
    case ts.SyntaxKind.PlusEqualsToken:
    case ts.SyntaxKind.MinusEqualsToken:
    case ts.SyntaxKind.AsteriskEqualsToken:
    case ts.SyntaxKind.SlashEqualsToken:
    case ts.SyntaxKind.PercentEqualsToken:
    case ts.SyntaxKind.AsteriskAsteriskEqualsToken:
    case ts.SyntaxKind.LessThanLessThanEqualsToken:
    case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
    case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
    case ts.SyntaxKind.AmpersandEqualsToken:
    case ts.SyntaxKind.BarEqualsToken:
    case ts.SyntaxKind.CaretEqualsToken:
      return true;

    default:
      return false;
  }
}

function isWithin(
  node: ts.Node,
  container: ts.Node,
): boolean {
  let current:
    | ts.Node
    | undefined =
    node.parent;

  while (
    current !== undefined
  ) {
    if (
      current === container
    ) {
      return true;
    }

    current =
      current.parent;
  }

  return false;
}

function isSymbolReassignedBefore(
  node: ts.Node,
  typeChecker: ts.TypeChecker,
): boolean {
  const symbol =
    typeChecker.getSymbolAtLocation(
      node,
    );

  if (
    symbol === undefined
  ) {
    return false;
  }

  let scope:
    | ts.Node
    | undefined =
    node.parent;

  while (
    scope !== undefined &&
    !ts.isFunctionLike(scope) &&
    !ts.isSourceFile(scope)
  ) {
    scope =
      scope.parent;
  }

  if (
    scope === undefined
  ) {
    return false;
  }

  function statementDefinitelyAssignsSymbol(
    statement: ts.Statement,
  ): boolean {
    if (
      ts.isExpressionStatement(statement) &&
      ts.isBinaryExpression(statement.expression) &&
      statement.expression.operatorToken.kind ===
      ts.SyntaxKind.EqualsToken &&
      ts.isIdentifier(statement.expression.left)
    ) {
      const assignedSymbol =
        typeChecker.getSymbolAtLocation(
          statement.expression.left,
        );

      return (
        assignedSymbol === symbol
      );
    }

    if (
      ts.isBlock(statement)
    ) {
      /*
       * A sequence of statements definitely assigns
       * the symbol if one of the statements is an
       * unconditional assignment and nothing can
       * bypass it.
       *
       * For our current use, an explicit assignment
       * statement in the block is sufficient.
       */
      for (
        const child
        of statement.statements
      ) {
        if (
          statementDefinitelyAssignsSymbol(
            child,
          )
        ) {
          return true;
        }
      }

      return false;
    }

    if (
      ts.isIfStatement(statement)
    ) {
      if (
        statement.elseStatement ===
        undefined
      ) {
        return false;
      }

      return (
        statementDefinitelyAssignsSymbol(
          statement.thenStatement,
        ) &&
        statementDefinitelyAssignsSymbol(
          statement.elseStatement,
        )
      );
    }

    return false;
  }

  function isConditionalAssignment(
    assignment: ts.Node,
  ): boolean {
    let current:
      | ts.Node
      | undefined =
      assignment.parent;

    while (
      current !== undefined &&
      current !== scope
    ) {
      if (
        ts.isIfStatement(current)
      ) {
        /*
         * If both branches definitely assign the
         * symbol, the original value is gone.
         */
        if (
          current.elseStatement !==
          undefined &&
          statementDefinitelyAssignsSymbol(
            current,
          )
        ) {
          return false;
        }

        return true;
      }

      if (
        ts.isWhileStatement(current) ||
        ts.isForStatement(current) ||
        ts.isForInStatement(current) ||
        ts.isForOfStatement(current)
      ) {
        return true;
      }

      if (
        ts.isSwitchStatement(current) ||
        ts.isCaseClause(current) ||
        ts.isDefaultClause(current) ||
        ts.isConditionalExpression(current)
      ) {
        return true;
      }

      if (
        ts.isTryStatement(current)
      ) {
        /*
         * An assignment inside a try block may not
         * execute. It is only a definite reassignment
         * if a finally block also reassigns the symbol.
         */
        if (
          current.tryBlock !== undefined &&
          isWithin(assignment, current.tryBlock)
        ) {
          if (
            current.finallyBlock !== undefined &&
            statementDefinitelyAssignsSymbol(
              current.finallyBlock,
            )
          ) {
            return false;
          }
          return true;
        }

        if (
          current.catchClause !== undefined &&
          isWithin(
            assignment,
            current.catchClause.block,
          )
        ) {
          return true;
        }

        /*
         * In the finally block, the assignment always
         * executes.
         */
        return false;
      }

      /*
       * A do/while body executes at least once,
       * so an assignment before the access can
       * invalidate the original value.
       */
      if (
        ts.isDoStatement(current)
      ) {
        current =
          current.parent;
        continue;
      }

      if (
        ts.isFunctionLike(current)
      ) {
        return true;
      }

      current =
        current.parent;
    }

    return false;
  }

  let reassigned = false;

  function visit(
    current: ts.Node,
  ): void {
    /*
     * Do not inspect nested functions. Their local
     * assignments must not affect this symbol.
     */
    if (
      current !== scope &&
      ts.isFunctionLike(current)
    ) {
      return;
    }

    /*
     * Only statements before this exact reference
     * can affect it.
     */
    if (
      current.getStart() >=
      node.getStart()
    ) {
      return;
    }

    if (
      ts.isBinaryExpression(current) &&
      ts.isIdentifier(current.left) &&
      isUnconditionalReassignmentOperator(
        current.operatorToken.kind,
      )
    ) {
      const leftSymbol =
        typeChecker.getSymbolAtLocation(
          current.left,
        );

      if (
        leftSymbol === symbol
      ) {
        /*
         * A conditional assignment does not prove
         * that the original props value disappeared.
         */
        if (
          isConditionalAssignment(
            current,
          )
        ) {
          return;
        }

        reassigned = true;
        return;
      }
    }

    /*
     * Handle an if/else where every branch replaces
     * the symbol.
     */
    if (
      ts.isIfStatement(current) &&
      current.getStart() <
      node.getStart() &&
      current.elseStatement !==
      undefined &&
      statementDefinitelyAssignsSymbol(
        current,
      )
    ) {
      reassigned = true;
      return;
    }

    ts.forEachChild(
      current,
      visit,
    );
  }

  visit(scope);

  return reassigned;
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
      (
        ts.isStringLiteral(argument) ||
        ts.isNumericLiteral(argument)
      )
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
    /*
     * An identifier used as the left-hand side
     * of an assignment is a write, not a prop
     * access.
     */
    if (
      ts.isBinaryExpression(node.parent) &&
      node.parent.left === node &&
      isAssignmentOperator(
        node.parent.operatorToken.kind,
      )
    ) {
      return undefined;
    }

    /*
     * If this destructured binding has already
     * been reassigned before the current read,
     * the current value no longer comes from props.
     */
    if (
      isSymbolReassignedBefore(
        node,
        typeChecker,
      )
    ) {
      return undefined;
    }

    const symbol =
      typeChecker.getSymbolAtLocation(
        node,
      );

    if (
      symbol === undefined
    ) {
      return undefined;
    }

    /*
     * The identifier in the binding declaration
     * itself is not a prop access.
     */
    for (
      const declaration
      of symbol.declarations ?? []
    ) {
      if (
        ts.isBindingElement(
          declaration,
        ) &&
        declaration.name === node
      ) {
        return undefined;
      }
    }

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
    ts.isElementAccessExpression(node)
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
     *
     * Also supports nested destructuring:
     *
     * const {
     *   user: {
     *     name,
     *   },
     * } = props;
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
          getContainingVariableDeclaration(
            bindingPattern,
          );

        if (
          variableDeclaration ===
          undefined
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

        /*
         * If the whole initializer is any or
         * unknown, the destructured binding is
         * unsafe as well.
         */
        if (
          (initializerType.flags &
            ts.TypeFlags.Any) !==
          0 ||
          (initializerType.flags &
            ts.TypeFlags.Unknown) !==
          0
        ) {
          return initializerType;
        }

        const propertyName =
          declaration.propertyName !==
            undefined
            ? declaration.propertyName
            : declaration.name;

        /*
         * Nested destructuring may have another
         * BindingElement as its property name.
         * The final property is handled by
         * getDestructuredPropName().
         */
        if (
          ts.isIdentifier(
            propertyName,
          )
        ) {
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
  for (
    const element of pattern.elements
  ) {
    if (
      !ts.isBindingElement(element)
    ) {
      continue;
    }

    if (
      ts.isIdentifier(element.name)
    ) {
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
  for (
    const element of pattern.elements
  ) {
    if (
      !ts.isBindingElement(element)
    ) {
      continue;
    }

    if (
      ts.isIdentifier(element.name)
    ) {
      const bindingSymbol =
        typeChecker.getSymbolAtLocation(
          element.name,
        );

      if (
        element.name === node ||
        (
          bindingSymbol !== undefined &&
          bindingSymbol ===
          typeChecker.getSymbolAtLocation(
            node,
          )
        )
      ) {
        if (
          element.propertyName !==
          undefined &&
          ts.isIdentifier(
            element.propertyName,
          )
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

    if (
      nestedName !== undefined
    ) {
      return nestedName;
    }
  }

  return undefined;
}

function getContainingVariableDeclaration(
  bindingPattern: ts.BindingPattern,
): ts.VariableDeclaration | undefined {
  let current:
    | ts.Node
    | undefined =
    bindingPattern;

  while (
    current !== undefined
  ) {
    if (
      ts.isVariableDeclaration(current)
    ) {
      return current;
    }

    if (
      ts.isBindingElement(current)
    ) {
      current =
        current.parent;
      continue;
    }

    if (
      ts.isObjectBindingPattern(current) ||
      ts.isArrayBindingPattern(current)
    ) {
      current =
        current.parent;
      continue;
    }

    current =
      current.parent;
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
   *
   * Also supports:
   *
   * const {
   *   user: {
   *     name,
   *   },
   * } = props;
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

    /*
     * The declaration can be nested inside
     * multiple BindingElement / BindingPattern
     * nodes. Walk all the way to the containing
     * VariableDeclaration.
     */
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
      getContainingVariableDeclaration(
        bindingPattern,
      );

    if (
      variableDeclaration ===
      undefined
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
      initializerSymbol !==
      undefined &&
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
   * Local destructuring:
   *
   * function UserCard(props: any) {
   *   const { name: alias } = props;
   *   return <div>{alias}</div>;
   * }
   *
   * Also supports nested destructuring:
   *
   * function UserCard(props: any) {
   *   const {
   *     user: {
   *       name: displayName,
   *     },
   *   } = props;
   *
   *   return <div>{displayName}</div>;
   * }
   */
  if (
    !ts.isIdentifier(
      propsParameter.name,
    )
  ) {
    return undefined;
  }

  const propsSymbol =
    typeChecker.getSymbolAtLocation(
      propsParameter.name,
    );

  if (
    propsSymbol === undefined
  ) {
    return undefined;
  }

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
      getContainingVariableDeclaration(
        bindingPattern,
      );

    if (
      variableDeclaration ===
      undefined
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
      initializerSymbol ===
      undefined
    ) {
      continue;
    }

    if (
      !symbolReferencesProps(
        initializerSymbol,
        propsSymbol,
        typeChecker,
        node,
      )
    ) {
      continue;
    }

    /*
     * For a normal renamed binding:
     *
     *   const { name: alias } = props;
     *
     * the property name is `name`.
     */
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

    /*
     * For nested destructuring, recursively
     * resolve the complete binding path.
     */
    if (
      ts.isObjectBindingPattern(
        propertyName
      )
    ) {
      const nestedName =
        getBindingPropertyName(
          propertyName,
          node,
          typeChecker,
        );

      if (
        nestedName !== undefined
      ) {
        return nestedName;
      }
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
): boolean {
  /*
   * Track symbols together with their reference
   * position. A symbol can have different values
   * at different locations because of reassignment.
   */
  const visited =
    new Set<string>();

  function getSymbolKey(
    symbol: ts.Symbol,
  ): string {
    const declaration =
      symbol.declarations?.[0];

    if (
      declaration !== undefined
    ) {
      return [
        symbol.getName(),
        declaration
          .getSourceFile()
          .fileName,
        declaration.getStart(),
      ].join(":");
    }

    return symbol.getName();
  }

  function findScope(
    node: ts.Node,
  ):
    | ts.Node
    | undefined {
    let scope:
      | ts.Node
      | undefined =
      node.parent;

    while (
      scope !== undefined &&
      !ts.isFunctionLike(scope) &&
      !ts.isSourceFile(scope)
    ) {
      scope = scope.parent;
    }

    return scope;
  }

  function statementDefinitelyAssignsSymbol(
    statement: ts.Statement,
    symbol: ts.Symbol,
  ): boolean {
    if (
      ts.isExpressionStatement(
        statement,
      ) &&
      ts.isBinaryExpression(
        statement.expression,
      ) &&
      statement.expression.operatorToken.kind ===
      ts.SyntaxKind.EqualsToken &&
      ts.isIdentifier(
        statement.expression.left,
      )
    ) {
      const assignedSymbol =
        typeChecker.getSymbolAtLocation(
          statement.expression.left,
        );

      return (
        assignedSymbol === symbol
      );
    }

    if (
      ts.isBlock(statement)
    ) {
      return statement.statements.some(
        (child) =>
          statementDefinitelyAssignsSymbol(
            child,
            symbol,
          ),
      );
    }

    if (
      ts.isIfStatement(statement)
    ) {
      if (
        statement.elseStatement ===
        undefined
      ) {
        return false;
      }

      return (
        statementDefinitelyAssignsSymbol(
          statement.thenStatement,
          symbol,
        ) &&
        statementDefinitelyAssignsSymbol(
          statement.elseStatement,
          symbol,
        )
      );
    }

    return false;
  }

  function isConditionallyExecuted(
    node: ts.Node,
    symbol: ts.Symbol,
  ): boolean {
    let current:
      | ts.Node
      | undefined =
      node.parent;

    while (
      current !== undefined
    ) {
      if (
        ts.isIfStatement(current)
      ) {
        /*
         * An if/else whose both branches
         * definitely assign this symbol does
         * not leave the previous value reachable.
         */
        if (
          current.elseStatement !==
          undefined &&
          statementDefinitelyAssignsSymbol(
            current,
            symbol,
          )
        ) {
          return false;
        }

        return true;
      }

      if (
        ts.isDoStatement(current)
      ) {
        return false;
      }

      if (
        ts.isWhileStatement(current) ||
        ts.isForStatement(current) ||
        ts.isForInStatement(current) ||
        ts.isForOfStatement(current)
      ) {
        return true;
      }

      if (
        ts.isConditionalExpression(
          current,
        ) ||
        ts.isSwitchStatement(current) ||
        ts.isCaseClause(current) ||
        ts.isDefaultClause(current)
      ) {
        return true;
      }

      if (
        ts.isTryStatement(current)
      ) {
        /*
         * An assignment inside a try block may not
         * execute. It is only a definite reassignment
         * if a finally block also reassigns the symbol.
         */
        if (
          current.tryBlock !== undefined &&
          isWithin(node, current.tryBlock)
        ) {
          if (
            current.finallyBlock !== undefined &&
            statementDefinitelyAssignsSymbol(
              current.finallyBlock,
              symbol,
            )
          ) {
            return false;
          }
          return true;
        }

        if (
          current.catchClause !== undefined &&
          isWithin(
            node,
            current.catchClause.block,
          )
        ) {
          return true;
        }

        /*
         * In the finally block, the assignment always
         * executes.
         */
        return false;
      }

      if (
        ts.isFunctionLike(current)
      ) {
        return false;
      }

      current =
        current.parent;
    }

    return false;
  }

  function resolve(
    symbol: ts.Symbol,
    useNode: ts.Node,
  ): boolean {
    /*
     * The actual props parameter is always
     * a valid props source.
     */
    if (
      symbol === propsSymbol
    ) {
      /*
       * The props parameter normally represents the
       * component's incoming props. However, if the
       * parameter has been reassigned before this
       * reference, the current value no longer
       * necessarily comes from the incoming props.
       */
      if (
        isSymbolReassignedBefore(
          useNode,
          typeChecker,
        )
      ) {
        return false;
      }

      return true;
    }

    const referenceStart =
      useNode.getStart();

    const key =
      `${getSymbolKey(symbol)}:${referenceStart}`;

    if (
      visited.has(key)
    ) {
      return false;
    }

    visited.add(key);

    /*
 * Track the alias from the scope where it was
 * declared, not the scope where it happens to
 * be read.
 *
 * This matters for captured aliases:
 *
 *   let p = props;
 *   p = localObject;
 *
 *   function render() {
 *     return p.name;
 *   }
 *
 * The read is inside render(), but the value of
 * p is controlled by the outer scope.
 */
    const declaration =
      initializerSymbol.declarations?.[0];

    const scope =
      declaration !== undefined
        ? findScope(declaration)
        : findScope(useNode);

    if (
      scope === undefined
    ) {
      return false;
    }

    /*
     * Track every value that may reach the
     * current reference.
     */
    const possibleValues:
      ts.Expression[] = [];

    function addPossibleValue(
      value: ts.Expression,
    ): void {
      possibleValues.push(value);
    }

    /*
     * Find the variable initializer.
     *
     * Example:
     *
     *   let currentProps = props;
     */
    for (
      const declaration of
      symbol.declarations ?? []
    ) {
      if (
        ts.isVariableDeclaration(
          declaration,
        )
      ) {
        const initializer =
          declaration.initializer;

        if (
          initializer === undefined ||
          initializer.getEnd() >=
          referenceStart
        ) {
          continue;
        }

        addPossibleValue(
          initializer,
        );

        continue;
      }

      /*
       * Destructured variable declarations use
       * a BindingElement as the symbol declaration.
       *
       * Example:
       *
       *   let { name } = props;
       *
       * Nested destructuring can have multiple
       * BindingElement / BindingPattern levels:
       *
       *   const {
       *     user: {
       *       name,
       *     },
       *   } = props;
       */
      if (
        ts.isBindingElement(
          declaration,
        )
      ) {
        const bindingPattern =
          declaration.parent;

        if (
          !ts.isObjectBindingPattern(
            bindingPattern,
          )
        ) {
          continue;
        }

        /*
         * Walk upward until the containing
         * VariableDeclaration is found.
         *
         * This handles both:
         *
         *   const { name } = props;
         *
         * and:
         *
         *   const {
         *     user: {
         *       name,
         *     },
         *   } = props;
         */
        let current:
          | ts.Node
          | undefined =
          bindingPattern;

        let variableDeclaration:
          | ts.VariableDeclaration
          | undefined;

        while (
          current !== undefined
        ) {
          if (
            ts.isVariableDeclaration(
              current,
            )
          ) {
            variableDeclaration =
              current;
            break;
          }

          current =
            current.parent;
        }

        if (
          variableDeclaration ===
          undefined
        ) {
          continue;
        }

        const initializer =
          variableDeclaration.initializer;

        if (
          initializer === undefined ||
          initializer.getEnd() >=
          referenceStart
        ) {
          continue;
        }

        /*
         * The destructured binding ultimately
         * receives its value from the outer
         * variable initializer.
         *
         * Example:
         *
         *   const {
         *     user: {
         *       name,
         *     },
         *   } = props;
         *
         * The source value is `props`.
         */
        addPossibleValue(
          initializer,
        );
      }
    }

    /*
     * Find assignments to this exact symbol.
     */
    function visit(
      node: ts.Node,
    ): void {
      /*
       * Nested functions have their own execution
       * context.
       *
       * If the current reference is outside a nested
       * function, assignments inside that function
       * cannot affect the current value:
       *
       *   let p = props;
       *
       *   function update() {
       *     p = local;
       *   }
       *
       *   return p.name;
       *
       * The update() body has not executed yet.
       *
       * However, when the reference itself is inside
       * the nested function, assignments in that
       * function must be considered:
       *
       *   let p = props;
       *
       *   function render() {
       *     p = local;
       *     return p.name;
       *   }
       */
            if (
        node !== scope &&
        ts.isFunctionLike(node)
      ) {
        let currentUseScope =
          findScope(useNode);

        /*
         * A reference belongs to the execution
         * context of its innermost containing
         * function.
         *
         * Walk outward through nested functions.
         * If this assignment is in a function that
         * is not an ancestor of the reference's
         * execution context, it cannot affect this
         * particular reference.
         */
        while (
          currentUseScope !== undefined &&
          currentUseScope !== node
        ) {
          currentUseScope =
            findScope(
              currentUseScope.parent,
            );
        }

        if (
          currentUseScope !== node
        ) {
          return;
        }
      }

      /*
       * Nothing at or after the reference
       * can affect this particular use.
       */
      if (
        node.getStart() >=
        referenceStart
      ) {
        return;
      }

      if (
        ts.isBinaryExpression(node) &&
        ts.isIdentifier(node.left)
      ) {
        const leftSymbol =
          typeChecker.getSymbolAtLocation(
            node.left,
          );

        if (
          leftSymbol === symbol
        ) {
          if (
            isConditionallyExecuted(
              node,
              symbol,
            )
          ) {
            addPossibleValue(
              node.right,
            );
          } else {
            /*
             * An unconditional assignment
             * invalidates all earlier values.
             */
            possibleValues.length = 0;

            addPossibleValue(
              node.right,
            );
          }
        }
      }

      ts.forEachChild(
        node,
        visit,
      );
    }

    visit(scope);

    if (
      possibleValues.length === 0
    ) {
      return false;
    }

    /*
     * If ANY possible value resolves back to
     * props, the access is unsafe.
     */
    for (
      const possibleValue of
      possibleValues
    ) {
      if (
        ts.isIdentifier(
          possibleValue,
        )
      ) {
        const referencedSymbol =
          typeChecker.getSymbolAtLocation(
            possibleValue,
          );

        if (
          referencedSymbol !==
          undefined &&
          resolve(
            referencedSymbol,
            possibleValue,
          )
        ) {
          return true;
        }

        continue;
      }

      /*
       * Follow property/element access back
       * to its root expression.
       *
       * Example:
       *
       *   currentProps = props.user;
       */
      if (
        ts.isPropertyAccessExpression(
          possibleValue,
        )
      ) {
        if (
          resolveExpressionRoot(
            possibleValue.expression,
            typeChecker,
            resolve,
          )
        ) {
          return true;
        }

        continue;
      }

      if (
        ts.isElementAccessExpression(
          possibleValue,
        )
      ) {
        if (
          resolveExpressionRoot(
            possibleValue.expression,
            typeChecker,
            resolve,
          )
        ) {
          return true;
        }
      }
    }

    return false;
  }

  if (
    referenceNode === undefined
  ) {
    return (
      initializerSymbol ===
      propsSymbol
    );
  }

  return resolve(
    initializerSymbol,
    referenceNode,
  );
}

function resolveExpressionRoot(
  expression: ts.Expression,
  typeChecker: ts.TypeChecker,
  resolveSymbol: (
    symbol: ts.Symbol,
    useNode: ts.Node,
  ) => boolean,
): boolean {
  if (
    ts.isIdentifier(expression)
  ) {
    const symbol =
      typeChecker.getSymbolAtLocation(
        expression,
      );

    if (
      symbol === undefined
    ) {
      return false;
    }

    return resolveSymbol(
      symbol,
      expression,
    );
  }

  if (
    ts.isPropertyAccessExpression(
      expression,
    )
  ) {
    return resolveExpressionRoot(
      expression.expression,
      typeChecker,
      resolveSymbol,
    );
  }

  if (
    ts.isElementAccessExpression(
      expression,
    )
  ) {
    return resolveExpressionRoot(
      expression.expression,
      typeChecker,
      resolveSymbol,
    );
  }

  return false;
}
