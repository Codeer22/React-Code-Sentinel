import type ts from "@typescript/typescript6";

import type {
  AstAnalysisContext,
} from "./ast-context.js";

export interface SemanticAnalysisContext
  extends AstAnalysisContext {
  readonly program: ts.Program;
  readonly typeChecker: ts.TypeChecker;
}
