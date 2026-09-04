import type {
  DiagnosticCategory,
} from "@react-code-sentinel/core";

export type OutputFormat =
  | "terminal"
  | "json";

export interface CliOptions {
  readonly directory: string;
  readonly ruleIds: readonly string[];
  readonly categories: readonly DiagnosticCategory[];
  readonly format: OutputFormat;
  readonly help: boolean;
  readonly version: boolean;
  readonly listRules: boolean;
  readonly all: boolean;
}

export function parseCliOptions(
  args: readonly string[],
): CliOptions {
  let directory = ".";
  let format: OutputFormat = "terminal";

  const ruleIds: string[] = [];
  const categories: DiagnosticCategory[] = [];

  let directorySet = false;
  let help = false;
  let version = false;
  let listRules = false;
  let all = false;

  for (
    let index = 0;
    index < args.length;
    index += 1
  ) {
    const argument = args[index];

    if (argument === undefined) {
      continue;
    }

    if (argument === "--help" || argument === "-h") {
      help = true;
      continue;
    }

    if (
      argument === "--version" ||
      argument === "-v"
    ) {
      version = true;
      continue;
    }

    if (argument === "--list-rules") {
      listRules = true;
      continue;
    }

    if (argument === "--all") {
      all = true;
      continue;
    }

    if (argument === "--rule") {
      const ruleId = args[index + 1];

      if (ruleId === undefined) {
        throw new Error(
          "--rule requires a rule ID.",
        );
      }

      ruleIds.push(ruleId);
      index += 1;
      continue;
    }

    if (argument === "--category") {
      const category = args[index + 1];

      if (category === undefined) {
        throw new Error(
          "--category requires a category.",
        );
      }

      if (!isDiagnosticCategory(category)) {
        throw new Error(
          `Unknown diagnostic category: ${category}`,
        );
      }

      categories.push(category);
      index += 1;
      continue;
    }

    if (argument === "--format") {
      const value = args[index + 1];

      if (value === undefined) {
        throw new Error(
          "--format requires a format.",
        );
      }

      if (
        value !== "terminal" &&
        value !== "json"
      ) {
        throw new Error(
          `Unknown output format: ${value}`,
        );
      }

      format = value;
      index += 1;
      continue;
    }

    if (argument.startsWith("--")) {
      throw new Error(
        `Unknown option: ${argument}`,
      );
    }

    if (!directorySet) {
      directory = argument;
      directorySet = true;
      continue;
    }

    throw new Error(
      `Unexpected argument: ${argument}`,
    );
  }

  return {
    directory,
    ruleIds,
    categories,
    format,
    help,
    version,
    listRules,
    all,
  };
}

function isDiagnosticCategory(
  value: string,
): value is DiagnosticCategory {
  return (
    value === "correctness" ||
    value === "performance" ||
    value === "maintainability" ||
    value === "architecture" ||
    value === "security" ||
    value === "accessibility" ||
    value === "react" ||
    value === "dependencies" ||
    value === "typescript"
  );
}
