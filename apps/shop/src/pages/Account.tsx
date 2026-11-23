import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { formatBirr, useI18n } from "@ethio/core";
import { Empty, ErrorNote, Spinner, useToast } from "../components/ui";
import { useAuth } from "../lib/auth";
import { db, errorKey } from "../lib/db";
import type { Order, OrderStatus } from "../lib/types";

const FLOW: OrderStatus[] = ["placed", "packed", "shipped", "delivered"];

export function OrderStatusBar({ status }: { status: OrderStatus }) {
  const { t } = useI18n();
  const i = FLOW.indexOf(status);
  return (
    <div className="stack" style={{ gap: 6 }}>
      <span className={`tag ${status === "cancelled" ? "red" : status === "delivered" ? "green" : "gold"}`} style={{ width: "fit-content" }}>{t(`st.${status}`)}</span>
      {status !== "cancelled" && <div className="steps" aria-hidden>{FLOW.map((s, k) => <div key={s} className={k <= i ? "on" : ""} />)}</div>}
    </div>
  );
}

export function OrdersPage() {
  const { t } = useI18n();
  const { session, loading } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!session) return;
    db.from("shop_orders").select("*, shop_order_items(*)").eq("customer_id", session.user.id)
      .order("created_at", { ascending: false }).then(({ data }) => setOrders((data as Order[]) ?? []));
  }, [session]);
  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/login?next=/orders" replace />;

  const act = async (fn: string, args: Record<string, unknown>) => {
    setErr(null);
    const { error } = await db.rpc(fn, args);
    if (error) setErr(errorKey(error)); else { toast(t("common.saved")); load(); }
  };

  return (
    <div className="container" style={{ maxWidth: 820 }}>
      <h1>{t("nav.orders")}</h1>
      <ErrorNote k={err} />
      {!orders ? <Spinner /> : !orders.length ? <Empty>{t("o.none")}<br /><br /><Link className="btn" to="/search">{t("hero.cta")}</Link></Empty> : (
        <div className="stack">
          {orders.map((o) => (
            <div key={o.id} className="card order-card">
              <div className="row between"><b>{o.order_no}</b><span className="muted small">{new Date(o.created_at).toLocaleDateString()}</span></div>
              <OrderStatusBar status={o.status} />
              <div className="small">{o.shop_order_items?.map((i) => <div key={i.id}>{i.qty} × {i.title}</div>)}</div>
              <div className="row between">
                <span className="muted small">{o.delivery_method === "pickup" ? t("co.pickup") : `${o.address.city ?? ""}, ${o.address.landmark ?? ""}`}</span>
                <b>{formatBirr(o.total_santim)}</b>
              </div>
              <div className="row small muted">{t("co.cod")} · {o.payment_status === "paid" ? t("o.paid") : t("o.unpaid")}</div>
              <div className="row">
                {o.status === "placed" && <button className="btn secondary sm" onClick={() => act("shop_set_order_status", { p_order: o.id, p_status: "cancelled" })}>{t("o.cancel")}</button>}
                {(o.status === "packed" || o.status === "shipped") && !o.cancel_requested && <button className="btn secondary sm" onClick={() => act("shop_request_cancel", { p_order: o.id })}>{t("o.requestCancel")}</button>}
                {o.cancel_requested && o.status !== "cancelled" && <span className="tag gold">{t("o.cancelRequested")}</span>}
                {o.status === "shipped" && <button className="btn sm" onClick={() => act("shop_set_order_status", { p_order: o.id, p_status: "delivered" })}>{t("o.received")}</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AccountPage() {
  const { t } = useI18n();
  const { session, loading, profile, refresh, signOut, seller, isAdmin } = useAuth();
  const toast = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { setName(profile?.full_name ?? ""); setPhone(profile?.phone ?? ""); }, [profile]);

  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/login?next=/account" replace />;

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    const { error } = await db.from("profiles").update({ full_name: name.trim(), phone: phone.trim() || null }).eq("id", session.user.id);
    if (error) setErr(errorKey(error)); else { toast(t("common.saved")); void refresh(); }
  };
  const savePw = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    if (pw.length < 8) { setErr("err.password"); return; }
    const { error } = await db.auth.updateUser({ password: pw });
    if (error) setErr(errorKey(error)); else { setPw(""); toast(t("auth.passwordChanged")); }
  };

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <h1>{t("nav.account")}</h1>
      <div className="stack">
        <div className="row">
          <Link className="btn secondary" to="/orders">{t("nav.orders")}</Link>
          <Link className="btn secondary" to="/seller">{seller ? t("nav.seller") : t("nav.sell")}</Link>
          {isAdmin && <Link className="btn secondary" to="/admin">{t("nav.admin")}</Link>}
        </div>
        <ErrorNote k={err} />
        <form className="card pad stack" onSubmit={saveProfile}>
          <h3>{t("auth.profile")}</h3>
          <div className="muted small">{session.user.email}</div>
          <label className="field"><span>{t("auth.name")}</span><input maxLength={80} value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="field"><span>{t("co.phone")}</span><input type="tel" pattern="(\+251|0)?[79][0-9]{8}" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
          <button className="btn" style={{ width: "fit-content" }}>{t("common.save")}</button>
        </form>
        <form className="card pad stack" onSubmit={savePw}>
          <h3>{t("auth.changePassword")}</h3>
          <label className="field"><span>{t("auth.password")}</span><input type="password" minLength={8} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
          <button className="btn secondary" style={{ width: "fit-content" }}>{t("common.save")}</button>
        </form>
        <button className="btn danger" style={{ width: "fit-content" }} onClick={() => void signOut()}>{t("nav.logout")}</button>
      </div>
    </div>
  );
}
