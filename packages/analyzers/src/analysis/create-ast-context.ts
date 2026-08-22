import type {
  AnalysisContext,
} from "@react-doctor/core";

import type {
  SourceFile,
} from "@typescript/typescript6";

import type {
  AstAnalysisContext,
} from "./ast-context.js";

export function createAstAnalysisContext(
  context: AnalysisContext,
  sourceFile: SourceFile,
): AstAnalysisContext {
  return {
    ...context,
    sourceFile,
  };
}
