import {
  resolve,
} from "node:path";

import {
  shouldFail,
} from "./exit-code.js";

import {
  analyzeProject,
} from "@react-code-sentinel/analyzers";

import {
  selectRules,
} from "@react-code-sentinel/core";

import type {
  RuleSelectionOptions,
} from "@react-code-sentinel/core";

import {
  reactRules,
  recommendedReactRules,
} from "@react-code-sentinel/react-rules";

import {
  loadConfig,
} from "../config/config-loader.js";

import {
  printDiagnostics,
} from "../output/terminal-reporter.js";

import {
  printJsonReport,
} from "../output/json-reporter.js";

import type {
  OutputFormat,
} from "./options.js";

export interface AnalyzeCommandOptions {
  readonly directory: string;
  readonly selection?: RuleSelectionOptions;
  readonly format?: OutputFormat;
  readonly all?: boolean;
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

  const availableRules =
    options.all === true
      ? reactRules
      : recommendedReactRules;

  const selectedRules = selectRules(
    availableRules,
    options.selection,
  );

  const result = await analyzeProject({
    rootDirectory,
    config: loadedConfig.config,
    rules: selectedRules,
  });

  const format =
    options.format ?? "terminal";

  if (format === "json") {
    printJsonReport({
      filesAnalyzed:
        result.filesAnalyzed,
      diagnostics:
        result.diagnostics,
    });
  } else {
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
  }

  return shouldFail(
    result.diagnostics,
    loadedConfig.config.failOn,
  )
    ? 1
    : 0;
}
