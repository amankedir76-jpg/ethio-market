import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, Store } from "lucide-react";
import { useI18n } from "@ethio/core";
import { Empty, Price, ProductGrid, ProductImage, Spinner, Stars, useToast } from "../components/ui";
import { localName, searchProducts, useCategories } from "../lib/data";
import { db, mediaUrl } from "../lib/db";
import { useCart } from "../lib/cart";
import { pushRecent } from "../lib/storage";
import type { Product, Review, Seller } from "../lib/types";

export function ProductPage() {
  const { id } = useParams();
  const { t, locale } = useI18n();
  const cats = useCategories();
  const cart = useCart();
  const toast = useToast();
  const [p, setP] = useState<Product | null | undefined>(undefined);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [img, setImg] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!id) return;
    setP(undefined); setImg(0); setQty(1);
    db.from("shop_products").select("*").eq("id", id).maybeSingle().then(async ({ data }) => {
      const prod = data as Product | null;
      setP(prod);
      if (!prod) return;
      pushRecent(prod.id);
      const [s, r, sim] = await Promise.all([
        db.from("shop_sellers").select("*").eq("id", prod.seller_id).maybeSingle(),
        db.from("shop_reviews").select("*").eq("product_id", prod.id).order("created_at", { ascending: false }).limit(20),
        searchProducts({ category: prod.category_id, sort: "popular", limit: 9 }),
      ]);
      setSeller((s.data as Seller) ?? null);
      setReviews((r.data as Review[]) ?? []);
      setSimilar(sim.filter((x) => x.id !== prod.id).slice(0, 8));
    });
  }, [id]);

  if (p === undefined) return <Spinner />;
  if (!p) return <div className="container"><h1>{t("p.notFound")}</h1><Link className="btn" to="/">{t("nav.home")}</Link></div>;

  const cat = cats.find((c) => c.id === p.category_id);
  const max = Math.max(1, p.stock);

  return (
    <div className="container">
      <nav className="muted small" style={{ marginTop: 16 }}>
        <Link to="/">{t("nav.home")}</Link> › {cat && <Link to={`/search?category=${cat.id}`}>{localName(cat, locale)}</Link>}
        {p.subcategory ? ` › ${p.subcategory}` : ""}
      </nav>
      <div className="pd">
        <div>
          <div className="gallery-main"><ProductImage path={p.images[img]} alt={p.title} eager /></div>
          {p.images.length > 1 && (
            <div className="thumbs">
              {p.images.map((path, i) => (
                <button key={path} className={i === img ? "on" : ""} onClick={() => setImg(i)} aria-label={`${i + 1}`}>
                  <img src={mediaUrl(path)!} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="stack" style={{ alignContent: "start" }}>
          <h1 style={{ margin: 0 }}>{p.title}</h1>
          {p.rating_count > 0 && <Stars value={p.rating_avg} count={p.rating_count} />}
          <div style={{ fontSize: 24 }}><Price santim={p.price_santim} old={p.compare_at_price_santim} /></div>
          {p.stock > 0
            ? <span className="tag green" style={{ width: "fit-content" }}>{t("p.inStock")}{p.stock <= 5 ? ` · ${p.stock} ${t("p.left")}` : ""}</span>
            : <span className="tag red" style={{ width: "fit-content" }}>{t("p.out")}</span>}
          {p.stock > 0 && p.status === "live" && (
            <div className="row">
              <div className="qty" aria-label={t("p.qty")}>
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="−">−</button>
                <span>{qty}</span>
                <button onClick={() => setQty((q) => Math.min(max, q + 1))} aria-label="+">+</button>
              </div>
              <button className="btn" style={{ flex: 1 }} onClick={() => { cart.add(p.id, qty, p.stock); toast(t("p.added")); }}>{t("p.addCart")}</button>
            </div>
          )}
          {seller && (
            <div className="card pad stack" style={{ gap: 6 }}>
              <span className="muted small">{t("p.seller")}</span>
              <Link to={`/shop/${seller.id}`} className="row"><Store size={18} /><b>{seller.shop_name}</b></Link>
              <span className="row muted small"><MapPin size={15} />{seller.city}</span>
              {seller.pickup_enabled && <span className="tag gold" style={{ width: "fit-content" }}>{t("p.pickup")}</span>}
            </div>
          )}
          {p.description && (<div><h3>{t("p.description")}</h3><p style={{ whiteSpace: "pre-line", margin: 0 }}>{p.description}</p></div>)}
        </div>
      </div>

      <h2>{t("p.reviews")}</h2>
      {reviews.length ? (
        <div className="stack">
          {reviews.map((r) => (
            <div key={r.id} className="card pad">
              <div className="row between"><b>{r.author_name || "—"}</b><Stars value={r.rating} /></div>
              {r.comment && <p style={{ margin: "6px 0 0" }}>{r.comment}</p>}
            </div>
          ))}
        </div>
      ) : <Empty>{t("p.noReviews")}</Empty>}

      {similar.length > 0 && (<><h2>{t("p.similar")}</h2><ProductGrid items={similar} /></>)}
    </div>
  );
}

/** Öffentliche Shop-Seite mit allen Produkten eines Verkäufers. */
export function ShopPage() {
  const { id } = useParams();
  const { t } = useI18n();
  const [seller, setSeller] = useState<Seller | null | undefined>(undefined);
  const [items, setItems] = useState<Product[]>([]);
  useEffect(() => {
    if (!id) return;
    db.from("shop_sellers").select("*").eq("id", id).maybeSingle().then(({ data }) => setSeller((data as Seller) ?? null));
    db.from("shop_products").select("*").eq("seller_id", id).eq("status", "live").order("created_at", { ascending: false })
      .then(({ data }) => setItems((data as Product[]) ?? []));
  }, [id]);
  if (seller === undefined) return <Spinner />;
  if (!seller) return <div className="container"><h1>{t("p.notFound")}</h1></div>;
  return (
    <div className="container">
      <div className="card pad row" style={{ marginTop: 20 }}>
        {mediaUrl(seller.logo_path) ? <img className="thumb-sm" style={{ width: 64, height: 64 }} src={mediaUrl(seller.logo_path)!} alt="" /> : <span className="logo-mark" style={{ width: 64, height: 64 }}>{seller.shop_name.slice(0, 2).toUpperCase()}</span>}
        <div className="stack" style={{ gap: 4 }}>
          <h1 style={{ margin: 0 }}>{seller.shop_name}</h1>
          <span className="muted row small"><MapPin size={15} />{seller.city}</span>
          {seller.description && <p style={{ margin: 0 }}>{seller.description}</p>}
        </div>
      </div>
      <h2>{t("s.products")}</h2>
      {items.length ? <ProductGrid items={items} /> : <Empty>{t("common.empty")}</Empty>}
    </div>
  );
}
