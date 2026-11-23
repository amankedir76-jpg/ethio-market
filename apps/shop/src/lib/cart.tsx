import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { readJSON, writeJSON } from "./storage";

/** Warenkorb im Browser. Preise werden hier nur angezeigt; die echte Summe rechnet der Server. */
export type CartLine = { productId: string; qty: number };

type CartState = {
  lines: CartLine[];
  count: number;
  add: (productId: string, qty?: number, max?: number) => void;
  setQty: (productId: string, qty: number, max?: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const KEY = "ethio.cart";
const Ctx = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => readJSON<CartLine[]>(KEY, []));
  useEffect(() => { writeJSON(KEY, lines); }, [lines]);

  const clamp = (q: number, max = 99) => Math.max(1, Math.min(q, max, 99));
  const add: CartState["add"] = (productId, qty = 1, max) =>
    setLines((ls) => {
      const hit = ls.find((l) => l.productId === productId);
      if (hit) return ls.map((l) => (l.productId === productId ? { ...l, qty: clamp(l.qty + qty, max) } : l));
      return [...ls, { productId, qty: clamp(qty, max) }];
    });
  const setQty: CartState["setQty"] = (productId, qty, max) =>
    setLines((ls) => ls.map((l) => (l.productId === productId ? { ...l, qty: clamp(qty, max) } : l)));
  const remove = (productId: string) => setLines((ls) => ls.filter((l) => l.productId !== productId));
  const clear = () => setLines([]);
  const count = lines.reduce((a, l) => a + l.qty, 0);

  return <Ctx.Provider value={{ lines, count, add, setQty, remove, clear }}>{children}</Ctx.Provider>;
}

export function useCart(): CartState {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}
