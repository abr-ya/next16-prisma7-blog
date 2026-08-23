import type { I18nConfig } from "next-i18next/proxy";

import { fallbackLanguage, navigationNamespace, supportedLanguages } from "@/app/i18n/settings";

const i18nConfig: I18nConfig = {
  supportedLngs: [...supportedLanguages],
  fallbackLng: fallbackLanguage,
  defaultNS: navigationNamespace,
  ns: [navigationNamespace],
  localeInPath: false,
  resourceLoader: (language, namespace) => import(`./app/i18n/locales/${language}/${namespace}.json`),
};

export default i18nConfig;
