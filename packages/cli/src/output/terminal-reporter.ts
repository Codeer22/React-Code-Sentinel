import type {
  Diagnostic,
} from "@react-doctor/core";

export interface ReportOptions {
  readonly color?: boolean;
}

export function printDiagnostics(
  diagnostics: readonly Diagnostic[],
  options: ReportOptions = {},
): void {
  if (diagnostics.length === 0) {
    console.log("✓ No problems found.");
    return;
  }

  console.log(
    `Found ${diagnostics.length} diagnostic(s).`,
  );

  console.log("");

  for (const diagnostic of diagnostics) {
    const location = diagnostic.location
      ? formatLocation(diagnostic)
      : diagnostic.filePath;

    console.log(
      `${diagnostic.severity.toUpperCase()} ${diagnostic.ruleId} ${location}`,
    );

    console.log(
      `  ${diagnostic.message}`,
    );

    if (diagnostic.suggestion) {
      console.log(
        `  Suggestion: ${diagnostic.suggestion}`,
      );
    }

    console.log("");
  }
}

function formatLocation(
  diagnostic: Diagnostic,
): string {
  const location = diagnostic.location;

  if (!location) {
    return diagnostic.filePath;
  }

  return [
    diagnostic.filePath,
    `${location.start.line}:${location.start.column}`,
  ].join(":");
}
