import {
  readdir,
} from "node:fs/promises";

import {
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

export interface FileDiscoveryOptions {
  readonly ignoreDirectories?: readonly string[];
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

  const files: string[] = [];

  async function visit(directory: string): Promise<void> {
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

      const extension = getExtension(entry.name);

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
  const lastDot = fileName.lastIndexOf(".");

  if (lastDot === -1) {
    return "";
  }

  return fileName.slice(lastDot).toLowerCase();
}
