import type {
  DiagnosticCategory,
} from "../types/diagnostic.js";

export interface RuleSelectionOptions {
  readonly ruleIds?: readonly string[];
  readonly categories?: readonly DiagnosticCategory[];
}

export interface SelectableRule {
  readonly id: string;
  readonly category: DiagnosticCategory;
}

export function selectRules<
  T extends SelectableRule,
>(
  rules: readonly T[],
  options: RuleSelectionOptions = {},
): readonly T[] {
  const {
    ruleIds,
    categories,
  } = options;

  return rules.filter((rule) => {
    if (
      ruleIds !== undefined &&
      ruleIds.length > 0 &&
      !ruleIds.includes(rule.id)
    ) {
      return false;
    }

    if (
      categories !== undefined &&
      categories.length > 0 &&
      !categories.includes(rule.category)
    ) {
      return false;
    }

    return true;
  });
}