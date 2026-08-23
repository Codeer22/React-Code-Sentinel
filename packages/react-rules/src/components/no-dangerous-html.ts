import ts from "@typescript/typescript6";

import type {
  Diagnostic,
} from "@react-code-sentinel/core";

import type {
  AstRule,
} from "@react-code-sentinel/analyzers";

import {
  walkAst,
} from "@react-code-sentinel/analyzers";

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
    ruleId: "react/no-dangerous-html",
    severity: "warning",
    category: "react",
    message:
      "dangerouslySetInnerHTML can introduce unsafe HTML into the DOM.",
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
      "Prefer rendering trusted JSX or sanitized content instead.",
  };
}

function isDangerousHtmlAttribute(
  node: ts.JsxAttribute,
): boolean {
  return (
    ts.isIdentifier(node.name) &&
    node.name.text ===
      "dangerouslySetInnerHTML"
  );
}

export const noDangerousHtmlRule: AstRule = {
  meta: {
    id: "react/no-dangerous-html",

    name: "No dangerous HTML",

    description:
      "Detects usage of dangerouslySetInnerHTML in JSX.",

    category: "react",

    kind: "ast",

    defaultSeverity: "warning",

    recommended: true,

    fixable: false,
  },

  analyze(context) {
    const diagnostics: Diagnostic[] = [];

    walkAst(context.sourceFile, {
      enter(node) {
        if (!ts.isJsxAttribute(node)) {
          return;
        }

        if (
          !isDangerousHtmlAttribute(node)
        ) {
          return;
        }

        diagnostics.push(
          createDiagnostic(
            context.document.filePath,
            node,
          ),
        );
      },
    });

    return diagnostics;
  },
};
