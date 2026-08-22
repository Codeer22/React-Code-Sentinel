import type {
  AnalysisContext,
} from "../analysis/context.js";

import type {
  Diagnostic,
  DiagnosticSeverity,
} from "../types/diagnostic.js";

import type {
  Rule,
} from "../types/rule.js";

export interface RuleRunnerResult {
  readonly diagnostics: readonly Diagnostic[];
}

export function runRules<
  TContext extends AnalysisContext,
  TRule extends RuleLike<TContext>,
>(
  rules: readonly TRule[],
  context: TContext,
): RuleRunnerResult {
  const diagnostics: Diagnostic[] = [];

  for (const rule of rules) {
    const level =
      context.config.rules?.[rule.id];

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

interface RuleLike<
  TContext extends AnalysisContext,
> {
  readonly id: string;
  analyze(
    context: TContext,
  ): readonly Diagnostic[];
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