import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function findTestFiles(directory) {
  const files = [];

  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      files.push(...findTestFiles(path));
    } else if (path.endsWith(".test.js")) {
      files.push(path);
    }
  }

  return files;
}

const testFiles = findTestFiles("dist-test");

if (testFiles.length === 0) {
  console.error("No compiled test files found.");
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ["--test", ...testFiles],
  {
    stdio: "inherit",
  },
);

process.exit(result.status ?? 1);
