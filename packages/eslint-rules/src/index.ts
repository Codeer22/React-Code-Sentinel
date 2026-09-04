import type {
  Diagnostic,
} from "@react-code-sentinel/core";

export interface ReactDoctorLintMessage {
  readonly ruleId: string;
  readonly severity: 1 | 2;
  readonly message: string;
  readonly filePath: string;
  readonly line: number;
  readonly column: number;
}

export function diagnosticToLintMessage(
  diagnostic: Diagnostic,
): ReactDoctorLintMessage {
  return {
    ruleId: diagnostic.ruleId,

    severity:
      diagnostic.severity === "error"
        ? 2
        : 1,

    message: diagnostic.message,

    filePath: diagnostic.filePath,

    line:
      diagnostic.location?.start.line ??
      1,

    column:
      diagnostic.location?.start.column ??
      1,
  };
}

