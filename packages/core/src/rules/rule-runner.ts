import type {
  AnalysisContext,
} from "../analysis/context.js";

import type {
  Diagnostic,
  DiagnosticSeverity,
} from "../types/diagnostic.js";

import type {
  RuleMetadata,
} from "./rule-types.js";

export interface RuleLike<
  TContext extends AnalysisContext = AnalysisContext,
> {
  readonly meta: RuleMetadata;

  analyze(
    context: TContext,
  ): readonly Diagnostic[];
}

export interface RuleRunnerResult {
  readonly diagnostics: readonly Diagnostic[];
}

export function runRules<
  TContext extends AnalysisContext,
>(
  rules: readonly RuleLike<TContext>[],
  context: TContext,
): RuleRunnerResult {
  const diagnostics: Diagnostic[] = [];

  for (const rule of rules) {
    const level =
      context.config.rules?.[rule.meta.id];

    if (level === "off") {
      continue;
    }

    const ruleDiagnostics =
      rule.analyze(context);

    const diagnosticsWithSeverity =
      level === undefined
        ? ruleDiagnostics
        : applySeverity(
            ruleDiagnostics,
            level,
          );

    diagnostics.push(
      ...diagnosticsWithSeverity,
    );
  }

  return {
    diagnostics,
  };
}

function applySeverity(
  diagnostics: readonly Diagnostic[],
  severity: DiagnosticSeverity,
): readonly Diagnostic[] {
  return diagnostics.map(
    (diagnostic) => ({
      ...diagnostic,
      severity,
    }),
  );
}
