import type {
  Diagnostic,
  RuleMetadata,
} from "@react-code-sentinel/core";

import type {
  SemanticAnalysisContext,
} from "./semantic-context.js";

export interface SemanticRule {
  readonly meta: RuleMetadata;

  analyze(
    context: SemanticAnalysisContext,
  ): readonly Diagnostic[];
}
