import ts from "@typescript/typescript6";

export function isComponentName(name: string): boolean {
  return /^[A-Z][A-Za-z0-9_$]*$/.test(name);
}

export function getFunctionName(
  node:
    | ts.FunctionDeclaration
    | ts.FunctionExpression
    | ts.ArrowFunction,
): string | undefined {
  if (ts.isFunctionDeclaration(node)) {
    return node.name?.text;
  }

  if (
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node)
  ) {
    const parent = node.parent;

    if (
      ts.isVariableDeclaration(parent) &&
      ts.isIdentifier(parent.name)
    ) {
      return parent.name.text;
    }

    if (
      ts.isPropertyAssignment(parent) &&
      ts.isIdentifier(parent.name)
    ) {
      return parent.name.text;
    }

    if (
      ts.isCallExpression(parent) &&
      isReactWrapperCall(parent) &&
      ts.isVariableDeclaration(parent.parent) &&
      ts.isIdentifier(parent.parent.name)
    ) {
      return parent.parent.name.text;
    }
  }

  return undefined;
}

function isReactWrapperCall(
  node: ts.CallExpression,
): boolean {
  const expression = node.expression;

  if (ts.isIdentifier(expression)) {
    return (
      expression.text === "memo" ||
      expression.text === "forwardRef"
    );
  }

  return (
    ts.isPropertyAccessExpression(expression) &&
    ts.isIdentifier(expression.expression) &&
    expression.expression.text === "React" &&
    (
      expression.name.text === "memo" ||
      expression.name.text === "forwardRef"
    )
  );
}

export function isReactComponentFunction(
  node:
    | ts.FunctionDeclaration
    | ts.FunctionExpression
    | ts.ArrowFunction,
): boolean {
  const name = getFunctionName(node);

  return (
    name !== undefined &&
    isComponentName(name)
  );
}
