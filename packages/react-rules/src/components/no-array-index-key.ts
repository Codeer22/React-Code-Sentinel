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
    typeChecker.getSymbolAtLocation(
      identifier,
    );

  if (
    targetSymbol === undefined
  ) {
    return false;
  }

  const visitedSymbols =
    new Set<ts.Symbol>();

  function symbolReferencesTarget(
    symbol: ts.Symbol,
  ): boolean {
    if (
      symbol === targetSymbol
    ) {
      return true;
    }

    if (
      visitedSymbols.has(symbol)
    ) {
      return false;
    }

    visitedSymbols.add(symbol);

    for (
      const declaration
      of symbol.declarations ?? []
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
        symbolReferencesTarget(
          initializerSymbol,
        )
      ) {
        return true;
      }
    }

    return false;
  }

  function expressionReferencesTarget(
    expression:
      | ts.Expression
      | undefined,
  ): boolean {
    if (
      expression === undefined
    ) {
      return false;
    }

    if (
      !ts.isIdentifier(expression)
    ) {
      return false;
    }

    const symbol =
      typeChecker.getSymbolAtLocation(
        expression,
      );

    if (
      symbol === undefined
    ) {
      return false;
    }

    return symbolReferencesTarget(
      symbol,
    );
  }

  /*
   * Direct references anywhere inside the
   * key expression.
   *
   * Examples:
   *
   * key={index}
   * key={index.toString()}
   * key={`item-${index}`}
   * key={condition ? index : item.id}
   * key={index + "-item"}
   */
  let directReferenceFound =
    false;

  function findDirectReference(
    current: ts.Node,
  ): void {
    if (
      directReferenceFound
    ) {
      return;
    }

    if (
      ts.isIdentifier(current)
    ) {
      const symbol =
        typeChecker.getSymbolAtLocation(
          current,
        );

      if (
        symbol !== undefined &&
        symbol === targetSymbol
      ) {
        directReferenceFound = true;
        return;
      }
    }

    ts.forEachChild(
      current,
      findDirectReference,
    );
  }

  findDirectReference(node);

  if (
    directReferenceFound
  ) {
    return true;
  }

  /*
   * Find the containing function.
   *
   * This is required for aliases such as:
   *
   * let itemIndex;
   *
   * itemIndex = index;
   *
   * return <div key={itemIndex} />;
   */
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

  if (
    scope === undefined
  ) {
    return false;
  }

  const nodeSymbol =
    ts.isIdentifier(node)
      ? typeChecker.getSymbolAtLocation(
        node,
      )
      : undefined;

  if (
    nodeSymbol === undefined
  ) {
    return false;
  }

  const referenceStart =
    node.getStart(
      node.getSourceFile(),
    );

  let initializerReferencesTarget =
    false;

  let latestAssignmentReferencesTarget:
    | boolean
    | undefined;

  function visit(
    current: ts.Node,
  ): void {
    if (
      current !== scope &&
      ts.isFunctionLike(current)
    ) {
      return;
    }

    const appearsBeforeReference =
      current.getStart(
        current.getSourceFile(),
      ) < referenceStart;

    /*
     * Variable alias:
     *
     * const itemIndex = index;
     *
     * const anotherIndex = itemIndex;
     */
    if (
      appearsBeforeReference &&
      ts.isVariableDeclaration(
        current,
      ) &&
      ts.isIdentifier(
        current.name,
      ) &&
      current.initializer !==
      undefined
    ) {
      const declaredSymbol =
        typeChecker.getSymbolAtLocation(
          current.name,
        );

      if (
        declaredSymbol !==
        undefined &&
        declaredSymbol ===
        nodeSymbol
      ) {
        initializerReferencesTarget =
          expressionReferencesTarget(
            current.initializer,
          );
      }
    }

    /*
     * Assignment alias:
     *
     * let itemIndex;
     *
     * itemIndex = index;
     */
    if (
      appearsBeforeReference &&
      ts.isBinaryExpression(
        current,
      )
    ) {
      if (
        current.operatorToken.kind ===
        ts.SyntaxKind.EqualsToken &&
        ts.isIdentifier(
          current.left,
        )
      ) {
        const leftSymbol =
          typeChecker.getSymbolAtLocation(
            current.left,
          );

        if (
          leftSymbol !==
          undefined &&
          leftSymbol ===
          nodeSymbol
        ) {
          latestAssignmentReferencesTarget =
            expressionReferencesTarget(
              current.right,
            );
        }
      }
    }

    ts.forEachChild(
      current,
      visit,
    );
  }

  visit(scope);

  if (
    latestAssignmentReferencesTarget !==
    undefined
  ) {
    return latestAssignmentReferencesTarget;
  }

  return initializerReferencesTarget;
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
