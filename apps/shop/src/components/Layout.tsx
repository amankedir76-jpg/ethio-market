import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Moon, Search, ShoppingCart, Store, Sun, User } from "lucide-react";
import { LOCALES, useI18n, type Locale } from "@ethio/core";
import { useCart } from "../lib/cart";
import { useAuth } from "../lib/auth";
import { localName, searchProducts, useCategories } from "../lib/data";
import { clearHistory, getHistory, pushHistory } from "../lib/storage";
import { readJSON, writeJSON } from "../lib/storage";
import { dbReady } from "../lib/db";
import type { Product } from "../lib/types";

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => readJSON("ethio.theme", "light"));
  useEffect(() => { document.documentElement.dataset.theme = theme; writeJSON("ethio.theme", theme); }, [theme]);
  return [theme, () => setTheme(theme === "dark" ? "light" : "dark")] as const;
}

/** Suche mit Live-Vorschlägen (nach kurzer Tipp-Pause) und abschaltbarem Verlauf. */
function SearchBox() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<Product[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) { setHits([]); return; }
    const id = window.setTimeout(() => {
      searchProducts({ q, limit: 6 }).then(setHits).catch(() => setHits([]));
    }, 250);
    return () => window.clearTimeout(id);
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const go = (term: string) => {
    pushHistory(term);
    setOpen(false);
    nav(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <div className="search" ref={box}>
      <form role="search" onSubmit={(e) => { e.preventDefault(); go(q.trim()); }}>
        <label className="sr-only" htmlFor="q">{t("search.ph")}</label>
        <input id="q" type="search" value={q} placeholder={t("search.ph")} autoComplete="off"
          onFocus={() => { setHistory(getHistory()); setOpen(true); }}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }} />
        <button type="submit" aria-label={t("search.btn")}><Search size={18} /></button>
      </form>
      {open && (hits.length > 0 || (q.length < 2 && history.length > 0)) && (
        <div className="suggest">
          {q.length < 2 && history.length > 0 && (
            <>
              <div className="head">
                {t("search.recent")}
                <button className="btn ghost sm" onClick={() => { clearHistory(); setHistory([]); }}>{t("search.clear")}</button>
              </div>
              {history.map((h) => <button key={h} className="link" onClick={() => { setQ(h); go(h); }}><Search size={14} /> {h}</button>)}
            </>
          )}
          {hits.map((p) => <Link key={p.id} to={`/p/${p.id}`} onClick={() => setOpen(false)}>{p.title}</Link>)}
        </div>
      )}
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { t, locale, setLocale } = useI18n();
  const { count } = useCart();
  const { session, seller, isAdmin } = useAuth();
  const cats = useCategories();
  const [theme, toggleTheme] = useTheme();

  return (
    <>
      <header className="header">
        <div className="container">
          <div className="header-row">
            <Link to="/" className="logo" aria-label={t("app.name")}>
              <span className="logo-mark">EM</span>
              <span>ETHIO<b>MARKET</b></span>
            </Link>
            <SearchBox />
            <div className="header-actions">
              <select className="lang-select" aria-label="Language" value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
                {LOCALES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
              <button className="icon-btn" onClick={toggleTheme} aria-label={t("theme.toggle")} title={t("theme.toggle")}>
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              {(seller || isAdmin) && (
                <Link className="icon-btn" to={isAdmin ? "/admin" : "/seller"} title={isAdmin ? t("nav.admin") : t("nav.seller")}>
                  <Store size={20} /><span className="hide-sm">{isAdmin ? t("nav.admin") : t("nav.seller")}</span>
                </Link>
              )}
              <Link className="icon-btn" to={session ? "/account" : "/login"} title={session ? t("nav.account") : t("nav.login")}>
                <User size={20} /><span className="hide-sm">{session ? t("nav.account") : t("nav.login")}</span>
              </Link>
              <Link className="icon-btn" to="/cart" aria-label={t("nav.cart")}>
                <ShoppingCart size={21} />
                {count > 0 && <span className="badge">{count}</span>}
              </Link>
            </div>
          </div>
          <nav className="catbar" aria-label={t("nav.categories")}>
            {cats.map((c) => (
              <NavLink key={c.id} to={`/search?category=${c.id}`} className="chip">{localName(c, locale)}</NavLink>
            ))}
          </nav>
        </div>
      </header>
      {!dbReady && <div className="container" style={{ marginTop: 16 }}><div className="notice">{t("nodb")}</div></div>}
      <main>{children}</main>
      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <div className="logo" style={{ marginBottom: 8 }}><span className="logo-mark">EM</span><span>ETHIO<b>MARKET</b></span></div>
            <p className="muted small">{t("footer.rights")}<br />{t("footer.legal")}</p>
          </div>
          <div>
            <Link to="/search">{t("nav.categories")}</Link>
            <Link to="/orders">{t("nav.orders")}</Link>
            <Link to="/cart">{t("nav.cart")}</Link>
          </div>
          <div>
            <Link to="/seller">{t("nav.sell")}</Link>
            <Link to="/help">{t("nav.help")}</Link>
            <Link to="/account">{t("nav.account")}</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
