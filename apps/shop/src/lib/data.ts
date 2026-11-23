import { useEffect, useState } from "react";
import type { Locale } from "@ethio/core";
import { db, dbReady } from "./db";
import type { Category, Product, Region, Seller } from "./types";

/** Name in der gewählten Sprache aus einem Datensatz mit name_am / name_om / name_en. */
export function localName(row: { name_am: string; name_om: string; name_en: string }, locale: Locale): string {
  return row[`name_${locale}` as const] || row.name_en;
}

// Stammdaten ändern sich selten: einmal pro Seitenaufruf laden
let catCache: Promise<Category[]> | null = null;
let regionCache: Promise<Region[]> | null = null;

export function loadCategories(): Promise<Category[]> {
  if (!dbReady) return Promise.resolve([]);
  catCache ??= Promise.resolve(db.from("shop_categories").select("*").order("sort")).then((r) => (r.data as Category[]) ?? []);
  return catCache;
}
export function loadRegions(force = false): Promise<Region[]> {
  if (!dbReady) return Promise.resolve([]);
  if (force) regionCache = null;
  regionCache ??= Promise.resolve(db.from("shop_delivery_regions").select("*").order("sort")).then((r) => (r.data as Region[]) ?? []);
  return regionCache;
}

export function useCategories() {
  const [cats, setCats] = useState<Category[]>([]);
  useEffect(() => { void loadCategories().then(setCats); }, []);
  return cats;
}
export function useRegions() {
  const [regions, setRegions] = useState<Region[]>([]);
  useEffect(() => { void loadRegions().then(setRegions); }, []);
  return regions;
}

/** Shops zu einer Liste von Produkten nachladen (nur öffentlich sichtbare Felder). */
export async function loadSellers(ids: string[]): Promise<Record<string, Seller>> {
  const unique = [...new Set(ids)];
  if (!unique.length) return {};
  const { data } = await db.from("shop_sellers").select("*").in("id", unique);
  return Object.fromEntries(((data as Seller[]) ?? []).map((s) => [s.id, s]));
}

export type SearchParams = {
  q?: string; category?: string; min?: number; max?: number;
  region?: string; rating?: number; sort?: string; limit?: number; offset?: number;
};

/** Produktsuche. Die Zugriffsregeln der Datenbank liefern nur freigegebene, sichtbare Produkte. */
export async function searchProducts(p: SearchParams): Promise<Product[]> {
  if (!dbReady) return [];
  let sellerIds: string[] | null = null;
  if (p.region) {
    const { data } = await db.from("shop_sellers").select("id").eq("region", p.region);
    sellerIds = (data ?? []).map((s: { id: string }) => s.id);
    if (!sellerIds.length) return [];
  }
  let q = db.from("shop_products").select("*").eq("status", "live");
  if (p.q?.trim()) {
    // Mehrere Wörter: jedes muss im Titel vorkommen (einfache, fehlertolerante Suche)
    for (const word of p.q.trim().split(/\s+/).slice(0, 5)) q = q.ilike("title", `%${word.replace(/[%_,()]/g, "")}%`);
  }
  if (p.category) q = q.eq("category_id", p.category);
  if (p.min != null) q = q.gte("price_santim", p.min * 100);
  if (p.max != null) q = q.lte("price_santim", p.max * 100);
  if (p.rating) q = q.gte("rating_avg", p.rating);
  if (sellerIds) q = q.in("seller_id", sellerIds);
  const sort = p.sort ?? "new";
  if (sort === "priceAsc") q = q.order("price_santim", { ascending: true });
  else if (sort === "priceDesc") q = q.order("price_santim", { ascending: false });
  else if (sort === "popular") q = q.order("sold_count", { ascending: false });
  else if (sort === "rating") q = q.order("rating_avg", { ascending: false });
  else q = q.order("created_at", { ascending: false });
  const from = p.offset ?? 0;
  q = q.range(from, from + (p.limit ?? 24) - 1);
  const { data, error } = await q;
  if (error) throw error;
  return (data as Product[]) ?? [];
}

export async function loadProductsByIds(ids: string[]): Promise<Product[]> {
  if (!dbReady || !ids.length) return [];
  const { data } = await db.from("shop_products").select("*").in("id", ids);
  const byId = Object.fromEntries(((data as Product[]) ?? []).map((p) => [p.id, p]));
  return ids.map((id) => byId[id]).filter(Boolean);
}
