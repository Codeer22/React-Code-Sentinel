#!/usr/bin/env node

import {
  analyzeCommand,
} from "./commands/analyze.js";

const directory =
  process.argv[2] ?? ".";

try {
  const exitCode =
    await analyzeCommand({
      directory,
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
