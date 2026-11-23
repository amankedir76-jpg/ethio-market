import { LOCALES, useI18n } from "./i18n";

/** Gemeinsame Kopfzeile: gleiche Optik und Sprachwahl in jeder App. */
export function AppHeader({ title, color }: { title: string; color: string }) {
  const { locale, setLocale } = useI18n();
  return (
    <header style={{ background: color, color: "#fff", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <strong style={{ fontSize: 20, flex: 1 }}>{title}</strong>
      <select
        aria-label="Language"
        value={locale}
        onChange={(e) => setLocale(e.target.value as typeof locale)}
        style={{ borderRadius: 8, padding: "6px 8px", border: 0 }}
      >
        {LOCALES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>
    </header>
  );
}
