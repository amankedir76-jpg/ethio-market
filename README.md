# ETHIO MARKET – getrennte Apps mit gemeinsamem Kern

Jedes Modul (Shop, Food, Jobs …) ist eine eigene App mit eigener Adresse und eigener Netlify-Seite. Alle Apps teilen sich einen Kern und eine Datenbank. Ein Kunde braucht deshalb nur ein Konto für alle Apps.

```
ethio-market/
├─ packages/core/      gemeinsam: Sprachen, Birr-Format, Datenbank, Kopfzeile, App-Verzeichnis
├─ apps/shop/          ETHIO SHOP   (Phase 2, wird als Erstes ausgebaut)
├─ apps/food/          ETHIO FOOD   (Gerüst)
└─ scripts/new-app.mjs legt eine weitere App an
```

## Auf dem eigenen Computer starten

Voraussetzung: Node.js 20 oder neuer.

```
npm install
npm run dev:shop      # öffnet den Shop unter http://localhost:5173
npm run dev:food
npm run build         # baut alle Apps
```

## Neue App anlegen

```
npm run new-app -- jobs
npm install
```

Danach in `packages/core/src/apps.ts` prüfen, ob die App eingetragen ist, und in der Wurzel-`package.json` ein Skript `dev:jobs` ergänzen.

## Bei Netlify veröffentlichen (eine Netlify-Seite pro App)

1. Den Ordner `ethio-market` in ein GitHub-Repository hochladen.
2. In Netlify: Add new site → Import an existing project → GitHub → das Repository wählen.
3. Einstellungen für den Shop:
   - Base directory: leer lassen
   - Build command: `npm run build -w @ethio/shop`
   - Publish directory: `apps/shop/dist`
4. Unter Environment variables `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` eintragen, sobald das Supabase-Projekt existiert. Ohne sie läuft die App im Demo-Modus.
5. Für jede weitere App dasselbe Repository noch einmal importieren und nur `shop` durch den App-Namen ersetzen.

Weiterleitungen und Sicherheits-Header liegen in `apps/<name>/public/_redirects` und `_headers`.

## Ein Konto für alle Apps

Alle Apps nutzen dasselbe Supabase-Projekt. Ein Konto gilt deshalb überall. Liegen die Apps auf verschiedenen Domains (shop-…netlify.app, food-…netlify.app), muss man sich in jeder App einmal anmelden. Mit einer eigenen Domain und Unterdomains (shop.deine-domain.et, food.deine-domain.et) lässt sich das später zu einem einzigen Login zusammenführen.

## ETHIO SHOP – Einrichtung nach dem Hochladen

1. **Supabase → Authentication → URL Configuration**
   - Site URL: `https://ethio-market.pages.dev`
   - Redirect URLs: `https://ethio-market.pages.dev/**` und `https://*.ethio-market.pages.dev/**`
   Ohne diese Einstellung führen Bestätigungs- und Passwort-Links ins Leere.
2. **Admin werden:** im Shop registrieren, dann im Supabase SQL Editor:
   `insert into public.platform_admins (user_id) select id from auth.users where email = 'DEINE@EMAIL';`
3. **Lieferregionen:** im Admin-Bereich unter „Lieferregionen“ eigene Preise und Lieferzeiten eintragen und Regionen aktivieren. Ohne aktive Region ist nur Abholung beim Verkäufer möglich.

Alle Shop-Texte stehen in `apps/shop/src/texts.ts` (Englisch, Amharisch, Afaan Oromoo). Amharische und Oromo-Texte bitte von Muttersprachlern prüfen.
