import type { GenerationError, ValidationIssue } from "@/lib/game";
import type { Translate } from "./core";
import type { MessageKey } from "./messages";

/** Translates a word-set validation issue using its code and params. */
export function issueMessage(t: Translate, issue: ValidationIssue): string {
  const params = { ...(issue.params ?? {}) };
  if (issue.code === "invalidCharacters") {
    const chars = [...String(params.chars ?? "")];
    params.chars = chars.map((c) => (c === " " ? t("validation.spaces") : `“${c}”`)).join(", ");
  }
  return t(`validation.${issue.code}` as MessageKey, params);
}

/** Translates a board-generation failure. */
export function generationMessage(t: Translate, error: GenerationError): string {
  return t(`generation.${error.code}` as MessageKey, { word: error.word ?? "" });
}
