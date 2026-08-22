import {
  access,
} from "node:fs/promises";

import {
  join,
  resolve,
} from "node:path";

import {
  pathToFileURL,
} from "node:url";

import type {
  DoctorConfig,
} from "@react-code-sentinel/core";

export interface LoadConfigOptions {
  readonly directory: string;
}

export interface LoadedConfig {
  readonly config: DoctorConfig;
  readonly path: string | undefined;
}

const CONFIG_FILE_NAME =
  "react-code-sentinel.config.js";

export async function loadConfig(
  options: LoadConfigOptions,
): Promise<LoadedConfig> {
  const rootDirectory = resolve(
    options.directory,
  );

  const configPath = join(
    rootDirectory,
    CONFIG_FILE_NAME,
  );

  if (!(await fileExists(configPath))) {
    return {
      config: {},
      path: undefined,
    };
  }

  const module = await import(
    pathToFileURL(configPath).href
  );

  const config = module.default;

  if (
    config === null ||
    typeof config !== "object"
  ) {
    throw new Error(
      `Invalid configuration in ${configPath}: default export must be an object.`,
    );
  }

  return {
    config: config as DoctorConfig,
    path: configPath,
  };
}

async function fileExists(
  filePath: string,
): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

