import {
  noMissingKeyRule,
} from "./components/no-missing-key.js";

import {
  noArrayIndexKeyRule,
} from "./components/no-array-index-key.js";

import {
  noUselessFragmentRule,
} from "./components/no-useless-fragment.js";

import {
  noDirectMutationStateRule,
} from "./components/no-direct-mutation-state.js";

import {
  noUnstableNestedComponentsRule,
} from "./components/no-unstable-nested-components.js";

export const reactRules = [
  noUnstableNestedComponentsRule,
  noMissingKeyRule,
  noArrayIndexKeyRule,
  noUselessFragmentRule,
  noDirectMutationStateRule,
] as const;

export const recommendedReactRules =
  reactRules.filter(
    (rule) => rule.meta.recommended === true,
  );

export function getReactRules() {
  return reactRules;
}

export function getRecommendedReactRules() {
  return recommendedReactRules;
}
