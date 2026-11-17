import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { typeLabel } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { Button } from "../components/ui/Button";
import { useI18n } from "../context/I18nContext";

export default function AdminVerify({ pending, onApprove, onReview }) {
  const { t } = useI18n();
  const [busyId, setBusyId] = useState(null);

  const handleApprove = async (s) => {
    setBusyId(s.id);
    try {
      await onApprove(s);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Head title={t("admin.verifications")} />
      {pending.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{t("admin.queue_clear")}</h2>
        </div>
      ) : (
        <div className="stack" style={{ gap: 12 }}>
          {pending.map((s) => (
            <div className="card" key={s.id} style={{ padding: 14 }}>
              <div className="between" style={{ alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div className="row" style={{ gap: 8, alignItems: "center" }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{s.name}</h3>
                    <Badge>{typeLabel(s.type)}</Badge>
                  </div>
                  <div style={{ fontFamily: "var(--font-monospace)", fontSize: 12, color: "var(--color-slate)", marginTop: 4 }}>
                    {s.nin} · {s.phone} · {s.district}
                  </div>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <Button variant="outline" size="sm" disabled={busyId === s.id} onClick={() => onReview(s)}>{t("common.reject")}</Button>
                  <Button variant="primary" size="sm" disabled={busyId === s.id} onClick={() => handleApprove(s)}>
                    {busyId === s.id ? <Loader2 size={14} className="spin" /> : t("common.approve")}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
