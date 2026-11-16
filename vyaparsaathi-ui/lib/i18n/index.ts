import { copy } from "./core";
import { extraCopy } from "./extra";
import { groundCopy } from "./ground";
import { moneyCopy } from "./money";
import type { Language } from "./languages";

export * from "./languages";

/** One lookup for every dictionary, so components just call useCopy(). */
export function getCopy(language: Language) {
  return {
    t: copy[language],
    money: moneyCopy[language],
    ground: groundCopy[language],
    x: extraCopy[language],
  };
}

export type AppCopy = ReturnType<typeof getCopy>;
export { copy };
