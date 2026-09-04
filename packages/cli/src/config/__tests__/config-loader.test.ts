import {
  strict as assert,
} from "node:assert";

import {
  mkdtemp,
  rm,
  writeFile,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import test from "node:test";

import {
  loadConfig,
} from "../config-loader.js";

test(
  "returns empty config when no config exists",
  async () => {
    const directory =
      await mkdtemp(
        join(
          tmpdir(),
          "react-code-sentinel.config-",
        ),
      );

    try {
      const result =
        await loadConfig({
          directory,
        });

      assert.deepEqual(
        result.config,
        {},
      );

      assert.equal(
        result.path,
        undefined,
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
  "loads default configuration",
  async () => {
    const directory =
      await mkdtemp(
        join(
          tmpdir(),
          "react-code-sentinel.config-",
        ),
      );

    try {
      await writeFile(
        join(
          directory,
          "react-code-sentinel.config.js",
        ),
        [
          "export default {",
          "  rules: {",
          '    "react/no-unstable-nested-components": "error"',
          "  }",
          "};",
        ].join("\n"),
        "utf8",
      );

      const result =
        await loadConfig({
          directory,
        });

      assert.equal(
        result.config.rules?.[
          "react/no-unstable-nested-components"
        ],
        "error",
      );

      assert.equal(
        result.path,
        join(
          directory,
          "react-code-sentinel.config.js",
        ),
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
  "loads configuration from an mjs file",
  async () => {
    const directory =
      await mkdtemp(
        join(
          tmpdir(),
          "react-code-sentinel.config-",
        ),
      );

    try {
      await writeFile(
        join(
          directory,
          "react-code-sentinel.config.mjs",
        ),
        [
          "export default {",
          "  rules: {",
          '    "react/no-unsafe-prop-access": "error"',
          "  }",
          "};",
        ].join("\n"),
        "utf8",
      );

      const result =
        await loadConfig({
          directory,
        });

      assert.equal(
        result.config.rules?.[
          "react/no-unsafe-prop-access"
        ],
        "error",
      );

      assert.equal(
        result.path,
        join(
          directory,
          "react-code-sentinel.config.mjs",
        ),
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
  "loads configuration from a cjs file",
  async () => {
    const directory =
      await mkdtemp(
        join(
          tmpdir(),
          "react-code-sentinel.config-",
        ),
      );

    try {
      await writeFile(
        join(
          directory,
          "react-code-sentinel.config.cjs",
        ),
        [
          "module.exports = {",
          "  rules: {",
          '    "react/no-unsafe-prop-access": "error"',
          "  }",
          "};",
        ].join("\n"),
        "utf8",
      );

      const result =
        await loadConfig({
          directory,
        });

      assert.equal(
        result.config.rules?.[
          "react/no-unsafe-prop-access"
        ],
        "error",
      );

      assert.equal(
        result.path,
        join(
          directory,
          "react-code-sentinel.config.cjs",
        ),
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

// test(
//   "loads configuration from a module without a default export",
//   async () => {
//     const directory =
//       await mkdtemp(
//         join(
//           tmpdir(),
//           "react-code-sentinel.config-",
//         ),
//       );

//     try {
//       await writeFile(
//         join(
//           directory,
//           "react-code-sentinel.config.js",
//         ),
//         [
//           "export const rules = {",
//           '  "react/no-unsafe-prop-access": "error"',
//           "};",
//         ].join("\n"),
//         "utf8",
//       );

//       const result =
//         await loadConfig({
//           directory,
//         });

//       assert.equal(
//         result.config.rules?.[
//           "react/no-unsafe-prop-access"
//         ],
//         "error",
//       );
//     } finally {
//       await rm(
//         directory,
//         {
//           recursive: true,
//           force: true,
//         },
//       );
//     }
//   },
// );

test(
  "rejects a module without a default export",
  async () => {
    const directory =
      await mkdtemp(
        join(
          tmpdir(),
          "react-code-sentinel.config-",
        ),
      );

    try {
      await writeFile(
        join(
          directory,
          "react-code-sentinel.config.js",
        ),
        [
          "export const rules = {",
          '  "react/no-unsafe-prop-access": "error"',
          "};",
        ].join("\n"),
        "utf8",
      );

      await assert.rejects(
        loadConfig({
          directory,
        }),
        {
          message:
            /Invalid configuration.*default export must be an object/,
        },
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
  "rejects invalid default configuration",
  async () => {
    const directory =
      await mkdtemp(
        join(
          tmpdir(),
          "react-code-sentinel.config-",
        ),
      );

    try {
      await writeFile(
        join(
          directory,
          "react-code-sentinel.config.js",
        ),
        "export default null;",
        "utf8",
      );

      await assert.rejects(
        loadConfig({
          directory,
        }),
        {
          message:
            /Invalid configuration.*default export must be an object/,
        },
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
