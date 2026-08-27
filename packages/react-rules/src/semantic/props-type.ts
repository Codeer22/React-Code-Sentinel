import ts from "@typescript/typescript6";

import type {
  SemanticAnalysisContext,
} from "@react-code-sentinel/analyzers";

import type {
  ReactComponentInfo,
} from "./component-info.js";

export interface ReactPropsTypeInfo {
  readonly type:
    | ts.Type
    | undefined;

  readonly typeString: string;
}

export function getReactPropsType(
  context: SemanticAnalysisContext,
  component: ReactComponentInfo,
): ReactPropsTypeInfo {
  const parameter =
    component.propsParameter;

  if (parameter === undefined) {
    return {
      type: undefined,
      typeString: "",
    };
  }

  const type =
    context.typeChecker.getTypeAtLocation(
      parameter,
    );

  return {
    type,
    typeString:
      context.typeChecker.typeToString(
        type,
      ),
  };
}
