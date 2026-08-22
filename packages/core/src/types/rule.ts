import type {
  Diagnostic,
  DiagnosticCategory,
} from "./diagnostic.js";

export interface RuleContext {
  readonly filePath: string;
  readonly sourceText: string;
}

export interface Rule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: DiagnosticCategory;

  analyze(context: RuleContext): readonly Diagnostic[];
}
