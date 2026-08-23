import test from "node:test";
import assert from "node:assert/strict";

import ts from "@typescript/typescript6";

import {
  createAstAnalysisContext,
  createSemanticAnalysisContext,
} from "@react-code-sentinel/analyzers";

import {
  noUnsafePropAccessRule,
} from "../components/no-unsafe-prop-access.js";

function createContext(
  sourceText: string,
) {
  const rootDirectory =
    process.cwd();

  const fileName =
    "unsafe-prop-access-test.tsx";

  const filePath =
    ts.sys.resolvePath(
      `${rootDirectory}/${fileName}`,
    );

  const compilerOptions:
    ts.CompilerOptions = {
      target:
        ts.ScriptTarget.Latest,

      module:
        ts.ModuleKind.ESNext,

      jsx:
        ts.JsxEmit.Preserve,

      noEmit: true,

      skipLibCheck: true,
    };

  const host =
    ts.createCompilerHost(
      compilerOptions,
    );

  const originalReadFile =
    host.readFile;

  const originalFileExists =
    host.fileExists;

  host.fileExists = (
    fileNameToCheck,
  ) => {
    if (
      ts.sys.resolvePath(
        fileNameToCheck,
      ) === filePath
    ) {
      return true;
    }

    return originalFileExists(
      fileNameToCheck,
    );
  };

  host.readFile = (
    fileNameToRead,
  ) => {
    if (
      ts.sys.resolvePath(
        fileNameToRead,
      ) === filePath
    ) {
      return sourceText;
    }

    return originalReadFile(
      fileNameToRead,
    );
  };

  const program =
    ts.createProgram(
      [filePath],
      compilerOptions,
      host,
    );

  const sourceFile =
    program.getSourceFile(
      filePath,
    );

  assert.ok(sourceFile);

  const astContext =
    createAstAnalysisContext(
      {
        document: {
          filePath: fileName,
          sourceText,
        },

        project: {
          rootDirectory,
          files: [fileName],
        },

        config: {},

        diagnostics: [],
      },
      sourceFile,
    );

  return createSemanticAnalysisContext(
    astContext,
    program,
  );
}

test(
  "reports unsafe prop access",
  () => {
    const context =
      createContext(`
        function UserCard(
          props: any,
        ) {
          return props.name;
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      1,
    );

    assert.equal(
      diagnostics[0]?.ruleId,
      "react/no-unsafe-prop-access",
    );
  },
);

test(
  "accepts safely typed props",
  () => {
    const context =
      createContext(`
        interface UserCardProps {
          name: string;
        }

        function UserCard(
          props: UserCardProps,
        ) {
          return props.name;
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      0,
    );
  },
);

test(
  "ignores lowercase helper functions",
  () => {
    const context =
      createContext(`
        function getUser(
          props: any,
        ) {
          return props.name;
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      0,
    );
  },
);

test(
  "ignores shadowed props parameters",
  () => {
    const context =
      createContext(`
        interface CardProps {
          title: string;
        }

        interface OtherProps {
          value: any;
        }

        function Card(
          props: CardProps,
        ) {
          function render(
            props: OtherProps,
          ) {
            return props.value;
          }

          return props.title;
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      0,
    );
  },
);

test(
  "reports captured outer props in nested functions",
  () => {
    const context =
      createContext(`
        function Card(
          props: any,
        ) {
          function render() {
            return props.title;
          }

          return render();
        }
      `);

    const diagnostics =
      noUnsafePropAccessRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      1,
    );

    assert.equal(
      diagnostics[0]?.ruleId,
      "react/no-unsafe-prop-access",
    );
  },
);
