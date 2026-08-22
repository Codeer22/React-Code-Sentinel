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
  parseSource,
} from "../parser/source-parser.js";

import {
  createAstAnalysisContext,
} from "../analysis/create-ast-context.js";

import {
  discoverSourceFiles,
} from "./file-discovery.js";

import type {
  AstRule,
} from "../analysis/ast-rule.js";

export interface ProjectAnalysisOptions {
  readonly rootDirectory: string;
  readonly config?: DoctorConfig;
  readonly rules: readonly AstRule[];
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

  const discoveryOptions =
    config.exclude === undefined
      ? {}
      : {
          ignoreDirectories: config.exclude,
        };

  const files = await discoverSourceFiles(
    rootDirectory,
    discoveryOptions,
  );

  const diagnostics: Diagnostic[] = [];

  const project = {
    rootDirectory,
    files,
  };

  for (const filePath of files) {
    const absolutePath = resolve(
      rootDirectory,
      filePath,
    );

    const sourceText = await readFile(
      absolutePath,
      "utf8",
    );

    const parsed = parseSource(
      filePath,
      sourceText,
    );

    const coreContext: AnalysisContext = {
      document: {
        filePath,
        sourceText,
      },

      project,

      config,

      diagnostics,
    };

    const context =
      createAstAnalysisContext(
        coreContext,
        parsed.sourceFile,
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

