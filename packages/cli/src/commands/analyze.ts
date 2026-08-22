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
  loadConfig,
} from "../config/config-loader.js";

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

  const loadedConfig =
    await loadConfig({
      directory: rootDirectory,
    });

  const selectedRules = selectRules(
    reactRules,
    options.selection,
  );

  const result = await analyzeProject({
    rootDirectory,
    config: loadedConfig.config,
    rules: selectedRules,
  });

  console.log(
    `Analyzed ${result.filesAnalyzed} source file(s).`,
  );

  console.log(
    `Rules: ${selectedRules.length}`,
  );

  if (loadedConfig.path !== undefined) {
    console.log(
      `Config: ${loadedConfig.path}`,
    );
  }

  console.log("");

  printDiagnostics(
    result.diagnostics,
  );

  return result.diagnostics.length > 0
    ? 1
    : 0;
}
