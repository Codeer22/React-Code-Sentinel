import ts from "@typescript/typescript6";

import type {
  Diagnostic,
} from "@react-doctor/core";

import type {
  AstRule,
} from "@react-doctor/analyzers";

import {
  walkAst,
} from "@react-doctor/analyzers";

import {
  containsJsx,
} from "../utils/jsx.js";

import {
  getFunctionName,
  isComponentName,
} from "../utils/components.js";

function createDiagnostic(
  filePath: string,
  node: ts.Node,
  componentName: string,
): Diagnostic {
  const sourceFile = node.getSourceFile();

  const start = sourceFile.getLineAndCharacterOfPosition(
    node.getStart(sourceFile),
  );

  const end = sourceFile.getLineAndCharacterOfPosition(
    node.getEnd(),
  );

  return {
    ruleId: "react/no-unstable-nested-components",
    severity: "warning",
    category: "react",
    message:
      `Component "${componentName}" is defined inside another component. ` +
      "Move it to module scope to avoid recreating its component identity during renders.",
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
      `Move "${componentName}" outside the parent component.`,
  };
}

function isFunctionNode(
  node: ts.Node,
): node is
  | ts.FunctionDeclaration
  | ts.FunctionExpression
  | ts.ArrowFunction {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node)
  );
}

export const noUnstableNestedComponentsRule: AstRule = {
  id: "react/no-unstable-nested-components",

  name: "No unstable nested components",

  description:
    "Detects React components declared inside other React components.",

  category: "react",

  analyze(context) {
    const diagnostics: Diagnostic[] = [];

    const functionStack: ts.Node[] = [];

    walkAst(context.sourceFile, {
      enter(node) {
        if (!isFunctionNode(node)) {
          return;
        }

        const name = getFunctionName(node);

        const hasParentFunction =
          functionStack.length > 0;

        if (
          hasParentFunction &&
          name &&
          isComponentName(name) &&
          containsJsx(node)
        ) {
          diagnostics.push(
            createDiagnostic(
              context.document.filePath,
              node,
              name,
            ),
          );
        }

        functionStack.push(node);
      },

      leave(node) {
        if (isFunctionNode(node)) {
          functionStack.pop();
        }
      },
    });

    return diagnostics;
  },
};
