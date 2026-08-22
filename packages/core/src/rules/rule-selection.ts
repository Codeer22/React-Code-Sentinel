import type {
  DiagnosticCategory,
} from "../types/diagnostic.js";

import type {
  Rule,
} from "../types/rule.js";

export interface RuleSelectionOptions {
  readonly ruleIds?: readonly string[];
  readonly categories?: readonly DiagnosticCategory[];
}

export function selectRules(
  rules: readonly Rule[],
  options: RuleSelectionOptions = {},
): readonly Rule[] {
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
