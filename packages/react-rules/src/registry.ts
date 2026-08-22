import {
  noUnstableNestedComponentsRule,
} from "./components/no-unstable-nested-components.js";

export const reactRules = [
  noUnstableNestedComponentsRule,
] as const;
