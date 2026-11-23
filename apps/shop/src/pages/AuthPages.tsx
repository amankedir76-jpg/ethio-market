import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useI18n } from "@ethio/core";
import { ErrorNote } from "../components/ui";
import { db, errorKey } from "../lib/db";
import { useAuth } from "../lib/auth";

const box = { maxWidth: 440, margin: "32px auto" } as const;
/** Nur interne Weiterleitungen erlauben (Schutz vor Umleitung auf fremde Seiten). */
const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/");

export function LoginPage() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (session) return <Navigate to={safeNext(sp.get("next"))} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setBusy(true);
    const { error } = await db.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setErr(errorKey(error)); else nav(safeNext(sp.get("next")), { replace: true });
  };

  return (
    <div className="container" style={box}>
      <form className="card pad stack" onSubmit={submit}>
        <h1 style={{ margin: 0 }}>{t("auth.login")}</h1>
        <label className="field"><span>{t("auth.email")}</span><input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="field"><span>{t("auth.password")}</span><input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <ErrorNote k={err} />
        <button className="btn block" disabled={busy}>{busy ? t("common.loading") : t("auth.login")}</button>
        <Link className="btn ghost sm" to="/forgot">{t("auth.forgot")}</Link>
        <p className="muted small" style={{ textAlign: "center", margin: 0 }}>{t("auth.noAccount")} <Link style={{ color: "var(--primary)", fontWeight: 600 }} to={`/register${sp.get("next") ? `?next=${encodeURIComponent(sp.get("next")!)}` : ""}`}>{t("auth.register")}</Link></p>
      </form>
    </div>
  );
}

export function RegisterPage() {
  const { t } = useI18n();
  const [sp] = useSearchParams();
  const { session } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  if (session) return <Navigate to={safeNext(sp.get("next"))} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    if (password.length < 8) { setErr("err.password"); return; }
    setBusy(true);
    const { data, error } = await db.auth.signUp({
      email: email.trim(), password,
      options: { data: { full_name: name.trim() }, emailRedirectTo: `${location.origin}${safeNext(sp.get("next"))}` },
    });
    setBusy(false);
    if (error) { setErr(errorKey(error)); return; }
    // Ist die E-Mail-Bestätigung aktiv, gibt es noch keine Sitzung
    if (!data.session) setDone(true);
  };

  if (done) return <div className="container" style={box}><div className="notice ok">{t("auth.checkMail")}</div></div>;

  return (
    <div className="container" style={box}>
      <form className="card pad stack" onSubmit={submit}>
        <h1 style={{ margin: 0 }}>{t("auth.register")}</h1>
        <label className="field"><span>{t("auth.name")}</span><input required maxLength={80} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="field"><span>{t("auth.email")}</span><input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="field"><span>{t("auth.password")}</span><input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <ErrorNote k={err} />
        <button className="btn block" disabled={busy}>{busy ? t("common.loading") : t("auth.register")}</button>
        <p className="muted small" style={{ textAlign: "center", margin: 0 }}>{t("auth.haveAccount")} <Link style={{ color: "var(--primary)", fontWeight: 600 }} to="/login">{t("auth.login")}</Link></p>
      </form>
    </div>
  );
}

export function ForgotPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/reset-password` });
    setSent(true); // Immer gleiche Antwort: verrät nicht, ob eine Adresse existiert
  };
  return (
    <div className="container" style={box}>
      <form className="card pad stack" onSubmit={submit}>
        <h1 style={{ margin: 0 }}>{t("auth.forgot")}</h1>
        {sent ? <div className="notice ok">{t("auth.resetSent")}</div> : (
          <>
            <label className="field"><span>{t("auth.email")}</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <button className="btn block">{t("auth.sendReset")}</button>
          </>
        )}
      </form>
    </div>
  );
}

/** Wird über den Link aus der E-Mail geöffnet; Supabase meldet den Nutzer dabei an. */
export function ResetPasswordPage() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setErr("err.password"); return; }
    const { error } = await db.auth.updateUser({ password });
    if (error) setErr(errorKey(error)); else { setOk(true); setTimeout(() => nav("/account"), 1500); }
  };
  return (
    <div className="container" style={box}>
      <form className="card pad stack" onSubmit={submit}>
        <h1 style={{ margin: 0 }}>{t("auth.newPassword")}</h1>
        {ok ? <div className="notice ok">{t("auth.passwordChanged")}</div> : (
          <>
            <label className="field"><span>{t("auth.password")}</span><input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            <ErrorNote k={err} />
            <button className="btn block">{t("common.save")}</button>
          </>
        )}
      </form>
    </div>
  );
}
