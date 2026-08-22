import {
  resolve,
} from "node:path";

import {
  analyzeProject,
} from "@react-doctor/analyzers";

import {
  selectRules,
} from "@react-doctor/core";

import type {
  RuleSelectionOptions,
} from "@react-doctor/core";

import {
  reactRules,
} from "@react-doctor/react-rules";

import {
  printDiagnostics,
} from "../output/terminal-reporter.js";

export interface AnalyzeCommandOptions {
  readonly directory: string;
  readonly selection?: RuleSelectionOptions;
}

export async function analyzeCommand(
  options: AnalyzeCommandOptions,
): Promise<number> {
  const rootDirectory = resolve(
    options.directory,
  );

  const selectedRules = selectRules(
    reactRules,
    options.selection,
  );

  const result = await analyzeProject({
    rootDirectory,
    rules: selectedRules,
  });

  console.log(
    `Analyzed ${result.filesAnalyzed} source file(s).`,
  );

  console.log(
    `Rules: ${selectedRules.length}`,
  );

  console.log("");

  printDiagnostics(
    result.diagnostics,
  );

  return result.diagnostics.length > 0
    ? 1
    : 0;
}
