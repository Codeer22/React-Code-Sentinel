import ts from "@typescript/typescript6";

export function containsJsx(node: ts.Node): boolean {
  let found = false;

  function visit(current: ts.Node): void {
    if (found) {
      return;
    }

    if (
      current.kind === ts.SyntaxKind.JsxElement ||
      current.kind === ts.SyntaxKind.JsxSelfClosingElement ||
      current.kind === ts.SyntaxKind.JsxFragment
    ) {
      found = true;
      return;
    }

    ts.forEachChild(current, visit);
  }

  visit(node);

  return found;
}

export function getKeyAttribute(
  node:
    | ts.JsxElement
    | ts.JsxSelfClosingElement,
): ts.JsxAttribute | undefined {
  const attributes =
    ts.isJsxElement(node)
      ? node.openingElement.attributes
      : node.attributes;

  for (const attribute of attributes.properties) {
    if (
      ts.isJsxAttribute(attribute) &&
      ts.isIdentifier(attribute.name) &&
      attribute.name.text === "key"
    ) {
      return attribute;
    }
  }

  return undefined;
}
