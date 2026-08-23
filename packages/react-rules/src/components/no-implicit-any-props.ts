import ts from "@typescript/typescript6";

import type {
  Diagnostic,
} from "@react-code-sentinel/core";

import type {
  SemanticRule,
} from "@react-code-sentinel/analyzers";

import {
  getReactComponentInfo,
} from "../semantic/component-info.js";

import {
  getReactPropsType,
} from "../semantic/props-type.js";

export const noImplicitAnyPropsRule:
  SemanticRule = {
    meta: {
      id: "react/no-implicit-any-props",

      name:
        "No implicit any props",

      description:
        "Detects React component props that resolve to any.",

      category: "react",

      kind: "semantic",

      defaultSeverity: "warning",

      recommended: true,

      fixable: false,
    },

    analyze(context): readonly Diagnostic[] {
      const diagnostics: Diagnostic[] = [];

      function visit(
        node: ts.Node,
      ): void {
        if (
          ts.isFunctionDeclaration(node) ||
          ts.isArrowFunction(node) ||
          ts.isFunctionExpression(node)
        ) {
          const component =
            getReactComponentInfo(node);

          if (
            component !== undefined &&
            component.propsParameter !==
              undefined
          ) {
            const props =
              getReactPropsType(
                context,
                component,
              );

            if (
              props.type !== undefined &&
              (props.type.flags &
                ts.TypeFlags.Any) !==
                0
            ) {
              diagnostics.push({
                ruleId:
                  "react/no-implicit-any-props",

                severity:
                  "warning",

                category:
                  "react",

                message:
                  `React component "${component.name}" has props typed as any.`,

                filePath:
                  context.document.filePath,

                location: {
                  start: {
                    line:
                      context.sourceFile.getLineAndCharacterOfPosition(
                        component.propsParameter.getStart(
                          context.sourceFile,
                        ),
                      ).line + 1,

                    column:
                      context.sourceFile.getLineAndCharacterOfPosition(
                        component.propsParameter.getStart(
                          context.sourceFile,
                        ),
                      ).character + 1,
                  },

                  end: {
                    line:
                      context.sourceFile.getLineAndCharacterOfPosition(
                        component.propsParameter.getEnd(),
                      ).line + 1,

                    column:
                      context.sourceFile.getLineAndCharacterOfPosition(
                        component.propsParameter.getEnd(),
                      ).character + 1,
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
