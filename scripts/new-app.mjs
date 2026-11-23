// Legt eine neue ETHIO-App an:  npm run new-app -- <key>
// Beispiel: npm run new-app -- jobs   ->  apps/jobs
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const key = process.argv[2];
if (!key || !/^[a-z]+$/.test(key)) {
  console.error("Bitte einen Namen aus Kleinbuchstaben angeben, z. B.: npm run new-app -- jobs");
  process.exit(1);
}
const dir = join("apps", key);
if (existsSync(dir)) { console.error(`${dir} gibt es schon.`); process.exit(1); }
mkdirSync(join(dir, "src"), { recursive: true });
mkdirSync(join(dir, "public"), { recursive: true });

const files = {
  "package.json": JSON.stringify({
    name: `@ethio/${key}`, private: true, version: "0.1.0", type: "module",
    scripts: { dev: "vite", build: "tsc --noEmit -p . && vite build", preview: "vite preview", typecheck: "tsc --noEmit -p ." },
    dependencies: { "@ethio/core": "*", react: "^18.3.1", "react-dom": "^18.3.1" },
    devDependencies: { "@types/react": "^18.3.3", "@types/react-dom": "^18.3.0", "@vitejs/plugin-react": "^4.3.1", typescript: "^5.5.4", vite: "^5.4.0" },
  }, null, 2) + "\n",
  "tsconfig.json": `{ "extends": "../../tsconfig.base.json", "include": ["src", "../../packages/core/src"] }\n`,
  "vite.config.ts": `import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\n\nexport default defineConfig({ plugins: [react()] });\n`,
  ".env.example": "# Werte aus Supabase -> Project Settings -> API. Datei als .env kopieren.\n# Ohne diese Werte läuft die App im Demo-Modus.\nVITE_SUPABASE_URL=\nVITE_SUPABASE_ANON_KEY=\n",
  // Netlify liest _redirects und _headers aus dem gebauten Ordner. Vite kopiert public/ dorthin.
  "public/_redirects": "/*  /index.html  200\n",
  "public/_headers": `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`,
  "index.html": `<!DOCTYPE html>
<html lang="am">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ETHIO ${key.toUpperCase()}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;700&display=swap" rel="stylesheet" />
    <style>body{margin:0;font-family:system-ui,"Noto Sans Ethiopic",sans-serif;background:#f6f7f9;color:#14171c}</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
  "src/main.tsx": `import React from "react";
import ReactDOM from "react-dom/client";
import { I18nProvider } from "@ethio/core";
import { App } from "./App";
import { texts } from "./texts";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nProvider texts={texts}>
      <App />
    </I18nProvider>
  </React.StrictMode>,
);
`,
  "src/texts.ts": `import type { Texts } from "@ethio/core";

/** Texte nur für diese App. Gemeinsame Texte (Login, Suche …) liegen in @ethio/core. */
export const texts: Texts = {
  am: { welcome: "እንኳን ደህና መጡ" },
  om: { welcome: "Baga nagaan dhuftan" },
  en: { welcome: "Welcome" },
};
`,
  "src/App.tsx": `import { APPS, AppHeader, isDemoMode, useI18n } from "@ethio/core";

const info = APPS.find((a) => a.key === "${key}")!;

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
`,
};
for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
console.log(`Fertig: ${dir}. Jetzt "npm install" ausführen und in packages/core/src/apps.ts prüfen, ob "${key}" eingetragen ist.`);
