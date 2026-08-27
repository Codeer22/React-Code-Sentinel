import {
  readFile,
} from "node:fs/promises";

import {
  resolve,
} from "node:path";

import ts from "@typescript/typescript6";

export interface ProgramBuildOptions {
  readonly rootDirectory: string;
  readonly files: readonly string[];
}

export async function createTypeScriptProgram(
  options: ProgramBuildOptions,
): Promise<ts.Program> {
  const rootDirectory =
    resolve(options.rootDirectory);

  const rootNames: string[] = [];

  for (const file of options.files) {
    rootNames.push(
      resolve(rootDirectory, file),
    );
  }

  const compilerOptions: ts.CompilerOptions = {
    allowJs: true,
    checkJs: false,
    jsx: ts.JsxEmit.Preserve,
    noEmit: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.ESNext,
    moduleResolution:
      ts.ModuleResolutionKind.Bundler,
  };

  return ts.createProgram(
    rootNames,
    compilerOptions,
  );
}
