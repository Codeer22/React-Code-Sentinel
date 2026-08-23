import type {
  AstRule,
} from "./ast-rule.js";

import type {
  SemanticRule,
} from "./semantic-rule.js";

export type AnalyzerRule =
  | AstRule
  | SemanticRule;
