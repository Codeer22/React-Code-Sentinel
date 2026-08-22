export type DiagnosticSeverity =
  | "info"
  | "warning"
  | "error";

export type DiagnosticCategory =
  | "correctness"
  | "performance"
  | "maintainability"
  | "architecture"
  | "security"
  | "accessibility"
  | "react"
  | "dependencies"
  | "typescript";

export interface SourcePosition {
  readonly line: number;
  readonly column: number;
}

export interface SourceLocation {
  readonly start: SourcePosition;
  readonly end: SourcePosition;
}

export interface Diagnostic {
  readonly ruleId: string;
  readonly severity: DiagnosticSeverity;
  readonly category: DiagnosticCategory;
  readonly message: string;
  readonly filePath: string;
  readonly location?: SourceLocation;
  readonly suggestion?: string;
  readonly documentationUrl?: string;
}
