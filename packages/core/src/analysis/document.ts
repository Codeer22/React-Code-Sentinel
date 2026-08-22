export interface SourceDocument {
  readonly filePath: string;
  readonly sourceText: string;
}

export interface SourcePosition {
  readonly line: number;
  readonly column: number;
}

export interface SourceRange {
  readonly start: SourcePosition;
  readonly end: SourcePosition;
}
