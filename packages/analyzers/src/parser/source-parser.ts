import ts from "@typescript/typescript6";

export interface ParsedSource {
  readonly sourceFile: ts.SourceFile;
  readonly filePath: string;
}

export function parseSource(
  filePath: string,
  sourceText: string,
): ParsedSource {
  const scriptKind = getScriptKind(filePath);

  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );

  return {
    sourceFile,
    filePath,
  };
}

function getScriptKind(filePath: string): ts.ScriptKind {
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

