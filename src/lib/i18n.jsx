import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { useLocalStorage } from "./storage";
import { CS } from "./cs";

// The English source string is the translation key: t("Create new"). Anything
// without a Czech entry (user-entered names, unknown strings) falls back to
// itself, so untranslated text degrades to English rather than breaking.
// Placeholders look like {n} and are filled from the second argument.
export const UI_LANGUAGES = [
  { id: "en", label: "English", dateLocale: "en-GB" },
  { id: "cs", label: "Čeština", dateLocale: "cs-CZ" },
];

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useLocalStorage("cms.ui.language", "en");
  const language = UI_LANGUAGES.find((l) => l.id === lang) ?? UI_LANGUAGES[0];

  useEffect(() => {
    document.documentElement.lang = language.id;
  }, [language.id]);

  const t = useCallback(
    (text, vars) => {
      const translated = language.id === "cs" ? CS[text] ?? text : text;
      return vars ? translated.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "") : translated;
    },
    [language.id]
  );

  const value = useMemo(
    () => ({ lang: language.id, setLang, t, dateLocale: language.dateLocale }),
    [language, setLang, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
