import assert from "node:assert/strict";

import ts from "@typescript/typescript6";

import {
  createAstAnalysisContext,
  createSemanticAnalysisContext,
} from "@react-code-sentinel/analyzers";

export function createSemanticContext(
  sourceText: string,
  fileName = "semantic-test.tsx",
) {
  const rootDirectory =
    process.cwd();

  const filePath =
    ts.sys.resolvePath(
      `${rootDirectory}/${fileName}`,
    );

  const compilerOptions:
    ts.CompilerOptions = {
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
    program.getSourceFile(
      filePath,
    );

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

  return createSemanticAnalysisContext(
    astContext,
    program,
  );
}
