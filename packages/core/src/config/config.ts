import type {
  DiagnosticSeverity,
} from "../types/diagnostic.js";

export type RuleLevel =
  | "off"
  | DiagnosticSeverity;

export interface DoctorConfig {
  readonly rules?: Readonly<Record<string, RuleLevel>>;
  readonly ignore?: readonly string[];
  readonly include?: readonly string[];
  readonly exclude?: readonly string[];
  readonly failOn?: DiagnosticSeverity;
}
