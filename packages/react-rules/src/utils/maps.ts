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
)[] {
  const results: (
    | ts.JsxElement
    | ts.JsxSelfClosingElement
  )[] = [];

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
      )
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
    }
  }

  function visitCaseBlock(
    caseBlock: ts.CaseBlock,
  ): void {
    for (
      const clause
        of caseBlock.clauses
    ) {
      for (
        const statement
          of clause.statements
      ) {
        visitStatement(statement);
      }
    }
  }

  function visitStatement(
    statement: ts.Statement,
  ): void {
    if (
      ts.isReturnStatement(statement)
    ) {
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
      visitCaseBlock(
        statement.caseBlock,
      );
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
