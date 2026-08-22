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
