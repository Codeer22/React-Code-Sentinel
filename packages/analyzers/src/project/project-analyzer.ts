import {
  readFile,
} from "node:fs/promises";

import {
  resolve,
} from "node:path";

import {
  runRules,
} from "@react-code-sentinel/core";

import type {
  AnalysisContext,
  DoctorConfig,
  Diagnostic,
} from "@react-code-sentinel/core";

import {
  createAstAnalysisContext,
} from "../analysis/create-ast-context.js";

import {
  createSemanticAnalysisContext,
} from "../analysis/create-semantic-context.js";

import {
  discoverSourceFiles,
} from "./file-discovery.js";

import {
  createTypeScriptProgram,
} from "./program-builder.js";

import type {
  AnalyzerRule,
} from "../analysis/analyzer-rule.js";

export interface ProjectAnalysisOptions {
  readonly rootDirectory: string;
  readonly config?: DoctorConfig;
  readonly rules: readonly AnalyzerRule[];
}

export interface ProjectAnalysisResult {
  readonly diagnostics: readonly Diagnostic[];
  readonly filesAnalyzed: number;
}

export async function analyzeProject(
  options: ProjectAnalysisOptions,
): Promise<ProjectAnalysisResult> {
  const rootDirectory = resolve(
    options.rootDirectory,
  );

  const config = options.config ?? {};

  const discoveryOptions: {
    ignoreDirectories?: readonly string[];
    ignoreFiles?: readonly string[];
  } = {};

  if (config.exclude !== undefined) {
    discoveryOptions.ignoreDirectories =
      config.exclude;
  }

  if (config.ignore !== undefined) {
    discoveryOptions.ignoreFiles =
      config.ignore;
  }

  const files = await discoverSourceFiles(
    rootDirectory,
    discoveryOptions,
  );

  const project = {
    rootDirectory,
    files,
  };

  const program =
    await createTypeScriptProgram({
      rootDirectory,
      files,
    });

  const diagnostics: Diagnostic[] = [];

  for (const filePath of files) {
    const absolutePath = resolve(
      rootDirectory,
      filePath,
    );

    const sourceText = await readFile(
      absolutePath,
      "utf8",
    );

    const sourceFile =
      program.getSourceFile(
        absolutePath,
      );

    if (sourceFile === undefined) {
      continue;
    }

    const coreContext: AnalysisContext = {
      document: {
        filePath,
        sourceText,
      },

      project,

      config,

      diagnostics,
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

    const ruleResult = runRules(
      options.rules,
      context,
    );

    diagnostics.push(
      ...ruleResult.diagnostics,
    );
  }

  return {
    diagnostics,
    filesAnalyzed: files.length,
  };
}
