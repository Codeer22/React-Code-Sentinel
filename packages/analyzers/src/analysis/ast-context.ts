import type {
  AnalysisContext,
} from "@react-code-sentinel/core";

import type {
  SourceFile,
} from "@typescript/typescript6";

export interface AstAnalysisContext extends AnalysisContext {
  readonly sourceFile: SourceFile;
}

