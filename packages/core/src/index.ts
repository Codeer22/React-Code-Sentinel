export type {
  Diagnostic,
  DiagnosticCategory,
  DiagnosticSeverity,
  SourceLocation,
  SourcePosition,
} from "./types/diagnostic.js";

export type {
  Rule,
  RuleContext,
} from "./types/rule.js";

export type {
  DoctorConfig,
  RuleLevel,
} from "./config/config.js";

export type {
  SourceDocument,
  SourcePosition as AnalysisSourcePosition,
  SourceRange,
} from "./analysis/document.js";

export type {
  AnalysisContext,
  ProjectContext,
} from "./analysis/context.js";

export {
  runRules,
} from "./rules/rule-runner.js";

export type {
  RuleRunnerResult,
} from "./rules/rule-runner.js";

export {
  selectRules,
} from "./rules/rule-selection.js";

export type {
  RuleSelectionOptions,
} from "./rules/rule-selection.js";

