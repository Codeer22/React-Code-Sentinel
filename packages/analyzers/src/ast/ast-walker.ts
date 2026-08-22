import ts from "@typescript/typescript6";

export interface AstVisitor {
  readonly enter?: (node: ts.Node) => void;
  readonly leave?: (node: ts.Node) => void;
}

export function walkAst(
  sourceFile: ts.SourceFile,
  visitor: AstVisitor,
): void {
  function visit(node: ts.Node): void {
    visitor.enter?.(node);

    ts.forEachChild(node, visit);

    visitor.leave?.(node);
  }

  visit(sourceFile);
}
