/** Kleine, sichere Hülle um localStorage (kann in manchen Browsern gesperrt sein). */
export function readJSON<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Speicher voll oder gesperrt: App läuft trotzdem weiter */
  }
}

export function removeKey(key: string) {
  try { localStorage.removeItem(key); } catch { /* ignorieren */ }
}

/** Zuletzt angesehene Produkte (nur auf diesem Gerät). */
const RECENT = "ethio.recent";
export function pushRecent(id: string) {
  const list = readJSON<string[]>(RECENT, []).filter((x) => x !== id);
  writeJSON(RECENT, [id, ...list].slice(0, 12));
}
export const getRecent = () => readJSON<string[]>(RECENT, []);

/** Suchverlauf: abschaltbar und löschbar. */
const HISTORY = "ethio.searchHistory";
const HISTORY_ON = "ethio.searchHistoryOn";
export const historyEnabled = () => readJSON<boolean>(HISTORY_ON, true);
export function setHistoryEnabled(on: boolean) {
  writeJSON(HISTORY_ON, on);
  if (!on) removeKey(HISTORY);
}
export function pushHistory(q: string) {
  if (!historyEnabled() || q.trim().length < 2) return;
  const list = readJSON<string[]>(HISTORY, []).filter((x) => x !== q);
  writeJSON(HISTORY, [q, ...list].slice(0, 8));
}
export const getHistory = () => (historyEnabled() ? readJSON<string[]>(HISTORY, []) : []);
export const clearHistory = () => removeKey(HISTORY);
