import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "am" | "om" | "en";
export type Texts = Record<Locale, Record<string, string>>;
export const LOCALES: { code: Locale; label: string }[] = [
  { code: "am", label: "አማርኛ" },
  { code: "om", label: "Afaan Oromoo" },
  { code: "en", label: "English" },
];

/** Texte, die alle Apps brauchen. Jede App ergänzt ihre eigenen. */
export const coreTexts: Texts = {
  am: { login: "ግባ", logout: "ውጣ", search: "ፈልግ", account: "መለያ", allApps: "ሁሉም አገልግሎቶች" },
  om: { login: "Seeni", logout: "Ba'i", search: "Barbaadi", account: "Herrega", allApps: "Tajaajiloota hunda" },
  en: { login: "Log in", logout: "Log out", search: "Search", account: "Account", allApps: "All services" },
};

const STORAGE_KEY = "ethio.locale";
type Ctx = { locale: Locale; setLocale: (l: Locale) => void; t: (key: string) => string };
const I18nContext = createContext<Ctx | null>(null);

function readLocale(): Locale {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "am" || v === "om" || v === "en") return v;
  } catch { /* Speicher evtl. gesperrt */ }
  return "am";
}

export function I18nProvider({ texts, children }: { texts: Texts; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readLocale);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* ignorieren */ }
  };
  // App-Texte überschreiben Kern-Texte; fehlt ein Text, wird Englisch und dann der Schlüssel gezeigt
  const t = (key: string) =>
    texts[locale]?.[key] ?? coreTexts[locale]?.[key] ?? texts.en?.[key] ?? coreTexts.en[key] ?? key;
  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n muss innerhalb von <I18nProvider> stehen");
  return ctx;
}
