import test from "node:test";
import assert from "node:assert/strict";

import ts from "@typescript/typescript6";

import {
  createAstAnalysisContext,
} from "../create-ast-context.js";

import {
  createSemanticAnalysisContext,
} from "../create-semantic-context.js";

test(
  "semantic context exposes TypeScript program and type checker",
  () => {
    const sourceText = `
      const count: number = 42;
    `;

    const rootDirectory = process.cwd();

    const fileName =
      "semantic-test-fixture.ts";

    const filePath =
      ts.sys.resolvePath(
        `${rootDirectory}/${fileName}`,
      );

    const host =
      ts.createCompilerHost({
        target: ts.ScriptTarget.Latest,
        module: ts.ModuleKind.ESNext,
        noEmit: true,
      });

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
        {
          target:
            ts.ScriptTarget.Latest,

          module:
            ts.ModuleKind.ESNext,

          noEmit: true,

          skipLibCheck: true,
        },
        host,
      );

    const sourceFile =
      program.getSourceFile(filePath);

    assert.ok(sourceFile);

    const coreContext = {
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
    };

    const astContext =
      createAstAnalysisContext(
        coreContext,
        sourceFile,
      );

    const context =
      createSemanticAnalysisContext(
        astContext,
        program,
      );

    assert.strictEqual(
      context.program,
      program,
    );

    assert.strictEqual(
      context.typeChecker,
      program.getTypeChecker(),
    );

    const variable =
      sourceFile.statements[0];

    assert.ok(variable);

    assert.ok(
      ts.isVariableStatement(variable),
    );

    const declaration =
      variable.declarationList
        .declarations[0];

    assert.ok(declaration);

    assert.ok(
      ts.isIdentifier(
        declaration.name,
      ),
    );

    const type =
      context.typeChecker.getTypeAtLocation(
        declaration.name,
      );

    assert.equal(
      context.typeChecker.typeToString(type),
      "number",
    );
  },
);
