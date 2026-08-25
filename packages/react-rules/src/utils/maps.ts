import ts from "@typescript/typescript6";

export function isMapCall(
  node: ts.Node,
): node is ts.CallExpression {
  if (!ts.isCallExpression(node)) {
    return false;
  }

  if (
    !ts.isPropertyAccessExpression(
      node.expression,
    )
  ) {
    return false;
  }

  return (
    node.expression.name.text ===
    "map"
  );
}

export function getMapCallback(
  node: ts.CallExpression,
): ts.ArrowFunction |
  ts.FunctionExpression |
  undefined {
  const callback =
    node.arguments[0];

  if (callback === undefined) {
    return undefined;
  }

  if (
    ts.isArrowFunction(callback) ||
    ts.isFunctionExpression(callback)
  ) {
    return callback;
  }

  return undefined;
}

export function getReturnedJsx(
  callback:
    | ts.ArrowFunction
    | ts.FunctionExpression,
): readonly (
  | ts.JsxElement
  | ts.JsxSelfClosingElement
  | ts.JsxFragment
)[] {
  const results: (
    | ts.JsxElement
    | ts.JsxSelfClosingElement
    | ts.JsxFragment
  )[] = [];

  type ExpressionValue =
    | ts.Expression
    | undefined;

  const localVariables =
    new Map<
      string,
      ExpressionValue[]
    >();

  const resolvingNames =
    new Set<string>();

  function addExpression(
    expression:
      | ts.Expression
      | undefined,
  ): void {
    if (
      expression === undefined
    ) {
      return;
    }

    if (
      ts.isJsxElement(expression) ||
      ts.isJsxSelfClosingElement(
        expression,
      ) ||
      ts.isJsxFragment(expression)
    ) {
      results.push(expression);
      return;
    }

    if (
      ts.isParenthesizedExpression(
        expression,
      )
    ) {
      addExpression(
        expression.expression,
      );

      return;
    }

    if (
      ts.isIdentifier(expression)
    ) {
      const name =
        expression.text;

      if (
        resolvingNames.has(name)
      ) {
        return;
      }

      const values =
        localVariables.get(name);

      if (
        values === undefined
      ) {
        return;
      }

      resolvingNames.add(name);

      for (
        const value of values
      ) {
        addExpression(value);
      }

      resolvingNames.delete(name);
    }
  }

  function setVariable(
    name: string,
    expression:
      | ts.Expression
      | undefined,
  ): void {
    localVariables.set(
      name,
      [expression],
    );
  }

  function addVariableAlternative(
    name: string,
    expression:
      | ts.Expression
      | undefined,
  ): void {
    const existing =
      localVariables.get(name);

    if (
      existing === undefined
    ) {
      localVariables.set(
        name,
        [expression],
      );

      return;
    }

    if (
      !existing.some(
        (value) =>
          value === expression,
      )
    ) {
      existing.push(expression);
    }
  }

  function visitStatement(
    statement: ts.Statement,
  ): void {
    if (
      ts.isVariableStatement(statement)
    ) {
      for (
        const declaration
        of statement.declarationList
          .declarations
      ) {
        if (
          ts.isIdentifier(
            declaration.name,
          )
        ) {
          setVariable(
            declaration.name.text,
            declaration.initializer,
          );
        }
      }

      return;
    }

    if (
      ts.isExpressionStatement(statement) &&
      ts.isBinaryExpression(
        statement.expression,
      ) &&
      statement.expression.operatorToken.kind ===
        ts.SyntaxKind.EqualsToken &&
      ts.isIdentifier(
        statement.expression.left,
      )
    ) {
      setVariable(
        statement.expression.left.text,
        statement.expression.right,
      );

      return;
    }

    if (
      ts.isReturnStatement(statement)
    ) {
      resolvingNames.clear();

      addExpression(
        statement.expression,
      );

      return;
    }

    if (
      ts.isBlock(statement)
    ) {
      for (
        const child
        of statement.statements
      ) {
        visitStatement(child);
      }

      return;
    }

    if (
      ts.isIfStatement(statement)
    ) {
      const beforeBranch =
        new Map(
          localVariables,
        );

      visitStatement(
        statement.thenStatement,
      );

      const thenState =
        new Map(
          localVariables,
        );

      localVariables.clear();

      for (
        const [
          name,
          values,
        ] of beforeBranch
      ) {
        localVariables.set(
          name,
          [...values],
        );
      }

      if (
        statement.elseStatement !==
        undefined
      ) {
        visitStatement(
          statement.elseStatement,
        );
      }

      const elseState =
        new Map(
          localVariables,
        );

      localVariables.clear();

      const names = new Set<string>([
        ...thenState.keys(),
        ...elseState.keys(),
      ]);

      for (
        const name of names
      ) {
        const values: ExpressionValue[] =
          [];

        for (
          const value of
            thenState.get(name) ?? []
        ) {
          if (
            !values.some(
              (existing) =>
                existing === value,
            )
          ) {
            values.push(value);
          }
        }

        for (
          const value of
            elseState.get(name) ?? []
        ) {
          if (
            !values.some(
              (existing) =>
                existing === value,
            )
          ) {
            values.push(value);
          }
        }

        localVariables.set(
          name,
          values,
        );
      }

      return;
    }

    if (
      ts.isTryStatement(statement)
    ) {
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

    if (
      ts.isSwitchStatement(statement)
    ) {
      for (
        const clause
        of statement.caseBlock.clauses
      ) {
        for (
          const child
          of clause.statements
        ) {
          visitStatement(child);
        }
      }
    }
  }

  if (
    ts.isArrowFunction(callback) &&
    !ts.isBlock(callback.body)
  ) {
    addExpression(callback.body);

    return results;
  }

  const body =
    callback.body;

  if (
    !ts.isBlock(body)
  ) {
    return results;
  }

  for (
    const statement
    of body.statements
  ) {
    visitStatement(statement);
  }

  return results;
}
