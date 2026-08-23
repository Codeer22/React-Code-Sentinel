import ts from "@typescript/typescript6";

import type {
  AnalysisContext,
} from "@react-code-sentinel/core";

import type {
  AstRule,
} from "@react-code-sentinel/analyzers";

export function analyzeRule(
  rule: AstRule,
  sourceText: string,
  filePath = "App.tsx",
) {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(filePath),
  );

  const context: AnalysisContext & {
    readonly sourceFile: ts.SourceFile;
  } = {
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
    sourceFile,
  };

  return rule.analyze(context);
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
