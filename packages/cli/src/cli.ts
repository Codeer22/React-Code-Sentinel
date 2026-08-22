#!/usr/bin/env node

import {
  analyzeCommand,
} from "./commands/analyze.js";

import {
  parseCliOptions,
} from "./commands/options.js";

try {
  const options = parseCliOptions(
    process.argv.slice(2),
  );

  const exitCode =
    await analyzeCommand({
      directory: options.directory,
      selection: {
        ruleIds: options.ruleIds,
        categories: options.categories,
      },
    });

  process.exitCode = exitCode;
} catch (error) {
  console.error(
    "React Doctor failed.",
  );

  if (error instanceof Error) {
    console.error(
      error.message,
    );
  } else {
    console.error(error);
  }

  process.exitCode = 2;
}
