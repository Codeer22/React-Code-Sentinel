import test from "node:test";
import assert from "node:assert/strict";

import ts from "@typescript/typescript6";

import {
  getReactComponentInfo,
} from "../semantic/component-info.js";

import {
  getReactPropsType,
} from "../semantic/props-type.js";

import {
  createSemanticContext,
} from "./helpers/create-semantic-context.js";

test(
  "resolves React component props type",
  () => {
    const sourceText = `
      interface CardProps {
        title: string;
      }

      function Card(
        props: CardProps,
      ) {
        return props.title;
      }
    `;

    const context =
      createSemanticContext(
        sourceText,
        "semantic-helper-test.tsx",
      );

    const sourceFile =
      context.sourceFile;

    let component:
      ReturnType<
        typeof getReactComponentInfo
      >;

    for (
      const statement
        of sourceFile.statements
    ) {
      if (
        ts.isFunctionDeclaration(
          statement,
        )
      ) {
        component =
          getReactComponentInfo(
            statement,
          );

        if (
          component !== undefined
        ) {
          break;
        }
      }
    }

    assert.ok(component);

    assert.equal(
      component.name,
      "Card",
    );

    assert.ok(
      component.propsParameter,
    );

    const props =
      getReactPropsType(
        context,
        component,
      );

    assert.equal(
      props.typeString,
      "CardProps",
    );
  },
);

test(
  "resolves destructured React component props type",
  () => {
    const sourceText = `
      interface CardProps {
        title: string;
      }

      function Card(
        { title }: CardProps,
      ) {
        return title;
      }
    `;

    const context =
      createSemanticContext(
        sourceText,
        "semantic-destructured-props-test.tsx",
      );

    const sourceFile =
      context.sourceFile;

    let component:
      ReturnType<
        typeof getReactComponentInfo
      >;

    for (
      const statement
        of sourceFile.statements
    ) {
      if (
        ts.isFunctionDeclaration(
          statement,
        )
      ) {
        component =
          getReactComponentInfo(
            statement,
          );

        if (
          component !== undefined
        ) {
          break;
        }
      }
    }

    assert.ok(component);

    assert.equal(
      component.name,
      "Card",
    );

    assert.ok(
      component.propsParameter,
    );

    const props =
      getReactPropsType(
        context,
        component,
      );

    assert.equal(
      props.typeString,
      "CardProps",
    );
  },
);
