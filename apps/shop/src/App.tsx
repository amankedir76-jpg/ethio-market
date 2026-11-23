import { APPS, AppHeader, isDemoMode, useI18n } from "@ethio/core";
import { CATEGORIES } from "./categories";

const info = APPS.find((a) => a.key === "shop")!;

export function App() {
  const { t, locale } = useI18n();
  return (
    <>
      <AppHeader title={info.name[locale]} color={info.color} />
      <main style={{ padding: 16, maxWidth: 960, margin: "0 auto" }}>
        {isDemoMode && <p style={{ background: "#fff1c7", padding: 8, borderRadius: 8 }}>Demo-Modus: keine Datenbank verbunden.</p>}
        <h1 style={{ fontSize: 22 }}>{t("welcome")}</h1>
        <h2 style={{ fontSize: 18 }}>{t("cats")}</h2>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))" }}>
          {CATEGORIES.map((c) => (
            <div key={c.id} style={{ background: "#fff", border: "1px solid #e3e6ea", borderRadius: 12, padding: 10, textAlign: "center", fontSize: 13 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: c.color, margin: "0 auto 6px" }} />
              {c.name[locale]}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
