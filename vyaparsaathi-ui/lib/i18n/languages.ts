export const languageOptions = [
  { code: "English", label: "English" },
  { code: "Hindi", label: "हिन्दी" },
  { code: "Marathi", label: "मराठी" },
  { code: "Gujarati", label: "ગુજરાતી" },
  { code: "Bengali", label: "বাংলা" },
] as const;

export type Language = (typeof languageOptions)[number]["code"];

export const languageCodes: Record<Language, string> = { English: "en", Hindi: "hi", Marathi: "mr", Gujarati: "gu", Bengali: "bn" };
export const speechLanguage: Record<Language, string> = { English: "en-IN", Hindi: "hi-IN", Marathi: "mr-IN", Gujarati: "gu-IN", Bengali: "bn-IN" };

export function isLanguage(value: string): value is Language {
  return languageOptions.some((option) => option.code === value);
}
