import test from "node:test";
import assert from "node:assert/strict";

import ts from "@typescript/typescript6";

import {
  createAstAnalysisContext,
  createSemanticAnalysisContext,
} from "@react-code-sentinel/analyzers";

import {
  getReactComponentInfo,
} from "../semantic/component-info.js";

import {
  getReactPropsType,
} from "../semantic/props-type.js";

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

    const rootDirectory =
      process.cwd();

    const fileName =
      "semantic-helper-test.tsx";

    const filePath =
      ts.sys.resolvePath(
        `${rootDirectory}/${fileName}`,
      );

    const compilerOptions: ts.CompilerOptions = {
      target:
        ts.ScriptTarget.Latest,

      module:
        ts.ModuleKind.ESNext,

      jsx:
        ts.JsxEmit.Preserve,

      noEmit: true,

      skipLibCheck: true,
    };

    const host =
      ts.createCompilerHost(
        compilerOptions,
      );

    const originalReadFile =
      host.readFile;

    const originalFileExists =
      host.fileExists;

    host.fileExists = (
      fileNameToCheck,
    ) => {
      if (
        ts.sys.resolvePath(
          fileNameToCheck,
        ) === filePath
      ) {
        return true;
      }

      return originalFileExists(
        fileNameToCheck,
      );
    };

    host.readFile = (
      fileNameToRead,
    ) => {
      if (
        ts.sys.resolvePath(
          fileNameToRead,
        ) === filePath
      ) {
        return sourceText;
      }

      return originalReadFile(
        fileNameToRead,
      );
    };

    const program =
      ts.createProgram(
        [filePath],
        compilerOptions,
        host,
      );

    const sourceFile =
      program.getSourceFile(filePath);

    assert.ok(sourceFile);

    const astContext =
      createAstAnalysisContext(
        {
          document: {
            filePath: fileName,
            sourceText,
          },

          project: {
            rootDirectory,
            files: [fileName],
          },

          config: {},

          diagnostics: [],
        },
        sourceFile,
      );

    const context =
      createSemanticAnalysisContext(
        astContext,
        program,
      );

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

        if (component !== undefined) {
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

    const rootDirectory =
      process.cwd();

    const fileName =
      "semantic-destructured-props-test.tsx";

    const filePath =
      ts.sys.resolvePath(
        `${rootDirectory}/${fileName}`,
      );

    const compilerOptions: ts.CompilerOptions = {
      target:
        ts.ScriptTarget.Latest,

      module:
        ts.ModuleKind.ESNext,

      jsx:
        ts.JsxEmit.Preserve,

      noEmit: true,

      skipLibCheck: true,
    };

    const host =
      ts.createCompilerHost(
        compilerOptions,
      );

    const originalReadFile =
      host.readFile;

    const originalFileExists =
      host.fileExists;

    host.fileExists = (
      fileNameToCheck,
    ) => {
      if (
        ts.sys.resolvePath(
          fileNameToCheck,
        ) === filePath
      ) {
        return true;
      }

      return originalFileExists(
        fileNameToCheck,
      );
    };

    host.readFile = (
      fileNameToRead,
    ) => {
      if (
        ts.sys.resolvePath(
          fileNameToRead,
        ) === filePath
      ) {
        return sourceText;
      }

      return originalReadFile(
        fileNameToRead,
      );
    };

    const program =
      ts.createProgram(
        [filePath],
        compilerOptions,
        host,
      );

    const sourceFile =
      program.getSourceFile(filePath);

    assert.ok(sourceFile);

    const astContext =
      createAstAnalysisContext(
        {
          document: {
            filePath: fileName,
            sourceText,
          },

          project: {
            rootDirectory,
            files: [fileName],
          },

          config: {},

          diagnostics: [],
        },
        sourceFile,
      );

    const context =
      createSemanticAnalysisContext(
        astContext,
        program,
      );

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
