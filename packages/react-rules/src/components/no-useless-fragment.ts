import ts from "@typescript/typescript6";

import type {
  Diagnostic,
} from "@react-code-sentinel/core";

import type {
  AstRule,
} from "@react-code-sentinel/analyzers";

function createDiagnostic(
  filePath: string,
  node: ts.JsxFragment,
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
    ruleId: "react/no-useless-fragment",
    severity: "warning",
    category: "react",
    message:
      "Fragment is unnecessary because it contains a single child.",
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
      "Remove the unnecessary fragment.",
  };
}

function isIgnorableChild(
  child: ts.JsxChild,
): boolean {
  if (
    ts.isJsxText(child) &&
    child.getText().trim().length === 0
  ) {
    return true;
  }

  if (
    ts.isJsxExpression(child) &&
    child.expression === undefined
  ) {
    return true;
  }

  return false;
}

function getRenderableChildren(
  fragment: ts.JsxFragment,
): readonly ts.JsxChild[] {
  return fragment.children.filter(
    (child) => !isIgnorableChild(child),
  );
}

function isUselessFragment(
  fragment: ts.JsxFragment,
): boolean {
  const children =
    getRenderableChildren(fragment);

  return children.length === 1;
}

export const noUselessFragmentRule: AstRule = {
  meta: {
    id: "react/no-useless-fragment",

    name: "No useless fragment",

    description:
      "Detects React fragments that contain only one renderable child.",

    category: "react",

    kind: "ast",

    defaultSeverity: "warning",

    recommended: true,

    fixable: false,
  },

  analyze(context) {
    const diagnostics: Diagnostic[] = [];

    function visit(node: ts.Node): void {
      if (ts.isJsxFragment(node)) {
        if (isUselessFragment(node)) {
          diagnostics.push(
            createDiagnostic(
              context.document.filePath,
              node,
            ),
          );
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(context.sourceFile);

    return diagnostics;
  },
};
