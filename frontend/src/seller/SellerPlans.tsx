import React from "react";
import { ugx, dshort, daysTo } from "../utils/helpers";
import { Head } from "../components/Head";
import { Button } from "../components/ui/Button";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";

export default function SellerPlans({ myPlans, setPlans, pushSms, say, onCreatePlan }) {
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel this harvest plan?")) return;
    const realId = id.replace("H-", "");
    try {
      await api.delete(ENDPOINTS.plan(realId));
      setPlans(ps => ps.filter(x => x.id !== id));
    } catch {
      // Fallback
      setPlans(ps => ps.filter(x => x.id !== id));
    }
  };
  return (
    <>
      <Head
        title="Harvest Plans"
        action={
          <Button variant="primary" onClick={onCreatePlan}>
            + New plan
          </Button>
        }
      />

      <div className="stack" style={{ gap: "16px" }}>
        {myPlans.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 12px", color: "var(--color-obsidian)" }}>No harvest plans</h2>
            <Button variant="primary" onClick={onCreatePlan}>
              Create your first plan
            </Button>
          </div>
        ) : (
          myPlans.map(p => {
            const pct = Math.min(100, Math.round((p.reserved / p.qty) * 100));
            return (
              <div className="card" key={p.id}>
                <div className="between" style={{ alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--color-obsidian)" }}>{p.name}</h3>
                    <div style={{ fontSize: "13px", color: "var(--color-slate)", marginTop: "2px" }}>
                      Planted {dshort(p.planted)} · Harvest {dshort(p.harvest)} ({daysTo(p.harvest)} days)
                    </div>
                  </div>
                  <div className="row" style={{ gap: "8px" }}>
                    {p.reserved === 0 && (
                      <button
                        className="btn-sm"
                        style={{ color: "var(--color-alarm-red)", borderColor: "var(--color-alarm-red)" }}
                        onClick={() => handleDelete(p.id)}
                      >
                        Cancel plan
                      </button>
                    )}
                    <button
                      className="btn-sm"
                      onClick={async () => {
                        const current = new Date(p.harvest);
                        current.setDate(current.getDate() + 7);
                        const newDate = current.toISOString().split("T")[0];
                        
                        try {
                          await api.patch(ENDPOINTS.plan(p.id.replace("H-", "")), { expected_harvest: newDate });
                        } catch {
                          // Ignore fallback
                        }

                        setPlans(ps => ps.map(x => x.id === p.id ? { ...x, harvest: newDate } : x));
                        pushSms("Buyer · Nakato Catering", `${p.name} harvest moved to ${dshort(newDate)}.`);
                        say("Harvest date updated");
                      }}
                    >
                      Postpone 1 week
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: "16px" }}>
                  <div style={{ height: "6px", backgroundColor: "var(--color-fog)", borderRadius: "var(--radius-full)", overflow: "hidden", marginBottom: "8px" }}>
                    <div style={{ width: `${pct}%`, height: "100%", backgroundColor: "var(--color-lime-voltage)" }} />
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--color-slate)" }}>
                    {p.reserved} of {p.qty} {p.unit} reserved ({pct}%) · Deposits: {ugx(p.reserved * p.price * p.deposit / 100)}
                  </div>
                </div>

                {p.reserved > 0 && (
                  <div style={{ marginTop: "16px", borderTop: "1px solid var(--color-fog)", paddingTop: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                      <span style={{ color: "var(--color-slate)" }}>Total Reserved Volume:</span>
                      <strong style={{ fontFamily: "var(--font-monospace)", color: "var(--color-obsidian)" }}>{p.reserved} {p.unit}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", marginTop: "6px" }}>
                      <span style={{ color: "var(--color-slate)" }}>Total Deposits In Escrow:</span>
                      <strong style={{ fontFamily: "var(--font-monospace)", color: "var(--color-forest-ink)" }}>{ugx(p.reserved * p.price * p.deposit / 100)}</strong>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
