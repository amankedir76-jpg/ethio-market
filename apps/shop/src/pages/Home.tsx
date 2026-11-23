import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Banknote, Truck } from "lucide-react";
import { useI18n } from "@ethio/core";
import { CategoryIcon } from "../components/CategoryIcon";
import { Empty, ProductGrid } from "../components/ui";
import { loadProductsByIds, localName, searchProducts, useCategories } from "../lib/data";
import { getRecent } from "../lib/storage";
import { db, dbReady, mediaUrl } from "../lib/db";
import type { Product, Seller } from "../lib/types";

export function Home() {
  const { t, locale } = useI18n();
  const cats = useCategories();
  const [fresh, setFresh] = useState<Product[]>([]);
  const [popular, setPopular] = useState<Product[]>([]);
  const [deals, setDeals] = useState<Product[]>([]);
  const [recent, setRecent] = useState<Product[]>([]);
  const [shops, setShops] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(dbReady);

  useEffect(() => {
    if (!dbReady) return;
    Promise.all([
      searchProducts({ sort: "new", limit: 10 }),
      searchProducts({ sort: "popular", limit: 10 }),
      db.from("shop_products").select("*").eq("status", "live").not("compare_at_price_santim", "is", null).limit(10),
      loadProductsByIds(getRecent().slice(0, 6)),
      db.from("shop_sellers").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(8),
    ]).then(([n, p, d, r, s]) => {
      setFresh(n);
      setPopular(p.filter((x) => x.sold_count > 0));
      setDeals((d.data as Product[]) ?? []);
      setRecent(r.filter((x) => x.status === "live"));
      setShops((s.data as Seller[]) ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="container">
      <section className="hero">
        <div className="hero-inner">
          <h1>{t("hero.title")}</h1>
          <p>{t("hero.text")}</p>
          <div className="row">
            <Link className="btn accent" to="/search">{t("hero.cta")}</Link>
            <Link className="btn secondary" to="/seller">{t("hero.sell")}</Link>
          </div>
        </div>
        <svg className="hero-pattern" viewBox="0 0 100 100" aria-hidden>
          {[0, 1, 2, 3].map((i) => <circle key={i} cx="50" cy="50" r={14 + i * 11} fill="none" stroke="#fff" strokeWidth="3" />)}
        </svg>
      </section>

      <div className="trust">
        <div><Banknote size={22} /> {t("trust.cod")}</div>
        <div><BadgeCheck size={22} /> {t("trust.verified")}</div>
        <div><Truck size={22} /> {t("trust.regions")}</div>
      </div>

      <h2>{t("nav.categories")}</h2>
      <div className="cat-grid">
        {cats.map((c) => (
          <Link key={c.id} to={`/search?category=${c.id}`} className="cat-card">
            <CategoryIcon id={c.id} />
            {localName(c, locale)}
          </Link>
        ))}
      </div>

      {deals.length > 0 && (<><div className="section-head"><h2>{t("home.deals")}</h2></div><ProductGrid items={deals} /></>)}

      <div className="section-head"><h2>{t("home.new")}</h2><Link to="/search?sort=new">{t("search.more")} →</Link></div>
      {loading ? <ProductGrid items={[]} loading /> : fresh.length ? <ProductGrid items={fresh} /> : (
        <Empty>{t("home.noProducts")} <br /><br /><Link className="btn" to="/seller">{t("hero.sell")}</Link></Empty>
      )}

      {popular.length > 0 && (<><div className="section-head"><h2>{t("home.popular")}</h2><Link to="/search?sort=popular">{t("search.more")} →</Link></div><ProductGrid items={popular} /></>)}

      {shops.length > 0 && (
        <>
          <h2>{t("home.sellers")}</h2>
          <div className="p-grid">
            {shops.map((s) => (
              <Link key={s.id} to={`/shop/${s.id}`} className="card pad row">
                {mediaUrl(s.logo_path) ? <img className="thumb-sm" src={mediaUrl(s.logo_path)!} alt="" /> : <span className="logo-mark">{s.shop_name.slice(0, 2).toUpperCase()}</span>}
                <div><b>{s.shop_name}</b><div className="muted small">{s.city}</div></div>
              </Link>
            ))}
          </div>
        </>
      )}

      {recent.length > 0 && (<><h2>{t("home.recent")}</h2><ProductGrid items={recent} /></>)}
    </div>
  );
}
