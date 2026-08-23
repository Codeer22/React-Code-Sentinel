import ts from "@typescript/typescript6";

import type {
  Diagnostic,
} from "@react-code-sentinel/core";

import type {
  SemanticRule,
} from "@react-code-sentinel/analyzers";

import {
  getReactComponentInfo,
  isReactComponentFunction,
} from "../semantic/component-info.js";

export const noUnsafePropAccessRule:
  SemanticRule = {
    meta: {
      id:
        "react/no-unsafe-prop-access",

      name:
        "No unsafe prop access",

      description:
        "Detects React component prop accesses that resolve to any or unknown.",

      category:
        "react",

      kind:
        "semantic",

      defaultSeverity:
        "warning",

      recommended:
        true,

      fixable:
        false,
    },

    analyze(
      context,
    ): readonly Diagnostic[] {
      const diagnostics:
        Diagnostic[] = [];

      function visit(
        node: ts.Node,
      ): void {
        if (
          ts.isPropertyAccessExpression(
            node,
          )
        ) {
          const component =
            findContainingComponent(
              node,
            );

          if (
            component !== undefined &&
            component.propsParameter !==
              undefined &&
            isDirectPropsAccess(
              node,
              component.propsParameter,
            )
          ) {
            const propertyType =
              context.typeChecker
                .getTypeAtLocation(
                  node,
                );

            const isAny =
              (propertyType.flags &
                ts.TypeFlags.Any) !==
              0;

            const isUnknown =
              (propertyType.flags &
                ts.TypeFlags.Unknown) !==
              0;

            if (
              isAny ||
              isUnknown
            ) {
              const start =
                context.sourceFile
                  .getLineAndCharacterOfPosition(
                    node.getStart(
                      context.sourceFile,
                    ),
                  );

              const end =
                context.sourceFile
                  .getLineAndCharacterOfPosition(
                    node.getEnd(),
                  );

              diagnostics.push({
                ruleId:
                  "react/no-unsafe-prop-access",

                severity:
                  "warning",

                category:
                  "react",

                message:
                  `React component "${component.name}" accesses prop "${node.name.text}" with an unsafe type.`,

                filePath:
                  context.document.filePath,

                location: {
                  start: {
                    line:
                      start.line + 1,

                    column:
                      start.character + 1,
                  },

                  end: {
                    line:
                      end.line + 1,

                    column:
                      end.character + 1,
                  },
                },
              });
            }
          }
        }

        ts.forEachChild(
          node,
          visit,
        );
      }

      visit(
        context.sourceFile,
      );

      return diagnostics;
    },
  };

function findContainingComponent(
  node: ts.Node,
) {
  let current:
    | ts.Node
    | undefined =
    node.parent;

  while (
    current !== undefined
  ) {
    if (
      isReactComponentFunction(
        current,
      )
    ) {
      return getReactComponentInfo(
        current,
      );
    }

    current =
      current.parent;
  }

  return undefined;
}

function isDirectPropsAccess(
  node: ts.PropertyAccessExpression,
  propsParameter:
    ts.ParameterDeclaration,
): boolean {
  return (
    ts.isIdentifier(
      node.expression,
    ) &&
    node.expression.text ===
      propsParameter.name.getText()
  );
}
