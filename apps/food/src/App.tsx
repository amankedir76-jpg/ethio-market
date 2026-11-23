import { APPS, AppHeader, isDemoMode, useI18n } from "@ethio/core";

const info = APPS.find((a) => a.key === "food")!;

export function App() {
  const { t, locale } = useI18n();
  return (
    <>
      <AppHeader title={info.name[locale]} color={info.color} />
      <main style={{ padding: 16, maxWidth: 960, margin: "0 auto" }}>
        {isDemoMode && <p style={{ background: "#fff1c7", padding: 8, borderRadius: 8 }}>Demo-Modus: keine Datenbank verbunden.</p>}
        <h1>{t("welcome")}</h1>
      </main>
    </>
  );
}
