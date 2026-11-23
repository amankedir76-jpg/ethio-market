import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { formatBirr, toSantim, useI18n } from "@ethio/core";
import { Empty, ErrorNote, Spinner, useToast } from "../components/ui";
import { OrderStatusBar } from "./Account";
import { useAuth } from "../lib/auth";
import { db, errorKey, mediaUrl } from "../lib/db";
import { loadRegions, localName } from "../lib/data";
import type { Order, OrderStatus, Product, Region, Seller, Settings } from "../lib/types";

type Tab = "sellers" | "products" | "orders" | "delivery" | "settings";

/** Admin-Bereich. Jede Aktion prüft die Datenbank zusätzlich serverseitig (is_admin). */
export function AdminPage() {
  const { t } = useI18n();
  const { session, loading, isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>("sellers");
  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/login?next=/admin" replace />;
  if (!isAdmin) return <div className="container"><h1>{t("nav.admin")}</h1><div className="notice error">{t("a.notAdmin")}</div></div>;
  return (
    <div className="container">
      <h1>{t("nav.admin")}</h1>
      <div className="tabs" role="tablist">
        {(["sellers", "products", "orders", "delivery", "settings"] as Tab[]).map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{t(`a.${k}`)}</button>
        ))}
      </div>
      {tab === "sellers" && <AdminSellers />}
      {tab === "products" && <AdminProducts />}
      {tab === "orders" && <AdminOrders />}
      {tab === "delivery" && <AdminRegions />}
      {tab === "settings" && <AdminSettings />}
    </div>
  );
}

function AdminSellers() {
  const { t } = useI18n();
  const toast = useToast();
  const [rows, setRows] = useState<Seller[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(() => {
    db.from("shop_sellers").select("*").order("created_at", { ascending: false }).then(({ data }) => setRows((data as Seller[]) ?? []));
  }, []);
  useEffect(() => { load(); }, [load]);
  const update = async (id: string, patch: Partial<Seller>) => {
    setErr(null);
    const { error } = await db.from("shop_sellers").update(patch).eq("id", id);
    if (error) setErr(errorKey(error)); else { toast(t("common.saved")); load(); }
  };
  if (!rows) return <Spinner />;
  if (!rows.length) return <Empty>{t("common.empty")}</Empty>;
  const pending = rows.filter((r) => r.status === "pending").length;
  return (
    <div className="stack">
      {pending > 0 && <div className="notice">{pending} × {t("s.status.pending")}</div>}
      <ErrorNote k={err} />
      <div className="card table-wrap">
        <table>
          <thead><tr><th>{t("s.shopName")}</th><th>{t("co.city")}</th><th>{t("co.phone")}</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td><Link to={`/shop/${s.id}`} style={{ fontWeight: 600 }}>{s.shop_name}</Link>{s.description && <div className="muted small">{s.description.slice(0, 120)}</div>}</td>
                <td>{s.city}</td>
                <td>{s.phone}</td>
                <td><span className={`tag ${s.status === "approved" ? "green" : s.status === "blocked" ? "red" : "gold"}`}>{t(`s.status.${s.status}`)}</span>{s.tier === "premium" && <span className="tag gold" style={{ marginLeft: 4 }}>{t("a.premium")}</span>}</td>
                <td className="row" style={{ flexWrap: "nowrap" }}>
                  {s.status !== "approved" && <button className="btn sm" onClick={() => update(s.id, { status: "approved" })}>{s.status === "blocked" ? t("a.unblock") : t("a.approve")}</button>}
                  {s.status !== "blocked" && <button className="btn secondary sm" onClick={() => update(s.id, { status: "blocked" })}>{t("a.block")}</button>}
                  <button className="btn ghost sm" onClick={() => update(s.id, { tier: s.tier === "premium" ? "standard" : "premium" })}>{t("a.premium")} {s.tier === "premium" ? "✓" : "+"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminProducts() {
  const { t } = useI18n();
  const toast = useToast();
  const [rows, setRows] = useState<Product[] | null>(null);
  const [q, setQ] = useState("");
  const load = useCallback(() => {
    let query = db.from("shop_products").select("*").order("created_at", { ascending: false }).limit(100);
    if (q.trim()) query = query.ilike("title", `%${q.trim().replace(/[%_,()]/g, "")}%`);
    query.then(({ data }) => setRows((data as Product[]) ?? []));
  }, [q]);
  useEffect(() => { load(); }, [load]);
  const setStatus = async (id: string, status: "live" | "blocked") => {
    const { error } = await db.from("shop_products").update({ status }).eq("id", id);
    toast(error ? t(errorKey(error)) : t("common.saved")); load();
  };
  return (
    <div className="stack">
      <input className="input" placeholder={t("search.ph")} value={q} onChange={(e) => setQ(e.target.value)} />
      {!rows ? <Spinner /> : !rows.length ? <Empty>{t("common.empty")}</Empty> : (
        <div className="card table-wrap">
          <table>
            <thead><tr><th></th><th>{t("s.title")}</th><th>{t("s.price")}</th><th>{t("s.stock")}</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>{mediaUrl(p.images[0]) ? <img className="thumb-sm" src={mediaUrl(p.images[0])!} alt="" /> : <div className="thumb-sm" />}</td>
                  <td><Link to={`/p/${p.id}`}>{p.title}</Link></td>
                  <td>{formatBirr(p.price_santim)}</td>
                  <td>{p.stock}</td>
                  <td><span className={`tag ${p.status === "live" ? "green" : p.status === "blocked" ? "red" : ""}`}>{p.status}</span></td>
                  <td>{p.status === "blocked"
                    ? <button className="btn sm" onClick={() => setStatus(p.id, "live")}>{t("a.unblock")}</button>
                    : <button className="btn secondary sm" onClick={() => setStatus(p.id, "blocked")}>{t("a.block")}</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AdminOrders() {
  const { t } = useI18n();
  const toast = useToast();
  const [rows, setRows] = useState<Order[] | null>(null);
  const load = useCallback(() => {
    db.from("shop_orders").select("*, shop_order_items(*)").order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => setRows((data as Order[]) ?? []));
  }, []);
  useEffect(() => { load(); }, [load]);
  const setStatus = async (id: string, status: OrderStatus) => {
    const { error } = await db.rpc("shop_set_order_status", { p_order: id, p_status: status });
    toast(error ? t(errorKey(error)) : t("common.saved")); load();
  };
  if (!rows) return <Spinner />;
  const valid = rows.filter((o) => o.status !== "cancelled");
  const gmv = valid.reduce((a, o) => a + o.subtotal_santim, 0);
  const commission = valid.reduce((a, o) => a + (o.shop_order_items ?? []).reduce((b, i) => b + Math.round(i.unit_price_santim * i.qty * Number(i.commission_pct) / 100), 0), 0);
  return (
    <div className="stack">
      <div className="kpis">
        <div className="card kpi"><div className="muted small">{t("a.orders")}</div><div className="v">{rows.length}</div></div>
        <div className="card kpi"><div className="muted small">{t("a.gmv")}</div><div className="v">{formatBirr(gmv)}</div></div>
        <div className="card kpi"><div className="muted small">{t("s.commission")}</div><div className="v">{formatBirr(commission)}</div></div>
        <div className="card kpi"><div className="muted small">{t("o.cancelRequested")}</div><div className="v">{rows.filter((o) => o.cancel_requested && o.status !== "cancelled").length}</div></div>
      </div>
      {!rows.length ? <Empty>{t("common.empty")}</Empty> : rows.map((o) => (
        <div key={o.id} className="card order-card">
          <div className="row between"><b>{o.order_no}</b><span className="muted small">{new Date(o.created_at).toLocaleString()} · {formatBirr(o.total_santim)}</span></div>
          <OrderStatusBar status={o.status} />
          {o.cancel_requested && o.status !== "cancelled" && <span className="tag gold">{t("o.cancelRequested")}</span>}
          <div className="small">{o.shop_order_items?.map((i) => <div key={i.id}>{i.qty} × {i.title}</div>)}</div>
          <div className="small muted">{o.address.full_name} · {o.address.phone} · {o.delivery_method === "pickup" ? t("co.pickup") : o.address.city}</div>
          <label className="row small">Status
            <select className="input" style={{ width: "auto" }} value={o.status} onChange={(e) => setStatus(o.id, e.target.value as OrderStatus)}>
              {(["placed", "packed", "shipped", "delivered", "cancelled"] as OrderStatus[]).map((s) => <option key={s} value={s}>{t(`st.${s}`)}</option>)}
            </select>
          </label>
        </div>
      ))}
    </div>
  );
}

function AdminRegions() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const [rows, setRows] = useState<Region[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { void loadRegions(true).then(setRows); }, []);
  const change = (code: string, patch: Partial<Region>) => setRows((rs) => rs!.map((r) => (r.code === code ? { ...r, ...patch } : r)));
  const save = async (r: Region) => {
    setErr(null);
    const { error } = await db.from("shop_delivery_regions").update({
      fee_santim: r.fee_santim, eta_min_days: r.eta_min_days, eta_max_days: r.eta_max_days,
      enabled: r.enabled && r.fee_santim != null,
    }).eq("code", r.code);
    if (error) setErr(errorKey(error)); else { toast(t("common.saved")); setRows(await loadRegions(true)); }
  };
  if (!rows) return <Spinner />;
  const num = (v: string) => (v === "" ? null : Math.max(0, Math.floor(Number(v))));
  return (
    <div className="stack">
      <div className="notice">{t("a.regionsHint")}</div>
      <ErrorNote k={err} />
      <div className="card table-wrap">
        <table>
          <thead><tr><th>{t("co.region")}</th><th>{t("a.fee")}</th><th>{t("a.etaMin")}</th><th>{t("a.etaMax")}</th><th>{t("a.enabled")}</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.code}>
                <td>{localName(r, locale)}</td>
                <td><input className="input" style={{ width: 110 }} type="number" min={0} value={r.fee_santim == null ? "" : r.fee_santim / 100} onChange={(e) => change(r.code, { fee_santim: e.target.value === "" ? null : toSantim(Number(e.target.value)) })} /></td>
                <td><input className="input" style={{ width: 70 }} type="number" min={0} value={r.eta_min_days ?? ""} onChange={(e) => change(r.code, { eta_min_days: num(e.target.value) })} /></td>
                <td><input className="input" style={{ width: 70 }} type="number" min={0} value={r.eta_max_days ?? ""} onChange={(e) => change(r.code, { eta_max_days: num(e.target.value) })} /></td>
                <td><input type="checkbox" checked={r.enabled} disabled={r.fee_santim == null} onChange={(e) => change(r.code, { enabled: e.target.checked })} /></td>
                <td><button className="btn sm" onClick={() => save(r)}>{t("common.save")}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminSettings() {
  const { t } = useI18n();
  const toast = useToast();
  const [s, setS] = useState<Settings | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { db.from("shop_settings").select("*").eq("id", 1).single().then(({ data }) => setS(data as Settings)); }, []);
  if (!s) return <Spinner />;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    const { error } = await db.from("shop_settings").update({
      commission_pct: s.commission_pct, premium_commission_pct: s.premium_commission_pct,
      free_delivery_from_santim: s.free_delivery_from_santim, support_email: s.support_email || null, support_phone: s.support_phone || null,
    }).eq("id", 1);
    if (error) setErr(errorKey(error)); else toast(t("common.saved"));
  };
  return (
    <form className="card pad stack" style={{ maxWidth: 560 }} onSubmit={submit}>
      <div className="grid-2">
        <label className="field"><span>{t("a.commission")}</span><input type="number" min={0} max={50} step="0.5" value={s.commission_pct} onChange={(e) => setS({ ...s, commission_pct: Number(e.target.value) })} /></label>
        <label className="field"><span>{t("a.premiumCommission")}</span><input type="number" min={0} max={50} step="0.5" value={s.premium_commission_pct} onChange={(e) => setS({ ...s, premium_commission_pct: Number(e.target.value) })} /></label>
      </div>
      <label className="field"><span>{t("a.freeFrom")}</span><input type="number" min={0} value={s.free_delivery_from_santim == null ? "" : s.free_delivery_from_santim / 100}
        onChange={(e) => setS({ ...s, free_delivery_from_santim: e.target.value === "" ? null : toSantim(Number(e.target.value)) })} /></label>
      <div className="grid-2">
        <label className="field"><span>{t("a.supportEmail")}</span><input type="email" value={s.support_email ?? ""} onChange={(e) => setS({ ...s, support_email: e.target.value })} /></label>
        <label className="field"><span>{t("a.supportPhone")}</span><input type="tel" value={s.support_phone ?? ""} onChange={(e) => setS({ ...s, support_phone: e.target.value })} /></label>
      </div>
      <ErrorNote k={err} />
      <button className="btn" style={{ width: "fit-content" }}>{t("common.save")}</button>
    </form>
  );
}
