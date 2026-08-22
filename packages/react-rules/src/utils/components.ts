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
  }

  return undefined;
}

