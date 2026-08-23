export const supportedLanguages = ["en", "ru"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const fallbackLanguage: SupportedLanguage = "en";
export const navigationNamespace = "navigation";
