import test from "node:test";
import assert from "node:assert/strict";

import ts from "@typescript/typescript6";

import {
  createAstAnalysisContext,
  createSemanticAnalysisContext,
} from "@react-code-sentinel/analyzers";

import {
  noImplicitAnyPropsRule,
} from "../components/no-implicit-any-props.js";

function createSemanticContext(
  sourceText: string,
  fileName = "implicit-any-props-test.tsx",
) {
  const rootDirectory =
    process.cwd();

  const filePath =
    ts.sys.resolvePath(
      `${rootDirectory}/${fileName}`,
    );

  const compilerOptions: ts.CompilerOptions = {
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
    program.getSourceFile(filePath);

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
  "reports component props resolving to any",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(props) {
          return props.name;
        }
      `);

    const diagnostics =
      noImplicitAnyPropsRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      1,
    );

    assert.equal(
      diagnostics[0]?.ruleId,
      "react/no-implicit-any-props",
    );

    assert.match(
      diagnostics[0]?.message ?? "",
      /UserCard/,
    );
  },
);

test(
  "accepts explicitly typed component props",
  () => {
    const context =
      createSemanticContext(`
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
      noImplicitAnyPropsRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      0,
    );
  },
);

test(
  "reports explicitly any-typed component props",
  () => {
    const context =
      createSemanticContext(`
        function UserCard(
          props: any,
        ) {
          return props.name;
        }
      `);

    const diagnostics =
      noImplicitAnyPropsRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      1,
    );
  },
);

test(
  "ignores lowercase helper functions",
  () => {
    const context =
      createSemanticContext(`
        function getUser(props) {
          return props.name;
        }
      `);

    const diagnostics =
      noImplicitAnyPropsRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      0,
    );
  },
);

test(
  "reports arrow-function components with any props",
  () => {
    const context =
      createSemanticContext(`
        const UserCard = (props) => {
          return props.name;
        };
      `);

    const diagnostics =
      noImplicitAnyPropsRule.analyze(
        context,
      );

    assert.equal(
      diagnostics.length,
      1,
    );
  },
);
