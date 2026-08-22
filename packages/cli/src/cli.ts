#!/usr/bin/env node

import {
  analyzeCommand,
} from "./commands/analyze.js";

import {
  printHelp,
} from "./commands/help.js";

import {
  printRules,
} from "./commands/list-rules.js";

import {
  printVersion,
} from "./commands/version.js";

import {
  parseCliOptions,
} from "./commands/options.js";

try {
  const options = parseCliOptions(
    process.argv.slice(2),
  );

  if (options.help) {
    printHelp();
    process.exitCode = 0;
  } else if (options.version) {
    printVersion();
    process.exitCode = 0;
  } else if (options.listRules) {
    printRules();
    process.exitCode = 0;
  } else {
    const exitCode =
      await analyzeCommand({
        directory: options.directory,
        selection: {
          ruleIds: options.ruleIds,
          categories: options.categories,
        },
        format: options.format,
      });

    process.exitCode = exitCode;
  }
} catch (error) {
  console.error(
    "React Code Sentinel failed.",
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

