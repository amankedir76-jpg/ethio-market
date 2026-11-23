import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ImageOff, Star } from "lucide-react";
import { formatBirr, useI18n } from "@ethio/core";
import { mediaUrl } from "../lib/db";
import type { Product } from "../lib/types";

/* ---------- kurze Hinweismeldung unten am Bildschirm ---------- */
const ToastCtx = createContext<(msg: string) => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    window.clearTimeout((show as unknown as { t?: number }).t);
    (show as unknown as { t?: number }).t = window.setTimeout(() => setMsg(null), 2600);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && <div className="toast" role="status">{msg}</div>}
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

export const Spinner = () => <div className="spinner" aria-label="loading" />;

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty card">{children}</div>;
}

export function Stars({ value, count }: { value: number; count?: number }) {
  const full = Math.round(value);
  return (
    <span className="stars" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={13} fill={i <= full ? "currentColor" : "none"} />)}
      {count != null && <span>({count})</span>}
    </span>
  );
}

export function Price({ santim, old }: { santim: number; old?: number | null }) {
  return (
    <div className="price">
      {formatBirr(santim)}
      {old ? <span className="price-old">{formatBirr(old)}</span> : null}
    </div>
  );
}

export function ProductImage({ path, alt, eager }: { path?: string; alt: string; eager?: boolean }) {
  const url = mediaUrl(path);
  return url
    ? <img src={url} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" />
    : <ImageOff size={34} aria-hidden />;
}

export function ProductCard({ p }: { p: Product }) {
  const { t } = useI18n();
  const discount = p.compare_at_price_santim ? Math.round((1 - p.price_santim / p.compare_at_price_santim) * 100) : 0;
  return (
    <Link to={`/p/${p.id}`} className="p-card">
      <div className="p-img">
        <ProductImage path={p.images[0]} alt={p.title} />
        {discount > 0 && <span className="p-discount">−{discount}%</span>}
      </div>
      <div className="p-body">
        <div className="p-title">{p.title}</div>
        {p.rating_count > 0 && <Stars value={p.rating_avg} count={p.rating_count} />}
        <Price santim={p.price_santim} old={p.compare_at_price_santim} />
        {p.stock < 1 && <span className="tag red">{t("p.out")}</span>}
      </div>
    </Link>
  );
}

export function ProductGrid({ items, loading }: { items: Product[]; loading?: boolean }) {
  if (loading) {
    return <div className="p-grid">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: "3/4" }} />)}</div>;
  }
  return <div className="p-grid">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>;
}

export function ErrorNote({ k }: { k: string | null }) {
  const { t } = useI18n();
  return k ? <div className="notice error" role="alert">{t(k)}</div> : null;
}
