/** Geldbeträge werden immer als ganze Zahl in Santim gespeichert (1 ETB = 100 Santim). */
export type Santim = number;

export const toSantim = (birr: number): Santim => Math.round(birr * 100);

/** Formatiert Santim als Birr-Preis, z. B. 1850000 -> "18,500 ETB". */
export function formatBirr(amount: Santim, withCents = false): string {
  const birr = amount / 100;
  return (
    birr.toLocaleString("en-US", {
      minimumFractionDigits: withCents ? 2 : 0,
      maximumFractionDigits: withCents ? 2 : 0,
    }) + " ETB"
  );
}
