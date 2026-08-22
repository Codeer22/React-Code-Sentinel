import type {
  Diagnostic,
  DiagnosticCategory,
} from "./diagnostic.js";

import type {
  AnalysisContext,
} from "../analysis/context.js";

export interface RuleContext extends AnalysisContext {}

export interface Rule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: DiagnosticCategory;

  analyze(context: RuleContext): readonly Diagnostic[];
}
