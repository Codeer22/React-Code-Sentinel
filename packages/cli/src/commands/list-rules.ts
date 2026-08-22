import {
  reactRules,
} from "@react-code-sentinel/react-rules";

export function printRules(): void {
  console.log("React Code Sentinel Rules");
  console.log("");

  for (const rule of reactRules) {
    console.log(rule.id);
    console.log(`  ${rule.description}`);
    console.log(`  Category: ${rule.category}`);
    console.log("");
  }
}

