import type {
  Diagnostic,
  DiagnosticSeverity,
} from "@react-code-sentinel/core";

export function shouldFail(
  diagnostics: readonly Diagnostic[],
  failOn: DiagnosticSeverity | undefined,
): boolean {
  if (diagnostics.length === 0) {
    return false;
  }

  if (failOn === undefined) {
    return true;
  }

  if (failOn === "info") {
    return true;
  }

  if (failOn === "warning") {
    return diagnostics.some(
      (diagnostic) =>
        diagnostic.severity === "warning" ||
        diagnostic.severity === "error",
    );
  }

  return diagnostics.some(
    (diagnostic) =>
      diagnostic.severity === "error",
  );
}
