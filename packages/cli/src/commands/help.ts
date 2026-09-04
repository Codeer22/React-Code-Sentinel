export function printHelp(): void {
  console.log("React Code Sentinel");
  console.log("");
  console.log("Diagnose React codebase health.");
  console.log("");
  console.log("Usage:");
  console.log("  react-code-sentinel [options] [directory]");
  console.log("");
  console.log("Options:");
  console.log("  -h, --help                 Display help");
  console.log("  -v, --version              Display version");
  console.log("      --list-rules           List available rules");
  console.log("      --all                  Run all registered rules");
  console.log("      --rule <id>            Run a specific rule");
  console.log("      --category <category>  Run rules in a category");
  console.log("      --format <format>      Output format: terminal | json");
  console.log("");
  console.log("Examples:");
  console.log("  react-code-sentinel .");
  console.log("  react-code-sentinel . --all");
  console.log("  react-code-sentinel . --rule react/no-unstable-nested-components");
  console.log("  react-code-sentinel . --category react");
  console.log("");
}
