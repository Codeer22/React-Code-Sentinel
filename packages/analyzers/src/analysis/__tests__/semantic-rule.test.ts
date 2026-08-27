import test from "node:test";
import assert from "node:assert/strict";

import ts from "@typescript/typescript6";

import {
  createAstAnalysisContext,
} from "../create-ast-context.js";

import {
  createSemanticAnalysisContext,
} from "../create-semantic-context.js";

import {
  runRules,
} from "@react-code-sentinel/core";

import type {
  SemanticRule,
} from "../semantic-rule.js";

test(
  "semantic rule can use the TypeScript type checker",
  () => {
    const sourceText = `
      const count: number = 42;
    `;

    const rootDirectory =
      process.cwd();

    const fileName =
      "semantic-rule-test.ts";

    const filePath =
      ts.sys.resolvePath(
        `${rootDirectory}/${fileName}`,
      );

    const host =
      ts.createCompilerHost({
        target: ts.ScriptTarget.Latest,
        module: ts.ModuleKind.ESNext,
        noEmit: true,
      });

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
        {
          target:
            ts.ScriptTarget.Latest,

          module:
            ts.ModuleKind.ESNext,

          noEmit: true,

          skipLibCheck: true,
        },
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

    let detectedType = "";

    const rule: SemanticRule = {
      meta: {
        id: "test/semantic-type-check",
        name: "Semantic type check",
        description:
          "Test semantic type checking.",
        category: "react",
        kind: "semantic",
        defaultSeverity: "warning",
      },

      analyze(ruleContext) {
        const statement =
          ruleContext.sourceFile
            .statements[0];

        assert.ok(statement);

        assert.ok(
          ts.isVariableStatement(
            statement,
          ),
        );

        const declaration =
          statement.declarationList
            .declarations[0];

        assert.ok(declaration);

        assert.ok(
          ts.isIdentifier(
            declaration.name,
          ),
        );

        const type =
          ruleContext.typeChecker
            .getTypeAtLocation(
              declaration.name,
            );

        detectedType =
          ruleContext.typeChecker
            .typeToString(type);

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
      detectedType,
      "number",
    );
  },
);
