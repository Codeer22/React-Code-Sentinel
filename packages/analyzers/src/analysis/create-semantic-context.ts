import type ts from "@typescript/typescript6";

import type {
  AstAnalysisContext,
} from "./ast-context.js";

import type {
  SemanticAnalysisContext,
} from "./semantic-context.js";

export function createSemanticAnalysisContext(
  context: AstAnalysisContext,
  program: ts.Program,
): SemanticAnalysisContext {
  const typeChecker =
    program.getTypeChecker();

  return {
    ...context,
    program,
    typeChecker,
  };
}
