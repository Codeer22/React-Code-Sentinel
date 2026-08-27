import type {
  AnalysisContext,
} from "../analysis/context.js";

import type {
  Diagnostic,
  DiagnosticCategory,
  DiagnosticSeverity,
} from "../types/diagnostic.js";

export type RuleKind =
  | "ast"
  | "semantic"
  | "project";

export interface RuleMetadata {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: DiagnosticCategory;
  readonly kind: RuleKind;
  readonly defaultSeverity: DiagnosticSeverity;
  readonly docs?: string;
  readonly recommended?: boolean;
  readonly fixable?: boolean;
}

export interface RuleContext
  extends AnalysisContext {}

export interface Rule {
  readonly meta: RuleMetadata;

  analyze(
    context: RuleContext,
  ): readonly Diagnostic[];
}
