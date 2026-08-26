import ts from "@typescript/typescript6";

import type {
  Diagnostic,
} from "@react-code-sentinel/core";

import type {
  AstRule,
} from "@react-code-sentinel/analyzers";

function createDiagnostic(
  filePath: string,
  node: ts.JsxElement | ts.JsxFragment,
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
  fragment: ts.JsxElement | ts.JsxFragment,
): readonly ts.JsxChild[] {
  return fragment.children.filter(
    (child) => !isIgnorableChild(child),
  );
}

function isUselessFragment(
  fragment: ts.JsxElement | ts.JsxFragment,
): boolean {
  const children =
    getRenderableChildren(fragment);

  return children.length === 1;
}

function isExplicitFragment(
  node: ts.JsxElement,
  fragmentNames: ReadonlySet<string>,
): boolean {
  const tagName =
    node.openingElement.tagName;

  if (
    ts.isIdentifier(tagName) &&
    fragmentNames.has(tagName.text)
  ) {
    return true;
  }

  return (
    ts.isPropertyAccessExpression(tagName) &&
    ts.isIdentifier(tagName.expression) &&
    tagName.expression.text === "React" &&
    tagName.name.text === "Fragment"
  );
}

function getImportedFragmentNames(
  sourceFile: ts.SourceFile,
): ReadonlySet<string> {
  const names = new Set<string>();

  for (
    const statement of sourceFile.statements
  ) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== "react"
    ) {
      continue;
    }

    const bindings =
      statement.importClause?.namedBindings;

    if (
      bindings === undefined ||
      !ts.isNamedImports(bindings)
    ) {
      continue;
    }

    for (
      const element of bindings.elements
    ) {
      const importedName =
        element.propertyName?.text ??
        element.name.text;

      if (importedName === "Fragment") {
        names.add(element.name.text);
      }
    }
  }

  return names;
}

function hasKey(
  node: ts.JsxElement,
): boolean {
  return node.openingElement.attributes.properties.some(
    (property) =>
      ts.isJsxAttribute(property) &&
      ts.isIdentifier(property.name) &&
      property.name.text === "key",
  );
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
    const fragmentNames =
      getImportedFragmentNames(
        context.sourceFile,
      );

    function visit(node: ts.Node): void {
      if (
        ts.isJsxFragment(node) ||
        (ts.isJsxElement(node) &&
          isExplicitFragment(
            node,
            fragmentNames,
          ) &&
          !hasKey(node))
      ) {
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
