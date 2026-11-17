import React from "react";
import { EMOJI } from "../data/categories";
import { ugx, dshort } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { Button } from "../components/ui/Button";
import { useI18n } from "../context/I18nContext";

export default function PreOrders({ plans, onPreorder }) {
  const { t, tp, tu } = useI18n();
  return (
    <>
      <Head title={t("buyer.preorders")} />
      <div className="grid g3">
        {plans.length === 0 ? (
          <div className="card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 20px" }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "var(--color-obsidian)" }}>
              {t("buyer.no_plans")}
            </h2>
          </div>
        ) : (
          plans.map((p) => {
            const left = Math.max(0, p.qty - p.reserved);
            const pct = p.qty ? Math.min(100, Math.round((p.reserved / p.qty) * 100)) : 0;
            return (
              <article className="listing" key={p.id}>
                <div style={{ background: "var(--color-fog)", height: 110, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", fontSize: 40 }}>
                  <span>{EMOJI[p.cat]}</span>
                  <div style={{ position: "absolute", top: 10, right: 10 }}>
                    <Badge tone="b-maize">{t("buyer.deposit_badge", { pct: p.deposit })}</Badge>
                  </div>
                </div>
                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--color-obsidian)" }}>{tp(p.name)}</h3>
                  <div style={{ fontSize: 12, color: "var(--color-slate)" }}>
                    {p.district} · {dshort(p.harvest)}
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "var(--color-forest-ink)" }}>
                    {ugx(p.price)} <span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-pebble)" }}>/{tu(p.unit)}</span>
                  </div>
                  <div>
                    <div style={{ height: 5, backgroundColor: "var(--color-fog)", borderRadius: "var(--radius-full)", overflow: "hidden", marginBottom: 4 }}>
                      <div style={{ width: `${pct}%`, height: "100%", backgroundColor: "var(--color-obsidian)" }} />
                    </div>
                    <div style={{ fontSize: 12, color: "var(--color-slate)" }}>{t("buyer.left", { qty: left, unit: tu(p.unit) })}</div>
                  </div>
                  <div style={{ marginTop: "auto", paddingTop: 4 }}>
                    <Button variant="primary" style={{ width: "100%" }} disabled={left === 0} onClick={() => onPreorder(p)}>
                      {left === 0 ? t("buyer.sold_out") : t("buyer.reserve")}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </>
  );
}
