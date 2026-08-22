import type {
  DiagnosticCategory,
} from "@react-doctor/core";

export interface CliOptions {
  readonly directory: string;
  readonly ruleIds: readonly string[];
  readonly categories: readonly DiagnosticCategory[];
}

export function parseCliOptions(
  args: readonly string[],
): CliOptions {
  let directory = ".";
  const ruleIds: string[] = [];
  const categories: DiagnosticCategory[] = [];

  let directorySet = false;

  for (
    let index = 0;
    index < args.length;
    index += 1
  ) {
    const argument = args[index];

    if (argument === undefined) {
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
