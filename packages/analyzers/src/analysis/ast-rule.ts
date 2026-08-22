import type {
  Diagnostic,
  DiagnosticCategory,
} from "@react-doctor/core";

import type {
  AstAnalysisContext,
} from "./ast-context.js";

export interface AstRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: DiagnosticCategory;

  analyze(
    context: AstAnalysisContext,
  ): readonly Diagnostic[];
}
