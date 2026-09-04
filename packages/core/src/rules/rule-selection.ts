import type {
  DiagnosticCategory,
} from "../types/diagnostic.js";

import type {
  RuleMetadata,
} from "./rule-types.js";

export interface RuleSelectionOptions {
  readonly ruleIds?: readonly string[];
  readonly categories?: readonly DiagnosticCategory[];
}

export function selectRules<
  T extends {
    readonly meta: RuleMetadata;
  },
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
      !ruleIds.includes(rule.meta.id)
    ) {
      return false;
    }

    if (
      categories !== undefined &&
      categories.length > 0 &&
      !categories.includes(rule.meta.category)
    ) {
      return false;
    }

    return true;
  });
}
