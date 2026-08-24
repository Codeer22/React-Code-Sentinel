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

import {
  isMapCall,
  getMapCallback,
  getReturnedJsx,
} from "../utils/maps.js";

import {
  getKeyAttribute,
} from "../utils/jsx.js";

function createDiagnostic(
  filePath: string,
  node: ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment,
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
    ruleId: "react/no-missing-key",
    severity: "warning",
    category: "react",
    message:
      "JSX element rendered from an iterable is missing a key prop.",
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
      "Add a stable key prop.",
  };
}

export const noMissingKeyRule: AstRule = {
  meta: {
    id: "react/no-missing-key",

    name: "No missing key",

    description:
      "Detects JSX elements returned from array map callbacks without a key prop.",

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
        if (!isMapCall(node)) {
          return;
        }

        const callback = getMapCallback(node);

        if (callback === undefined) {
          return;
        }

        for (const jsxNode of getReturnedJsx(callback)) {
          if (ts.isJsxFragment(jsxNode)) {
            diagnostics.push(
              createDiagnostic(
                context.document.filePath,
                jsxNode,
              ),
            );

            continue;
          }

          if (getKeyAttribute(jsxNode) !== undefined) {
            continue;
          }

          diagnostics.push(
            createDiagnostic(
              context.document.filePath,
              jsxNode,
            ),
          );
        }
      },
    });

    return diagnostics;
  },
};