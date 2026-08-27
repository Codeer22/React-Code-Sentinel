import type {
  Diagnostic,
  RuleMetadata,
} from "@react-code-sentinel/core";

import type {
  AstAnalysisContext,
} from "./ast-context.js";

export interface AstRule {
  readonly meta: RuleMetadata;

  analyze(
    context: AstAnalysisContext,
  ): readonly Diagnostic[];
}
