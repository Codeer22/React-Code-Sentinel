import type {
  AnalysisContext,
} from "../analysis/context.js";

import type {
  Diagnostic,
} from "../types/diagnostic.js";

import type {
  Rule,
} from "../types/rule.js";

export interface RuleRunnerResult {
  readonly diagnostics: readonly Diagnostic[];
}

export function runRules(
  rules: readonly Rule[],
  context: AnalysisContext,
): RuleRunnerResult {
  const diagnostics: Diagnostic[] = [];

  for (const rule of rules) {
    const ruleDiagnostics = rule.analyze(context);

    diagnostics.push(...ruleDiagnostics);
  }

  return {
    diagnostics,
  };
}
