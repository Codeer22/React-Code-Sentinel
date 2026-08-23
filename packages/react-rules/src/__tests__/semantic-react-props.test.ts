import test from "node:test";
import assert from "node:assert/strict";

import ts from "@typescript/typescript6";

import {
  createAstAnalysisContext,
  createSemanticAnalysisContext,
} from "@react-code-sentinel/analyzers";

import type {
  SemanticRule,
} from "@react-code-sentinel/analyzers";

import {
  runRules,
} from "@react-code-sentinel/core";

test(
  "semantic analysis resolves React component props type",
  () => {
    const sourceText = `
      interface User {
        name: string;
      }

      interface UserCardProps {
        user: User;
      }

      function UserCard(
        props: UserCardProps,
      ) {
        return props.user.name;
      }
    `;

    const rootDirectory =
      process.cwd();

    const fileName =
      "semantic-react-props-test.tsx";

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

    const context =
      createSemanticAnalysisContext(
        astContext,
        program,
      );

    let resolvedPropsType = "";

    const rule: SemanticRule = {
      meta: {
        id: "test/react-props-type",
        name: "React props type probe",
        description:
          "Probes semantic React props resolution.",
        category: "react",
        kind: "semantic",
        defaultSeverity: "warning",
      },

      analyze(ruleContext) {
        let componentFunction:
          ts.FunctionDeclaration | undefined;

        for (
          const statement
            of ruleContext.sourceFile.statements
        ) {
          if (
            ts.isFunctionDeclaration(
              statement,
            ) &&
            statement.name?.text ===
              "UserCard"
          ) {
            componentFunction =
              statement;

            break;
          }
        }

        assert.ok(componentFunction);

        const propsParameter =
          componentFunction.parameters[0];

        assert.ok(propsParameter);

        assert.ok(
          ts.isIdentifier(
            propsParameter.name,
          ),
        );

        const propsType =
          ruleContext.typeChecker
            .getTypeAtLocation(
              propsParameter,
            );

        resolvedPropsType =
          ruleContext.typeChecker
            .typeToString(
              propsType,
            );

        return [];
      },
    };

    const result =
      runRules(
        [rule],
        context,
      );

    assert.equal(
      result.diagnostics.length,
      0,
    );

    assert.equal(
      resolvedPropsType,
      "UserCardProps",
    );
  },
);
