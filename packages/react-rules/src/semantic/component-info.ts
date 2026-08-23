import ts from "@typescript/typescript6";

export interface ReactComponentInfo {
  readonly functionNode:
    | ts.FunctionDeclaration
    | ts.ArrowFunction
    | ts.FunctionExpression;

  readonly name: string;

  readonly propsParameter:
    | ts.ParameterDeclaration
    | undefined;
}

export function getReactComponentInfo(
  node:
    | ts.FunctionDeclaration
    | ts.ArrowFunction
    | ts.FunctionExpression,
): ReactComponentInfo | undefined {
  const name =
    getFunctionName(node);

  if (
    name === undefined ||
    !isComponentName(name)
  ) {
    return undefined;
  }

  return {
    functionNode: node,
    name,
    propsParameter:
      node.parameters[0],
  };
}

export function isReactComponentFunction(
  node: ts.Node,
): node is
  | ts.FunctionDeclaration
  | ts.ArrowFunction
  | ts.FunctionExpression {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isArrowFunction(node) ||
    ts.isFunctionExpression(node)
  );
}

function getFunctionName(
  node:
    | ts.FunctionDeclaration
    | ts.ArrowFunction
    | ts.FunctionExpression,
): string | undefined {
  if (
    ts.isFunctionDeclaration(node)
  ) {
    return node.name?.text;
  }

  if (
    ts.isVariableDeclaration(
      node.parent,
    ) &&
    ts.isIdentifier(node.parent.name)
  ) {
    return node.parent.name.text;
  }

  if (
    ts.isPropertyAssignment(
      node.parent,
    ) &&
    ts.isIdentifier(node.parent.name)
  ) {
    return node.parent.name.text;
  }

  return undefined;
}

function isComponentName(
  name: string,
): boolean {
  return /^[A-Z][A-Za-z0-9_$]*$/.test(
    name,
  );
}
