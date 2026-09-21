import React from "react";
import { EMOJI } from "../data/categories";
import { ugx, dshort, daysTo } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { Button } from "../components/ui/Button";

export default function PreOrders({ plans, t, onPreorder }) {
  return (
    <>
      <Head title="Harvest Pre-orders" />
      <div className="grid g3">
        {plans.map(p => {
          const left = p.qty - p.reserved;
          const pct = Math.min(100, Math.round((p.reserved / p.qty) * 100));
          return (
            <article className="listing" key={p.id}>
              <div style={{ background: "var(--color-fog)", height: "130px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", fontSize: 44 }}>
                <span>{EMOJI[p.cat]}</span>
                <div style={{ position: "absolute", top: "10px", right: "10px" }}>
                  <Badge tone="b-maize">Pre-order</Badge>
                </div>
              </div>
              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--color-obsidian)" }}>{p.name}</h3>
                  <div style={{ fontSize: "13px", color: "var(--color-slate)", marginTop: "2px" }}>{p.seller} · {p.district}</div>
                </div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-forest-ink)" }}>
                  Harvest {dshort(p.harvest)} · in {daysTo(p.harvest)} days
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-forest-ink)" }}>
                    {ugx(p.price)}
                    <span style={{ fontSize: "13px", fontWeight: 400, color: "var(--color-pebble)" }}> / {p.unit}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-slate)", marginTop: "2px" }}>
                    Deposit {p.deposit}% required
                  </div>
                </div>
                <div>
                  <div style={{ height: "6px", backgroundColor: "var(--color-fog)", borderRadius: "var(--radius-full)", overflow: "hidden", marginBottom: "6px" }}>
                    <div style={{ width: `${pct}%`, height: "100%", backgroundColor: "var(--color-lime-voltage)" }} />
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-slate)" }}>
                    {p.reserved} of {p.qty} {p.unit} reserved · {left} left
                  </div>
                </div>
                <div style={{ marginTop: "auto", paddingTop: "8px" }}>
                  <Button
                    variant="primary"
                    style={{ width: "100%" }}
                    disabled={left === 0}
                    onClick={() => onPreorder(p)}
                  >
                    {left === 0 ? "Fully reserved" : (t.preorder || "Reserve harvest")}
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
