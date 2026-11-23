import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useI18n } from "@ethio/core";
import { Empty, ProductGrid } from "../components/ui";
import { localName, searchProducts, useCategories, useRegions } from "../lib/data";
import type { Product } from "../lib/types";
import { getHistory, historyEnabled, setHistoryEnabled, clearHistory } from "../lib/storage";

const PAGE = 24;

/** Suche, Kategorien, Filter und Sortierung. Alle Filter stehen in der Adresse (teilbar). */
export function SearchPage() {
  const { t, locale } = useI18n();
  const [sp, setSp] = useSearchParams();
  const cats = useCategories();
  const regions = useRegions();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [histOn, setHistOn] = useState(historyEnabled());

  const params = {
    q: sp.get("q") ?? undefined,
    category: sp.get("category") ?? undefined,
    min: sp.get("min") ? Number(sp.get("min")) : undefined,
    max: sp.get("max") ? Number(sp.get("max")) : undefined,
    region: sp.get("region") ?? undefined,
    rating: sp.get("rating") ? Number(sp.get("rating")) : undefined,
    sort: sp.get("sort") ?? "new",
  };
  const key = sp.toString();

  useEffect(() => {
    setLoading(true);
    searchProducts({ ...params, limit: PAGE, offset: 0 })
      .then((r) => { setItems(r); setMore(r.length === PAGE); })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const loadMore = async () => {
    const r = await searchProducts({ ...params, limit: PAGE, offset: items.length });
    setItems((x) => [...x, ...r]);
    setMore(r.length === PAGE);
  };

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(sp);
    if (v) next.set(k, v); else next.delete(k);
    setSp(next);
  };
  const cat = cats.find((c) => c.id === params.category);

  return (
    <div className="container">
      <h1>{params.q ? `„${params.q}“` : cat ? localName(cat, locale) : t("nav.categories")}</h1>
      <div className="search-layout">
        <aside className="card pad stack" aria-label={t("filter.title")}>
          <b>{t("filter.title")}</b>
          <label className="field"><span>{t("filter.category")}</span>
            <select value={params.category ?? ""} onChange={(e) => set("category", e.target.value)}>
              <option value="">{t("common.all")}</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{localName(c, locale)}</option>)}
            </select>
          </label>
          <div className="grid-2">
            <label className="field"><span>{t("filter.priceMin")}</span>
              <input type="number" min={0} inputMode="numeric" defaultValue={params.min} onBlur={(e) => set("min", e.target.value)} /></label>
            <label className="field"><span>{t("filter.priceMax")}</span>
              <input type="number" min={0} inputMode="numeric" defaultValue={params.max} onBlur={(e) => set("max", e.target.value)} /></label>
          </div>
          <label className="field"><span>{t("filter.region")}</span>
            <select value={params.region ?? ""} onChange={(e) => set("region", e.target.value)}>
              <option value="">{t("common.all")}</option>
              {regions.map((r) => <option key={r.code} value={r.code}>{localName(r, locale)}</option>)}
            </select>
          </label>
          <label className="field"><span>{t("filter.rating")}</span>
            <select value={params.rating ?? ""} onChange={(e) => set("rating", e.target.value)}>
              <option value="">{t("common.all")}</option>
              {[4, 3, 2].map((n) => <option key={n} value={n}>{n}+ ★</option>)}
            </select>
          </label>
          <label className="check small">
            <input type="checkbox" checked={!histOn} onChange={(e) => { setHistoryEnabled(!e.target.checked); setHistOn(!e.target.checked); }} />
            {t("search.historyOff")}
          </label>
          {histOn && getHistory().length > 0 && <button className="btn ghost sm" onClick={() => { clearHistory(); setHistOn(true); }}>{t("search.recent")}: {t("search.clear")}</button>}
        </aside>
        <section>
          <div className="row between" style={{ marginBottom: 12 }}>
            <span className="muted">{loading ? t("common.loading") : `${items.length}${more ? "+" : ""} ${t("search.results")}`}</span>
            <label className="row small">{t("sort.label")}
              <select className="input" style={{ width: "auto" }} value={params.sort} onChange={(e) => set("sort", e.target.value)}>
                <option value="new">{t("sort.new")}</option>
                <option value="priceAsc">{t("sort.priceAsc")}</option>
                <option value="priceDesc">{t("sort.priceDesc")}</option>
                <option value="popular">{t("sort.popular")}</option>
                <option value="rating">{t("sort.rating")}</option>
              </select>
            </label>
          </div>
          {loading ? <ProductGrid items={[]} loading /> : items.length ? <ProductGrid items={items} /> : <Empty>{t("search.none")}</Empty>}
          {more && !loading && <div style={{ textAlign: "center", marginTop: 18 }}><button className="btn secondary" onClick={loadMore}>{t("search.more")}</button></div>}
        </section>
      </div>
    </div>
  );
}
