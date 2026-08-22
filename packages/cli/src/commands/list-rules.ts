import {
  reactRules,
} from "@react-code-sentinel/react-rules";

export function printRules(): void {
  console.log("React Code Sentinel Rules");
  console.log("");

  for (const rule of reactRules) {
    console.log(rule.meta.id);
    console.log(`  ${rule.meta.description}`);
    console.log(`  Category: ${rule.meta.category}`);
    console.log(`  Kind: ${rule.meta.kind}`);
    console.log(
      `  Severity: ${rule.meta.defaultSeverity}`,
    );
    console.log(
      `  Recommended: ${rule.meta.recommended === true ? "yes" : "no"}`,
    );
    console.log(
      `  Fixable: ${rule.meta.fixable === true ? "yes" : "no"}`,
    );
    console.log("");
  }
}
