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
      "react/no-direct-mutation-state",

    severity:
      "warning",

    category:
      "react",

    message:
      "Do not directly mutate React component state.",

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
      "Use setState or another supported state update mechanism.",
  };
}

function isMutationOperator(
  kind: ts.SyntaxKind,
): boolean {
  return (
    kind ===
      ts.SyntaxKind.EqualsToken ||

    kind ===
      ts.SyntaxKind.PlusEqualsToken ||

    kind ===
      ts.SyntaxKind.MinusEqualsToken ||

    kind ===
      ts.SyntaxKind.AsteriskEqualsToken ||

    kind ===
      ts.SyntaxKind.SlashEqualsToken ||

    kind ===
      ts.SyntaxKind.PercentEqualsToken ||

    kind ===
      ts.SyntaxKind.AmpersandEqualsToken ||

    kind ===
      ts.SyntaxKind.BarEqualsToken ||

    kind ===
      ts.SyntaxKind.CaretEqualsToken ||

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

function isThisStateProperty(
  node: ts.Node,
  typeChecker: ts.TypeChecker,
): node is ts.PropertyAccessExpression {
  if (
    !ts.isPropertyAccessExpression(node)
  ) {
    return false;
  }

  if (
    node.expression.kind !==
    ts.SyntaxKind.ThisKeyword
  ) {
    return false;
  }

  if (
    node.name.text !== "state"
  ) {
    return false;
  }

  const symbol =
    typeChecker.getSymbolAtLocation(
      node.name,
    );

  if (
    symbol === undefined
  ) {
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

/**
 * Finds the latest value assigned to an
 * identifier before the current reference.
 *
 * Example:
 *
 *   let currentState;
 *
 *   currentState = this.state;
 *   currentState.count = 1;
 *
 * The latest value is `this.state`.
 *
 * But:
 *
 *   let currentState;
 *
 *   currentState = this.state;
 *   currentState = {
 *     count: 0,
 *   };
 *
 *   currentState.count = 1;
 *
 * The latest value is the object literal,
 * so currentState is no longer considered
 * a state alias.
 */
function getLatestAssignedValueForReference(
  identifier: ts.Identifier,
  symbol: ts.Symbol,
  typeChecker: ts.TypeChecker,
): ts.Expression | undefined {
  const sourceFile =
    identifier.getSourceFile();

  const referencePosition =
    identifier.getStart(sourceFile);

  let latestValue:
    | ts.Expression
    | undefined;

  let latestPosition = -1;

  /*
   * const currentState = this.state;
   */
  for (
    const declaration of
      symbol.declarations ?? []
  ) {
    if (
      !ts.isVariableDeclaration(
        declaration,
      )
    ) {
      continue;
    }

    const initializer =
      declaration.initializer;

    if (
      initializer === undefined
    ) {
      continue;
    }

    if (
      initializer.getEnd() >
      referencePosition
    ) {
      continue;
    }

    const position =
      initializer.getStart(
        sourceFile,
      );

    if (
      position > latestPosition
    ) {
      latestPosition =
        position;

      latestValue =
        initializer;
    }
  }

  /*
   * Find assignments to this exact symbol.
   *
   * Example:
   *
   * currentState = this.state;
   * currentState = {
   *   count: 0,
   * };
   *
   * The second assignment must win.
   */
  function visit(
    node: ts.Node,
  ): void {
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind ===
        ts.SyntaxKind.EqualsToken &&
      ts.isIdentifier(node.left)
    ) {
      const leftSymbol =
        typeChecker.getSymbolAtLocation(
          node.left,
        );

      if (
        leftSymbol === symbol &&
        node.getEnd() <=
          referencePosition
      ) {
        const position =
          node.getStart(sourceFile);

        if (
          position > latestPosition
        ) {
          latestPosition =
            position;

          latestValue =
            node.right;
        }
      }
    }

    ts.forEachChild(
      node,
      visit,
    );
  }

  visit(sourceFile);

  return latestValue;
}

function isStateMutationTarget(
  node: ts.Node,
  typeChecker: ts.TypeChecker,
): boolean {
  /*
   * Direct:
   *
   * this.state
   */
  if (
    isThisStateProperty(
      node,
      typeChecker,
    )
  ) {
    return true;
  }

  /*
   * this.state.count
   * this.state.user.name
   */
  if (
    ts.isPropertyAccessExpression(node)
  ) {
    return isStateMutationTarget(
      node.expression,
      typeChecker,
    );
  }

  /*
   * this.state["count"]
   * this.state.items[0]
   */
  if (
    ts.isElementAccessExpression(node)
  ) {
    return isStateMutationTarget(
      node.expression,
      typeChecker,
    );
  }

  if (
    !ts.isIdentifier(node)
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

  /*
   * Resolve the value at this exact
   * reference.
   */
  const latestValue =
    getLatestAssignedValueForReference(
      node,
      symbol,
      typeChecker,
    );

  if (
    latestValue === undefined
  ) {
    return false;
  }

  /*
   * Prevent recursive alias cycles:
   *
   * a = b;
   * b = a;
   */
  if (
    latestValue === node
  ) {
    return false;
  }

  return isStateMutationTarget(
    latestValue,
    typeChecker,
  );
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
    id:
      "react/no-direct-mutation-state",

    name:
      "No direct mutation of state",

    description:
      "Detects direct mutation of class component state.",

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

    const {
      typeChecker,
    } = context;

    walkAst(
      context.sourceFile,
      {
        enter(node) {
          /*
           * Binary assignment operators
           * (=, +=, -=, etc.)
           */
          if (
            ts.isBinaryExpression(node) &&
            isMutationOperator(
              node.operatorToken.kind,
            )
          ) {
            /*
             * Reassigning (or first-assigning) a
             * bare local variable never mutates
             * the object it previously referenced
             * — it just rebinds the variable.
             *
             * This correctly covers BOTH:
             *
             *   currentState = this.state;
             *   // establishes an alias, not a mutation
             *
             *   currentState = { count: 0 };
             *   // breaks the alias, not a mutation
             *
             * Only property/element access on the
             * left side is an actual mutation.
             */
            if (
              ts.isIdentifier(node.left)
            ) {
              return;
            }

            if (
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
            }

            return;
          }

          /*
           * Prefix mutations:
           *
           * ++this.state.count
           * ++currentState.count
           */
          if (
            ts.isPrefixUnaryExpression(
              node,
            ) &&
            isUnaryMutation(
              node.operator,
            )
          ) {
            if (
              ts.isIdentifier(
                node.operand,
              )
            ) {
              return;
            }

            if (
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
            }

            return;
          }

          /*
           * Postfix mutations:
           *
           * this.state.count++
           * currentState.count++
           */
          if (
            ts.isPostfixUnaryExpression(
              node,
            ) &&
            isUnaryMutation(
              node.operator,
            )
          ) {
            if (
              ts.isIdentifier(
                node.operand,
              )
            ) {
              return;
            }

            if (
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
            }

            return;
          }

          /*
           * Mutating array methods:
           *
           * this.state.items.push(...)
           * currentState.items.push(...)
           */
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
      },
    );

    return diagnostics;
  },
};
