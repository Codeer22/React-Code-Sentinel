import type {
  AnalysisContext,
} from "@react-doctor/core";

import type {
  SourceFile,
} from "@typescript/typescript6";

export interface AstAnalysisContext extends AnalysisContext {
  readonly sourceFile: SourceFile;
}
