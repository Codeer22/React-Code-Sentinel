import {
  reactRules,
} from "@react-doctor/react-rules";

export function printRules(): void {
  console.log("React Doctor Rules");
  console.log("");

  for (const rule of reactRules) {
    console.log(rule.id);
    console.log(`  ${rule.description}`);
    console.log(`  Category: ${rule.category}`);
    console.log("");
  }
}
