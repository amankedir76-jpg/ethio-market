import type { Locale } from "./i18n";

/** Verzeichnis aller ETHIO-Apps. Jede App ist eine eigene Website mit eigener Adresse. */
export type AppInfo = {
  key: string;
  name: Record<Locale, string>;
  url: string;      // Adresse der fertigen App, solange leer: "kommt bald"
  phase: number;
  color: string;
};

export const APPS: AppInfo[] = [
  { key: "shop", phase: 2, color: "#0b7a3e", url: "", name: { am: "ኢትዮ ሾፕ", om: "ETHIO SHOP", en: "ETHIO SHOP" } },
  { key: "jobs", phase: 3, color: "#2563eb", url: "", name: { am: "ኢትዮ ሥራ", om: "ETHIO HOJII", en: "ETHIO JOBS" } },
  { key: "services", phase: 3, color: "#0891b2", url: "", name: { am: "ኢትዮ አገልግሎቶች", om: "ETHIO TAJAAJILA", en: "ETHIO SERVICES" } },
  { key: "food", phase: 4, color: "#ea580c", url: "", name: { am: "ኢትዮ ምግብ", om: "ETHIO NYAATA", en: "ETHIO FOOD" } },
  { key: "delivery", phase: 4, color: "#a16207", url: "", name: { am: "ኢትዮ ማድረሻ", om: "ETHIO GEEJJIBA", en: "ETHIO DELIVERY" } },
  { key: "homes", phase: 5, color: "#9333ea", url: "", name: { am: "ኢትዮ ቤቶች", om: "ETHIO MANNEEN", en: "ETHIO HOMES" } },
  { key: "farm", phase: 5, color: "#16a34a", url: "", name: { am: "ኢትዮ እርሻ", om: "ETHIO QONNAA", en: "ETHIO FARM" } },
  { key: "ride", phase: 6, color: "#475569", url: "", name: { am: "ኢትዮ ጉዞ", om: "ETHIO DEEMSA", en: "ETHIO RIDE" } },
  { key: "travel", phase: 6, color: "#0d9488", url: "", name: { am: "ኢትዮ ቱሪዝም", om: "ETHIO TURIIZIMII", en: "ETHIO TRAVEL" } },
  { key: "auto", phase: 6, color: "#334155", url: "", name: { am: "ኢትዮ መኪና", om: "ETHIO KONKOLAATAA", en: "ETHIO AUTO" } },
  { key: "learn", phase: 7, color: "#4f46e5", url: "", name: { am: "ኢትዮ ትምህርት", om: "ETHIO BARNOOTA", en: "ETHIO LEARN" } },
  { key: "events", phase: 7, color: "#db2777", url: "", name: { am: "ኢትዮ ዝግጅቶች", om: "ETHIO SAGANTAA", en: "ETHIO EVENTS" } },
  { key: "wallet", phase: 8, color: "#ca8a04", url: "", name: { am: "ኢትዮ ዋሌት", om: "ETHIO WAALEETII", en: "ETHIO WALLET" } },
];
