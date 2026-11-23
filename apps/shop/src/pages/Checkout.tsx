import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Banknote, CheckCircle2, Trash2 } from "lucide-react";
import { formatBirr, useI18n } from "@ethio/core";
import { Empty, ErrorNote, Price, ProductImage, Spinner } from "../components/ui";
import { useCart } from "../lib/cart";
import { useAuth } from "../lib/auth";
import { loadProductsByIds, loadSellers, localName, useRegions } from "../lib/data";
import { db, errorKey } from "../lib/db";
import { readJSON, writeJSON } from "../lib/storage";
import type { Address, Order, Product, Seller } from "../lib/types";

function useCartProducts() {
  const { lines } = useCart();
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const ids = lines.map((l) => l.productId).join(",");
  useEffect(() => {
    loadProductsByIds(ids ? ids.split(",") : [])
      .then((ps) => setProducts(Object.fromEntries(ps.map((p) => [p.id, p]))))
      .finally(() => setLoading(false));
  }, [ids]);
  return { products, loading };
}

export function CartPage() {
  const { t } = useI18n();
  const cart = useCart();
  const { products, loading } = useCartProducts();
  if (loading) return <Spinner />;
  const subtotal = cart.lines.reduce((a, l) => a + (products[l.productId]?.price_santim ?? 0) * l.qty, 0);
  const hasUnavailable = cart.lines.some((l) => { const p = products[l.productId]; return !p || p.status !== "live" || p.stock < l.qty; });

  return (
    <div className="container">
      <h1>{t("cart.title")}</h1>
      {!cart.lines.length ? (
        <Empty>{t("cart.empty")}<br /><br /><Link className="btn" to="/search">{t("hero.cta")}</Link></Empty>
      ) : (
        <div className="side-layout">
          <div className="card">
            {cart.lines.map((l) => {
              const p = products[l.productId];
              const ok = p && p.status === "live" && p.stock >= l.qty;
              return (
                <div key={l.productId} className="row pad" style={{ borderBottom: "1px solid var(--line)", flexWrap: "nowrap", alignItems: "flex-start" }}>
                  <div className="p-img" style={{ width: 80, flex: "none", borderRadius: 10, overflow: "hidden" }}><ProductImage path={p?.images[0]} alt="" /></div>
                  <div style={{ flex: 1 }} className="stack">
                    {p ? <Link to={`/p/${p.id}`}>{p.title}</Link> : <span className="muted">—</span>}
                    {p && <Price santim={p.price_santim} />}
                    {!ok && <span className="tag red" style={{ width: "fit-content" }}>{p && p.stock > 0 && p.stock < l.qty ? `${p.stock} ${t("p.left")}` : t("cart.unavailable")}</span>}
                    <div className="row">
                      <div className="qty">
                        <button onClick={() => cart.setQty(l.productId, l.qty - 1, p?.stock)} aria-label="−">−</button>
                        <span>{l.qty}</span>
                        <button onClick={() => cart.setQty(l.productId, l.qty + 1, p?.stock)} aria-label="+">+</button>
                      </div>
                      <button className="btn ghost sm" onClick={() => cart.remove(l.productId)}><Trash2 size={16} /> {t("cart.remove")}</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="card pad stack" style={{ alignSelf: "start" }}>
            <div className="row between"><span>{t("cart.subtotal")}</span><b>{formatBirr(subtotal)}</b></div>
            <Link className={`btn block${hasUnavailable ? " disabled" : ""}`} to={hasUnavailable ? "#" : "/checkout"} aria-disabled={hasUnavailable}
              onClick={(e) => hasUnavailable && e.preventDefault()} style={hasUnavailable ? { opacity: 0.55 } : undefined}>
              {t("cart.checkout")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

const ADDR_KEY = "ethio.lastAddress";

export function CheckoutPage() {
  const { t, locale } = useI18n();
  const nav = useNavigate();
  const cart = useCart();
  const { session, profile } = useAuth();
  const regions = useRegions();
  const { products, loading } = useCartProducts();
  const [sellers, setSellers] = useState<Record<string, Seller>>({});
  const [method, setMethod] = useState<"delivery" | "pickup">("delivery");
  const [addr, setAddr] = useState<Address>(() => readJSON<Address>(ADDR_KEY, { full_name: "", phone: "" }));
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ids = Object.values(products).map((p) => p.seller_id);
    if (ids.length) void loadSellers(ids).then(setSellers);
  }, [products]);
  useEffect(() => {
    if (profile && !addr.full_name) setAddr((a) => ({ ...a, full_name: profile.full_name ?? "", phone: a.phone || profile.phone || "" }));
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const served = regions.filter((r) => r.enabled && r.fee_santim != null);
  const region = served.find((r) => r.code === addr.region);
  const sellerIds = [...new Set(cart.lines.map((l) => products[l.productId]?.seller_id).filter(Boolean))] as string[];
  const pickupSeller = sellerIds.length === 1 && sellers[sellerIds[0]]?.pickup_enabled ? sellers[sellerIds[0]] : null;

  useEffect(() => { if (!served.length && pickupSeller) setMethod("pickup"); }, [served.length, pickupSeller]);

  const subtotal = cart.lines.reduce((a, l) => a + (products[l.productId]?.price_santim ?? 0) * l.qty, 0);
  const fee = method === "delivery" && region ? region.fee_santim ?? 0 : 0;
  const canOrder = useMemo(() => {
    if (!cart.lines.length || busy) return false;
    if (method === "pickup") return !!pickupSeller;
    return !!region;
  }, [cart.lines.length, busy, method, pickupSeller, region]);

  if (!session) return <div className="container"><h1>{t("co.title")}</h1><Empty>{t("co.loginFirst")}<br /><br /><Link className="btn" to="/login?next=/checkout">{t("nav.login")}</Link></Empty></div>;
  if (loading) return <Spinner />;
  if (!cart.lines.length) return <div className="container"><h1>{t("co.title")}</h1><Empty>{t("cart.empty")}</Empty></div>;

  const upd = (k: keyof Address) => (e: { target: { value: string } }) => setAddr((a) => ({ ...a, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    const address: Address = method === "pickup" ? { full_name: addr.full_name.trim(), phone: addr.phone.trim() } : { ...addr, full_name: addr.full_name.trim(), phone: addr.phone.trim() };
    const { data, error } = await db.rpc("shop_place_order", {
      p_items: cart.lines.map((l) => ({ product_id: l.productId, qty: l.qty })),
      p_address: address, p_delivery_method: method, p_note: note || null,
    });
    setBusy(false);
    if (error) { setErr(errorKey(error)); return; }
    writeJSON(ADDR_KEY, addr);
    cart.clear();
    nav(`/order/${data as string}`, { replace: true });
  };

  return (
    <div className="container">
      <h1>{t("co.title")}</h1>
      <form className="side-layout" onSubmit={submit}>
        <div className="stack">
          <div className="card pad stack">
            <h3>{t("co.method")}</h3>
            <label className={`choice${method === "delivery" ? " on" : ""}`}>
              <input type="radio" name="m" checked={method === "delivery"} onChange={() => setMethod("delivery")} />
              <div><b>{t("co.delivery")}</b>{!served.length && <div className="muted small">{t("co.noRegions")}</div>}</div>
            </label>
            <label className={`choice${method === "pickup" ? " on" : ""}`} style={!pickupSeller ? { opacity: .6 } : undefined}>
              <input type="radio" name="m" disabled={!pickupSeller} checked={method === "pickup"} onChange={() => setMethod("pickup")} />
              <div><b>{t("co.pickup")}</b>
                <div className="muted small">{pickupSeller ? `${t("co.pickupAt")}: ${pickupSeller.pickup_address ?? pickupSeller.city}` : t("co.pickupOnlyOne")}</div>
              </div>
            </label>
          </div>

          <div className="card pad stack">
            <h3>{method === "delivery" ? t("co.address") : t("co.contact")}</h3>
            <div className="grid-2">
              <label className="field"><span>{t("co.name")}</span><input required maxLength={80} value={addr.full_name} onChange={upd("full_name")} autoComplete="name" /></label>
              <label className="field"><span>{t("co.phone")}</span><input required type="tel" inputMode="tel" pattern="(\+251|0)?[79][0-9]{8}" value={addr.phone} onChange={upd("phone")} autoComplete="tel" /></label>
            </div>
            {method === "delivery" && (
              <>
                <div className="grid-2">
                  <label className="field"><span>{t("co.region")}</span>
                    <select required value={addr.region ?? ""} onChange={upd("region")}>
                      <option value="" disabled>—</option>
                      {regions.map((r) => <option key={r.code} value={r.code} disabled={!(r.enabled && r.fee_santim != null)}>{localName(r, locale)}{!(r.enabled && r.fee_santim != null) ? " ✕" : ""}</option>)}
                    </select>
                  </label>
                  <label className="field"><span>{t("co.city")}</span><input required maxLength={60} value={addr.city ?? ""} onChange={upd("city")} /></label>
                </div>
                <div className="grid-2">
                  <label className="field"><span>{t("co.subcity")} <small className="muted">({t("common.optional")})</small></span><input maxLength={60} value={addr.subcity ?? ""} onChange={upd("subcity")} /></label>
                  <label className="field"><span>{t("co.kebele")} <small className="muted">({t("common.optional")})</small></span><input maxLength={30} value={addr.kebele ?? ""} onChange={upd("kebele")} /></label>
                </div>
                <label className="field"><span>{t("co.street")} <small className="muted">({t("common.optional")})</small></span><input maxLength={100} value={addr.street ?? ""} onChange={upd("street")} /></label>
                <label className="field"><span>{t("co.landmark")}</span><textarea required minLength={5} maxLength={300} placeholder={t("co.landmarkPh")} value={addr.landmark ?? ""} onChange={upd("landmark")} /></label>
              </>
            )}
            <label className="field"><span>{t("co.note")} <small className="muted">({t("common.optional")})</small></span><textarea maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} /></label>
          </div>

          <div className="card pad stack">
            <h3>{t("co.payment")}</h3>
            <label className="choice on"><input type="radio" checked readOnly /><div><b className="row"><Banknote size={18} />{t("co.cod")}</b><div className="muted small">{t("co.codText")}</div></div></label>
            <p className="muted small" style={{ margin: 0 }}>{t("co.otherPay")}</p>
          </div>
        </div>

        <div className="card pad stack" style={{ alignSelf: "start" }} data-sticky>
          {cart.lines.map((l) => products[l.productId] && (
            <div key={l.productId} className="row between small"><span>{l.qty} × {products[l.productId].title}</span><span>{formatBirr(products[l.productId].price_santim * l.qty)}</span></div>
          ))}
          <hr style={{ border: 0, borderTop: "1px solid var(--line)", width: "100%" }} />
          <div className="row between"><span>{t("cart.subtotal")}</span><span>{formatBirr(subtotal)}</span></div>
          <div className="row between"><span>{t("co.fee")}</span><span>{method === "pickup" ? t("common.free") : region ? formatBirr(fee) : "—"}</span></div>
          {method === "delivery" && region?.eta_min_days != null && <div className="muted small">{t("co.eta")}: {region.eta_min_days}–{region.eta_max_days} {t("common.days")}</div>}
          <div className="row between" style={{ fontSize: 18 }}><b>{t("co.total")}</b><b>{formatBirr(subtotal + fee)}</b></div>
          <ErrorNote k={err} />
          <button className="btn block" disabled={!canOrder}>{busy ? t("common.loading") : t("co.place")}</button>
        </div>
      </form>
    </div>
  );
}

export function OrderDonePage() {
  const { id } = useParams();
  const { t } = useI18n();
  const [o, setO] = useState<Order | null>(null);
  useEffect(() => { if (id) db.from("shop_orders").select("*").eq("id", id).maybeSingle().then(({ data }) => setO(data as Order)); }, [id]);
  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <div className="card pad stack" style={{ marginTop: 32, textAlign: "center", justifyItems: "center" }}>
        <CheckCircle2 size={56} color="var(--primary)" />
        <h1 style={{ margin: 0 }}>{t("co.done")}</h1>
        {o && <p style={{ margin: 0 }}><b>{o.order_no}</b> · {formatBirr(o.total_santim)}</p>}
        <p className="muted" style={{ margin: 0 }}>{t("co.doneText")}</p>
        <div className="row"><Link className="btn" to="/orders">{t("nav.orders")}</Link><Link className="btn secondary" to="/">{t("nav.home")}</Link></div>
      </div>
    </div>
  );
}
