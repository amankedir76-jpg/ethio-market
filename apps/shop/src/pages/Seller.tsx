import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ImagePlus, Plus, X } from "lucide-react";
import { formatBirr, toSantim, useI18n } from "@ethio/core";
import { Empty, ErrorNote, Spinner, useToast } from "../components/ui";
import { OrderStatusBar } from "./Account";
import { useAuth } from "../lib/auth";
import { db, deleteImage, errorKey, mediaUrl, uploadImage } from "../lib/db";
import { localName, useCategories, useRegions } from "../lib/data";
import type { Order, OrderItem, Product, Seller } from "../lib/types";

/** Verkäuferportal: Shop anlegen, Produkte, Bestellungen, Kennzahlen. */
export function SellerPage() {
  const { t } = useI18n();
  const { session, loading, seller } = useAuth();
  const [tab, setTab] = useState<"overview" | "products" | "orders" | "shop">("overview");

  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/login?next=/seller" replace />;
  if (!seller) return <SellerRegister />;

  return (
    <div className="container">
      <div className="row between">
        <h1>{seller.shop_name}</h1>
        <span className={`tag ${seller.status === "approved" ? "green" : seller.status === "blocked" ? "red" : "gold"}`}>{t(`s.status.${seller.status}`)}</span>
      </div>
      {seller.status === "pending" && <div className="notice" style={{ marginBottom: 16 }}>{t("s.pendingText")}</div>}
      <div className="tabs" role="tablist">
        {(["overview", "products", "orders", "shop"] as const).map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{t(`s.${k}`)}</button>
        ))}
      </div>
      {tab === "overview" && <SellerOverview seller={seller} />}
      {tab === "products" && <SellerProducts seller={seller} />}
      {tab === "orders" && <SellerOrders seller={seller} />}
      {tab === "shop" && <ShopForm seller={seller} />}
    </div>
  );
}

function SellerRegister() {
  const { t } = useI18n();
  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <h1>{t("s.register")}</h1>
      <p className="muted">{t("s.registerText")}</p>
      <ShopForm seller={null} />
    </div>
  );
}

function ShopForm({ seller }: { seller: Seller | null }) {
  const { t, locale } = useI18n();
  const { session, refresh } = useAuth();
  const toast = useToast();
  const regions = useRegions();
  const [f, setF] = useState({
    shop_name: seller?.shop_name ?? "", city: seller?.city ?? "", phone: seller?.phone ?? "", region: seller?.region ?? "",
    description: seller?.description ?? "", pickup_enabled: seller?.pickup_enabled ?? false, pickup_address: seller?.pickup_address ?? "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setBusy(true);
    const row = { ...f, shop_name: f.shop_name.trim(), description: f.description.trim() || null, pickup_address: f.pickup_address.trim() || null, region: f.region || null };
    const res = seller
      ? await db.from("shop_sellers").update(row).eq("id", seller.id)
      : await db.from("shop_sellers").insert({ ...row, owner_id: session!.user.id });
    setBusy(false);
    if (res.error) { setErr(errorKey(res.error)); return; }
    toast(t("common.saved"));
    await refresh();
  };

  const uploadLogo = async (file: File | undefined) => {
    if (!file || !seller) return;
    setErr(null);
    try {
      const path = await uploadImage(seller.id, file);
      const { error } = await db.from("shop_sellers").update({ logo_path: path }).eq("id", seller.id);
      if (error) throw error;
      if (seller.logo_path) await deleteImage(seller.logo_path);
      await refresh();
    } catch (e) { setErr(errorKey(e)); }
  };

  return (
    <form className="card pad stack" onSubmit={submit}>
      {seller && (
        <div className="row">
          {mediaUrl(seller.logo_path) ? <img className="thumb-sm" style={{ width: 64, height: 64 }} src={mediaUrl(seller.logo_path)!} alt="" /> : <span className="logo-mark" style={{ width: 64, height: 64 }}>{seller.shop_name.slice(0, 2).toUpperCase()}</span>}
          <label className="btn secondary sm"><ImagePlus size={16} />{t("s.logo")}<input type="file" accept="image/*" hidden onChange={(e) => uploadLogo(e.target.files?.[0])} /></label>
        </div>
      )}
      <label className="field"><span>{t("s.shopName")}</span><input required minLength={2} maxLength={80} value={f.shop_name} onChange={set("shop_name")} /></label>
      <div className="grid-2">
        <label className="field"><span>{t("co.region")}</span>
          <select required value={f.region} onChange={set("region")}>
            <option value="" disabled>—</option>
            {regions.map((r) => <option key={r.code} value={r.code}>{localName(r, locale)}</option>)}
          </select>
        </label>
        <label className="field"><span>{t("co.city")}</span><input required maxLength={60} value={f.city} onChange={set("city")} /></label>
      </div>
      <label className="field"><span>{t("co.phone")}</span><input required type="tel" pattern="(\+251|0)?[79][0-9]{8}" value={f.phone} onChange={set("phone")} /></label>
      <label className="field"><span>{t("s.description")} <small className="muted">({t("common.optional")})</small></span><textarea maxLength={1000} value={f.description} onChange={set("description")} /></label>
      <label className="check"><input type="checkbox" checked={f.pickup_enabled} onChange={(e) => setF((x) => ({ ...x, pickup_enabled: e.target.checked }))} />{t("s.pickupEnabled")}</label>
      {f.pickup_enabled && <label className="field"><span>{t("s.pickupAddress")}</span><input required maxLength={300} value={f.pickup_address} onChange={set("pickup_address")} /></label>}
      <ErrorNote k={err} />
      <button className="btn" style={{ width: "fit-content" }} disabled={busy}>{seller ? t("common.save") : t("s.register")}</button>
    </form>
  );
}

function useSellerItems(seller: Seller) {
  const [items, setItems] = useState<(OrderItem & { shop_orders: Order })[] | null>(null);
  const load = useCallback(() => {
    db.from("shop_order_items").select("*, shop_orders(*)").eq("seller_id", seller.id).order("id")
      .then(({ data }) => setItems((data as (OrderItem & { shop_orders: Order })[]) ?? []));
  }, [seller.id]);
  useEffect(() => { load(); }, [load]);
  return { items, load };
}

function SellerOverview({ seller }: { seller: Seller }) {
  const { t } = useI18n();
  const { items } = useSellerItems(seller);
  if (!items) return <Spinner />;
  const valid = items.filter((i) => i.shop_orders.status !== "cancelled");
  const revenue = valid.reduce((a, i) => a + i.unit_price_santim * i.qty, 0);
  const commission = valid.reduce((a, i) => a + Math.round((i.unit_price_santim * i.qty * Number(i.commission_pct)) / 100), 0);
  const open = new Set(items.filter((i) => ["placed", "packed", "shipped"].includes(i.shop_orders.status)).map((i) => i.order_id)).size;
  return (
    <div className="kpis">
      <div className="card kpi"><div className="muted small">{t("s.openOrders")}</div><div className="v">{open}</div></div>
      <div className="card kpi"><div className="muted small">{t("s.sold")}</div><div className="v">{valid.reduce((a, i) => a + i.qty, 0)}</div></div>
      <div className="card kpi"><div className="muted small">{t("s.revenue")}</div><div className="v">{formatBirr(revenue)}</div></div>
      <div className="card kpi"><div className="muted small">{t("s.commission")}</div><div className="v">{formatBirr(commission)}</div></div>
      <div className="card kpi"><div className="muted small">{t("s.payout")}</div><div className="v">{formatBirr(revenue - commission)}</div></div>
    </div>
  );
}

function SellerOrders({ seller }: { seller: Seller }) {
  const { t } = useI18n();
  const toast = useToast();
  const { items, load } = useSellerItems(seller);
  const [err, setErr] = useState<string | null>(null);
  if (!items) return <Spinner />;
  const byOrder = new Map<string, { order: Order; lines: OrderItem[] }>();
  for (const i of items) {
    const e = byOrder.get(i.order_id) ?? { order: i.shop_orders, lines: [] };
    e.lines.push(i); byOrder.set(i.order_id, e);
  }
  const orders = [...byOrder.values()].sort((a, b) => b.order.created_at.localeCompare(a.order.created_at));
  const setStatus = async (id: string, status: string) => {
    setErr(null);
    const { error } = await db.rpc("shop_set_order_status", { p_order: id, p_status: status });
    if (error) setErr(errorKey(error)); else { toast(t("common.saved")); load(); }
  };
  if (!orders.length) return <Empty>{t("common.empty")}</Empty>;
  return (
    <div className="stack">
      <ErrorNote k={err} />
      {orders.map(({ order: o, lines }) => (
        <div key={o.id} className="card order-card">
          <div className="row between"><b>{o.order_no}</b><span className="muted small">{new Date(o.created_at).toLocaleString()}</span></div>
          <OrderStatusBar status={o.status} />
          {o.cancel_requested && o.status !== "cancelled" && <span className="tag gold">{t("o.cancelRequested")}</span>}
          <div className="small">{lines.map((l) => <div key={l.id}>{l.qty} × {l.title} · {formatBirr(l.unit_price_santim * l.qty)}</div>)}</div>
          <div className="small">
            <b>{t("s.customer")}:</b> {o.address.full_name} · <a href={`tel:${o.address.phone}`} style={{ color: "var(--primary)" }}>{o.address.phone}</a><br />
            {o.delivery_method === "pickup" ? t("co.pickup") : [o.address.city, o.address.subcity, o.address.kebele, o.address.street, o.address.landmark].filter(Boolean).join(", ")}
            {o.note && <><br /><i>{o.note}</i></>}
          </div>
          <div className="row">
            {o.status === "placed" && <button className="btn sm" onClick={() => setStatus(o.id, "packed")}>{t("s.markPacked")}</button>}
            {o.status === "packed" && <button className="btn sm" onClick={() => setStatus(o.id, "shipped")}>{t("s.markShipped")}</button>}
            {o.status === "shipped" && <button className="btn sm" onClick={() => setStatus(o.id, "delivered")}>{t("s.markDelivered")}</button>}
            {(o.status === "placed" || o.status === "packed") && <button className="btn secondary sm" onClick={() => setStatus(o.id, "cancelled")}>{t("o.cancel")}</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

function SellerProducts({ seller }: { seller: Seller }) {
  const { t } = useI18n();
  const toast = useToast();
  const [items, setItems] = useState<Product[] | null>(null);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const load = useCallback(() => {
    db.from("shop_products").select("*").eq("seller_id", seller.id).order("created_at", { ascending: false })
      .then(({ data }) => setItems((data as Product[]) ?? []));
  }, [seller.id]);
  useEffect(() => { load(); }, [load]);

  if (editing) return <ProductForm seller={seller} product={editing === "new" ? null : editing} onDone={() => { setEditing(null); load(); }} />;
  if (!items) return <Spinner />;

  const remove = async (p: Product) => {
    if (!window.confirm(`${t("common.delete")}: ${p.title}?`)) return;
    const { error } = await db.from("shop_products").delete().eq("id", p.id);
    if (error) { toast(t(errorKey(error))); return; }
    await Promise.all(p.images.map(deleteImage));
    load();
  };

  return (
    <div className="stack">
      <button className="btn" style={{ width: "fit-content" }} onClick={() => setEditing("new")}><Plus size={18} />{t("s.newProduct")}</button>
      {!items.length ? <Empty>{t("common.empty")}</Empty> : (
        <div className="card table-wrap">
          <table>
            <thead><tr><th></th><th>{t("s.title")}</th><th>{t("s.price")}</th><th>{t("s.stock")}</th><th></th><th></th></tr></thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td>{mediaUrl(p.images[0]) ? <img className="thumb-sm" src={mediaUrl(p.images[0])!} alt="" /> : <div className="thumb-sm" />}</td>
                  <td><Link to={`/p/${p.id}`}>{p.title}</Link></td>
                  <td>{formatBirr(p.price_santim)}</td>
                  <td>{p.stock}</td>
                  <td><span className={`tag ${p.status === "live" ? "green" : p.status === "blocked" ? "red" : ""}`}>{t(p.status === "live" ? "s.statusLive" : p.status === "blocked" ? "s.statusBlocked" : "s.statusDraft")}</span></td>
                  <td className="row" style={{ flexWrap: "nowrap" }}>
                    {p.status !== "blocked" && <button className="btn secondary sm" onClick={() => setEditing(p)}>{t("common.edit")}</button>}
                    <button className="btn ghost sm" onClick={() => remove(p)}>{t("common.delete")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProductForm({ seller, product, onDone }: { seller: Seller; product: Product | null; onDone: () => void }) {
  const { t, locale } = useI18n();
  const cats = useCategories();
  const toast = useToast();
  const [f, setF] = useState({
    title: product?.title ?? "", description: product?.description ?? "", category_id: product?.category_id ?? "",
    subcategory: product?.subcategory ?? "", price: product ? String(product.price_santim / 100) : "",
    compare: product?.compare_at_price_santim ? String(product.compare_at_price_santim / 100) : "",
    stock: product ? String(product.stock) : "1", status: (product?.status === "draft" ? "draft" : "live") as "live" | "draft",
  });
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    setErr(null); setUploading(true);
    try {
      for (const file of Array.from(files).slice(0, 8 - images.length)) {
        const path = await uploadImage(seller.id, file);
        setImages((x) => [...x, path]);
      }
    } catch (e) { setErr(errorKey(e)); }
    setUploading(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    const price = toSantim(Number(f.price));
    const compare = f.compare ? toSantim(Number(f.compare)) : null;
    const row = {
      title: f.title.trim(), description: f.description.trim() || null, category_id: f.category_id,
      subcategory: f.subcategory.trim() || null, price_santim: price,
      compare_at_price_santim: compare && compare > price ? compare : null,
      stock: Math.max(0, Math.floor(Number(f.stock))), status: f.status, images,
    };
    const res = product
      ? await db.from("shop_products").update(row).eq("id", product.id)
      : await db.from("shop_products").insert({ ...row, seller_id: seller.id });
    if (res.error) { setErr(errorKey(res.error)); return; }
    // Entfernte Bilder auch aus dem Speicher löschen
    if (product) await Promise.all(product.images.filter((x) => !images.includes(x)).map(deleteImage));
    toast(t("common.saved"));
    onDone();
  };

  return (
    <form className="card pad stack" onSubmit={submit}>
      <div className="row between"><h3>{product ? t("common.edit") : t("s.newProduct")}</h3><button type="button" className="btn ghost sm" onClick={onDone}>{t("common.back")}</button></div>
      <label className="field"><span>{t("s.title")}</span><input required minLength={3} maxLength={120} value={f.title} onChange={set("title")} /></label>
      <div className="grid-2">
        <label className="field"><span>{t("filter.category")}</span>
          <select required value={f.category_id} onChange={set("category_id")}>
            <option value="" disabled>—</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{localName(c, locale)}</option>)}
          </select>
        </label>
        <label className="field"><span>{t("s.subcategory")} <small className="muted">({t("common.optional")})</small></span><input maxLength={60} value={f.subcategory} onChange={set("subcategory")} /></label>
      </div>
      <div className="grid-2">
        <label className="field"><span>{t("s.price")}</span><input required type="number" min={1} step="0.01" inputMode="decimal" value={f.price} onChange={set("price")} /></label>
        <label className="field"><span>{t("s.comparePrice")} <small className="muted">({t("common.optional")})</small></span><input type="number" min={1} step="0.01" inputMode="decimal" value={f.compare} onChange={set("compare")} /></label>
      </div>
      <div className="grid-2">
        <label className="field"><span>{t("s.stock")}</span><input required type="number" min={0} step={1} inputMode="numeric" value={f.stock} onChange={set("stock")} /></label>
        <label className="field"><span>Status</span>
          <select value={f.status} onChange={set("status")}><option value="live">{t("s.statusLive")}</option><option value="draft">{t("s.statusDraft")}</option></select>
        </label>
      </div>
      <label className="field"><span>{t("p.description")} <small className="muted">({t("common.optional")})</small></span><textarea maxLength={4000} rows={5} value={f.description} onChange={set("description")} /></label>
      <div className="field">
        <span>{t("s.images")}</span>
        <div className="img-edit">
          {images.map((path) => (
            <div key={path}><img src={mediaUrl(path)!} alt="" /><button type="button" aria-label={t("common.delete")} onClick={() => setImages((x) => x.filter((p) => p !== path))}><X size={14} /></button></div>
          ))}
          {images.length < 8 && (
            <label className="btn secondary" style={{ width: 84, height: 84, padding: 0 }}>
              {uploading ? "…" : <ImagePlus size={24} />}
              <input type="file" accept="image/*" multiple hidden disabled={uploading} onChange={(e) => addFiles(e.target.files)} />
            </label>
          )}
        </div>
      </div>
      <ErrorNote k={err} />
      <button className="btn" style={{ width: "fit-content" }} disabled={uploading}>{t("common.save")}</button>
    </form>
  );
}
