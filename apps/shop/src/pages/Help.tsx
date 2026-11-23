import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone } from "lucide-react";
import { useI18n } from "@ethio/core";
import { db, dbReady } from "../lib/db";
import type { Settings } from "../lib/types";

export function HelpPage() {
  const { t } = useI18n();
  const [s, setS] = useState<Settings | null>(null);
  useEffect(() => { if (dbReady) db.from("shop_settings").select("*").eq("id", 1).single().then(({ data }) => setS(data as Settings)); }, []);
  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <h1>{t("help.title")}</h1>
      <div className="stack">
        {[1, 2, 3, 4].map((i) => (
          <details key={i} className="card pad" open={i === 1}>
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>{t(`help.q${i}`)}</summary>
            <p style={{ marginBottom: 0 }}>{t(`help.a${i}`)}</p>
          </details>
        ))}
        {(s?.support_email || s?.support_phone) && (
          <div className="card pad stack">
            <h3>{t("help.contact")}</h3>
            {s.support_email && <span className="row"><Mail size={18} /> {s.support_email}</span>}
            {s.support_phone && <span className="row"><Phone size={18} /> {s.support_phone}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export function NotFound() {
  const { t } = useI18n();
  return <div className="container"><h1>404</h1><Link className="btn" to="/">{t("nav.home")}</Link></div>;
}
