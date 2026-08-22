export function printHelp(): void {
  console.log(
    [
      "React Code Sentinel",
      "",
      "Diagnose React codebase health.",
      "",
      "Usage:",
      "  react-code-sentinel [directory]",
      "",
      "Options:",
      "  --help, -h             Show help",
      "  --version, -v          Show version",
      "  --list-rules           List available rules",
      "  --rule <rule-id>       Run a specific rule",
      "  --category <category>  Run rules in a category",
      "  --format <format>      Output format: terminal or json",
      "",
    ].join("\n"),
  );
}

