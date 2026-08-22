import {
  resolve,
} from "node:path";

import {
  analyzeProject,
} from "@react-doctor/analyzers";

import {
  noUnstableNestedComponentsRule,
} from "@react-doctor/react-rules";

import {
  printDiagnostics,
} from "../output/terminal-reporter.js";

export interface AnalyzeCommandOptions {
  readonly directory: string;
}

export async function analyzeCommand(
  options: AnalyzeCommandOptions,
): Promise<number> {
  const rootDirectory = resolve(
    options.directory,
  );

  const result = await analyzeProject({
    rootDirectory,
    rules: [
      noUnstableNestedComponentsRule,
    ],
  });

  console.log(
    `Analyzed ${result.filesAnalyzed} source file(s).`,
  );

  console.log("");

  printDiagnostics(
    result.diagnostics,
  );

  return result.diagnostics.length > 0
    ? 1
    : 0;
}
