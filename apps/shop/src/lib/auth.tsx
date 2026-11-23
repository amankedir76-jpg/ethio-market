import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { db, dbReady } from "./db";
import type { Seller } from "./types";

type AuthState = {
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  seller: Seller | null;
  profile: { full_name: string | null; phone: string | null } | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

/** Hält Sitzung, Profil, eigenen Shop und Admin-Status. Rechte prüft trotzdem immer die Datenbank. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(dbReady);
  const [isAdmin, setIsAdmin] = useState(false);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [profile, setProfile] = useState<AuthState["profile"]>(null);

  const loadUserData = useCallback(async (s: Session | null) => {
    if (!s) { setIsAdmin(false); setSeller(null); setProfile(null); return; }
    const uid = s.user.id;
    const [adm, sel, prof] = await Promise.all([
      db.from("platform_admins").select("user_id").eq("user_id", uid).maybeSingle(),
      db.from("shop_sellers").select("*").eq("owner_id", uid).maybeSingle(),
      db.from("profiles").select("full_name, phone").eq("id", uid).maybeSingle(),
    ]);
    setIsAdmin(!!adm.data);
    setSeller((sel.data as Seller) ?? null);
    setProfile(prof.data ?? null);
  }, []);

  useEffect(() => {
    if (!dbReady) return;
    db.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadUserData(data.session);
      setLoading(false);
    });
    const { data: sub } = db.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // Nicht direkt im Callback abfragen (Empfehlung von Supabase), sondern kurz danach
      setTimeout(() => { void loadUserData(s); }, 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadUserData]);

  const refresh = useCallback(() => loadUserData(session), [loadUserData, session]);
  const signOut = useCallback(async () => { await db.auth.signOut(); }, []);

  return (
    <Ctx.Provider value={{ session, loading, isAdmin, seller, profile, refresh, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthState {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
}
