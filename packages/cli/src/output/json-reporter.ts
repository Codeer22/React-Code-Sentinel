import type {
  Diagnostic,
} from "@react-doctor/core";

export interface JsonReport {
  readonly filesAnalyzed: number;
  readonly diagnostics: readonly Diagnostic[];
}

export function printJsonReport(
  report: JsonReport,
): void {
  console.log(
    JSON.stringify(
      report,
      null,
      2,
    ),
  );
}
