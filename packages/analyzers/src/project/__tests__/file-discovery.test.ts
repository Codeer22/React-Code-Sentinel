import {
  mkdtemp,
  mkdir,
  rm,
  writeFile,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  strict as assert,
} from "node:assert";

import test from "node:test";

import {
  discoverSourceFiles,
} from "../file-discovery.js";

test(
  "discovers supported source files",
  async () => {
    const directory =
      await mkdtemp(
        join(
          tmpdir(),
          "react-code-sentinel-discovery-",
        ),
      );

    try {
      await writeFile(
        join(directory, "App.tsx"),
        "",
        "utf8",
      );

      await writeFile(
        join(directory, "utils.js"),
        "",
        "utf8",
      );

      await writeFile(
        join(directory, "component.jsx"),
        "",
        "utf8",
      );

      await writeFile(
        join(directory, "types.ts"),
        "",
        "utf8",
      );

      await writeFile(
        join(directory, "README.md"),
        "",
        "utf8",
      );

      const files =
        await discoverSourceFiles(
          directory,
        );

      assert.deepEqual(
        files,
        [
          "App.tsx",
          "component.jsx",
          "types.ts",
          "utils.js",
        ],
      );
    } finally {
      await rm(
        directory,
        {
          recursive: true,
          force: true,
        },
      );
    }
  },
);

test(
  "ignores React Code Sentinel config files",
  async () => {
    const directory =
      await mkdtemp(
        join(
          tmpdir(),
          "react-code-sentinel-discovery-",
        ),
      );

    try {
      await writeFile(
        join(directory, "App.tsx"),
        "",
        "utf8",
      );

      await writeFile(
        join(
          directory,
          "react-code-sentinel.config.js",
        ),
        "export default {};",
        "utf8",
      );

      await writeFile(
        join(
          directory,
          "react-code-sentinel.config.mjs",
        ),
        "export default {};",
        "utf8",
      );

      const files =
        await discoverSourceFiles(
          directory,
        );

      assert.deepEqual(
        files,
        ["App.tsx"],
      );
    } finally {
      await rm(
        directory,
        {
          recursive: true,
          force: true,
        },
      );
    }
  },
);

test(
  "ignores configured directories",
  async () => {
    const directory =
      await mkdtemp(
        join(
          tmpdir(),
          "react-code-sentinel-discovery-",
        ),
      );

    try {
      const ignoredDirectory =
        join(
          directory,
          "generated",
        );

      await mkdir(
        ignoredDirectory,
        {
          recursive: true,
        },
      );

      await writeFile(
        join(directory, "App.tsx"),
        "",
        "utf8",
      );

      await writeFile(
        join(
          ignoredDirectory,
          "Generated.tsx",
        ),
        "",
        "utf8",
      );

      const files =
        await discoverSourceFiles(
          directory,
          {
            ignoreDirectories: [
              "generated",
            ],
          },
        );

      assert.deepEqual(
        files,
        ["App.tsx"],
      );
    } finally {
      await rm(
        directory,
        {
          recursive: true,
          force: true,
        },
      );
    }
  },
);

test(
  "ignores configured files",
  async () => {
    const directory =
      await mkdtemp(
        join(
          tmpdir(),
          "react-code-sentinel-discovery-",
        ),
      );

    try {
      await writeFile(
        join(directory, "App.tsx"),
        "",
        "utf8",
      );

      await writeFile(
        join(directory, "Generated.tsx"),
        "",
        "utf8",
      );

      const files =
        await discoverSourceFiles(
          directory,
          {
            ignoreFiles: [
              "Generated.tsx",
            ],
          },
        );

      assert.deepEqual(
        files,
        ["App.tsx"],
      );
    } finally {
      await rm(
        directory,
        {
          recursive: true,
          force: true,
        },
      );
    }
  },
);

