import type {
  Diagnostic,
} from "../types/diagnostic.js";

import type {
  DoctorConfig,
} from "../config/config.js";

import type {
  SourceDocument,
} from "./document.js";

export interface ProjectContext {
  readonly rootDirectory: string;
  readonly files: readonly string[];
}

export interface AnalysisContext {
  readonly document: SourceDocument;
  readonly project: ProjectContext;
  readonly config: DoctorConfig;
  readonly diagnostics: readonly Diagnostic[];
}
