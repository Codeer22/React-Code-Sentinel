import assert from "node:assert/strict";
import ts from "@typescript/typescript6";

import type {
  AnalysisContext,
} from "@react-code-sentinel/core";

import {
  createAstAnalysisContext,
} from "@react-code-sentinel/analyzers";

import type {
  AstRule,
  AstAnalysisContext,
  SemanticRule,
  SemanticAnalysisContext,
} from "@react-code-sentinel/analyzers";

export function analyzeRule(
  rule: AstRule | SemanticRule,
  sourceText: string,
  filePath = "App.tsx",
) {
  if (rule.meta.kind === "ast") {
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      getScriptKind(filePath),
    );

    const baseContext: AnalysisContext = {
      document: {
        filePath,
        sourceText,
      },
      project: {
        rootDirectory: ".",
        files: [filePath],
      },
      config: {
        rules: {},
      },
      diagnostics: [],
    };

    const astContext: AstAnalysisContext =
      createAstAnalysisContext(
        baseContext,
        sourceFile,
      );

    return (rule as AstRule).analyze(
      astContext,
    );
  }

  const rootDirectory = process.cwd();

  const filePathAbsolute =
    ts.sys.resolvePath(
      `${rootDirectory}/${filePath}`,
    );

  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.ESNext,
    jsx: ts.JsxEmit.Preserve,
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
      ) === filePathAbsolute
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
      ) === filePathAbsolute
    ) {
      return sourceText;
    }

    return originalReadFile(
      fileNameToRead,
    );
  };

  const program =
    ts.createProgram(
      [filePathAbsolute],
      compilerOptions,
      host,
    );

  const sourceFile =
    program.getSourceFile(
      filePathAbsolute,
    );

  assert.ok(sourceFile);

  const baseContext: AnalysisContext = {
    document: {
      filePath,
      sourceText,
    },
    project: {
      rootDirectory,
      files: [filePath],
    },
    config: {},
    diagnostics: [],
  };

  const astContext: AstAnalysisContext =
    createAstAnalysisContext(
      baseContext,
      sourceFile,
    );

  const semanticContext:
    SemanticAnalysisContext = {
    ...astContext,
    program,
    typeChecker:
      program.getTypeChecker(),
  };

  return (rule as SemanticRule).analyze(
    semanticContext,
  );
}

function getScriptKind(
  filePath: string,
): ts.ScriptKind {
  if (filePath.endsWith(".tsx")) {
    return ts.ScriptKind.TSX;
  }

  if (filePath.endsWith(".jsx")) {
    return ts.ScriptKind.JSX;
  }

  if (filePath.endsWith(".ts")) {
    return ts.ScriptKind.TS;
  }

  return ts.ScriptKind.JS;
}
