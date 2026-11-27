import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { ugx, dshort } from "../utils/helpers";
import { Head } from "../components/Head";
import { Button } from "../components/ui/Button";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { useI18n } from "../context/I18nContext";

export default function SellerPlans({ myPlans, setPlans, say, onCreatePlan }) {
  const { t, tp, tu } = useI18n();
  const [busyId, setBusyId] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm(`${t("common.cancel")}?`)) return;
    const realId = id.replace("H-", "");
    try {
      await api.delete(ENDPOINTS.plan(realId));
    } catch {}
    setPlans((ps) => ps.filter((x) => x.id !== id));
  };

  const handleAdvance = async (p) => {
    const realId = p.id.replace("H-", "");
    setBusyId(p.id);
    try {
      const res = await api.post(ENDPOINTS.planAdvance(realId));
      say?.(`${t("seller.draw_advance")}: ${ugx(res.advance_sent)}`);
    } catch (err) {
      say?.(err.message || "No advance available");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Head
        title={t("seller.harvest_plans")}
        action={<Button variant="primary" onClick={onCreatePlan}>{t("seller.new_short")}</Button>}
      />
      <div className="stack" style={{ gap: 12 }}>
        {myPlans.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px" }}>{t("seller.no_plans")}</h2>
            <Button variant="primary" onClick={onCreatePlan}>{t("seller.create_plan")}</Button>
          </div>
        ) : (
          myPlans.map((p) => {
            const pct = p.qty ? Math.min(100, Math.round((p.reserved / p.qty) * 100)) : 0;
            return (
              <div className="card" key={p.id} style={{ padding: 14 }}>
                <div className="between" style={{ alignItems: "center", gap: 8 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{tp(p.name)}</h3>
                    <div style={{ fontSize: 12, color: "var(--color-slate)" }}>
                      {dshort(p.harvest)} · {ugx(p.price)}/{tu(p.unit)}
                    </div>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    {p.reserved > 0 && (
                      <Button variant="primary" size="sm" disabled={busyId === p.id} onClick={() => handleAdvance(p)}>
                        {busyId === p.id ? <Loader2 size={13} className="spin" /> : t("seller.draw_advance")}
                      </Button>
                    )}
                    {p.reserved === 0 && (
                      <button
                        className="btn-sm"
                        style={{ color: "var(--color-alarm-red)", borderColor: "var(--color-alarm-red)" }}
                        onClick={() => handleDelete(p.id)}
                      >
                        {t("common.cancel")}
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ height: 5, backgroundColor: "var(--color-fog)", borderRadius: "var(--radius-full)", overflow: "hidden", marginBottom: 4 }}>
                    <div style={{ width: `${pct}%`, height: "100%", backgroundColor: "var(--color-lime-voltage)" }} />
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-slate)" }}>
                    {t("seller.reserved_progress", { reserved: p.reserved, qty: p.qty, unit: tu(p.unit) })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
