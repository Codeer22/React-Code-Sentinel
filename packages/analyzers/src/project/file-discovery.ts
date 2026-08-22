import {
  readdir,
} from "node:fs/promises";

import {
  basename,
  join,
  relative,
  resolve,
} from "node:path";

const SOURCE_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
]);

const DEFAULT_IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  ".turbo",
]);

const DEFAULT_IGNORED_FILES = new Set([
  "react-doctor.config.js",
  "react-doctor.config.mjs",
  "react-doctor.config.cjs",
  "react-doctor.config.ts",
]);

export interface FileDiscoveryOptions {
  readonly ignoreDirectories?: readonly string[];
  readonly ignoreFiles?: readonly string[];
}

export async function discoverSourceFiles(
  rootDirectory: string,
  options: FileDiscoveryOptions = {},
): Promise<readonly string[]> {
  const root = resolve(rootDirectory);

  const ignoredDirectories = new Set([
    ...DEFAULT_IGNORED_DIRECTORIES,
    ...(options.ignoreDirectories ?? []),
  ]);

  const ignoredFiles = new Set([
    ...DEFAULT_IGNORED_FILES,
    ...(options.ignoreFiles ?? []),
  ]);

  const files: string[] = [];

  async function visit(
    directory: string,
  ): Promise<void> {
    const entries = await readdir(directory, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const absolutePath = join(
        directory,
        entry.name,
      );

      if (
        entry.isDirectory() &&
        ignoredDirectories.has(entry.name)
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        await visit(absolutePath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      if (
        ignoredFiles.has(
          basename(entry.name),
        )
      ) {
        continue;
      }

      const extension = getExtension(
        entry.name,
      );

      if (!SOURCE_EXTENSIONS.has(extension)) {
        continue;
      }

      files.push(
        relative(root, absolutePath),
      );
    }
  }

  await visit(root);

  files.sort();

  return files;
}

function getExtension(
  fileName: string,
): string {
  const lastDot =
    fileName.lastIndexOf(".");

  if (lastDot === -1) {
    return "";
  }

  return fileName
    .slice(lastDot)
    .toLowerCase();
}
