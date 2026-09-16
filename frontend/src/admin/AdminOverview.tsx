import React from "react";
import { ugx } from "../utils/helpers";
import { Head } from "../components/Head";
import { Stat } from "../components/Stat";
import { Field } from "../components/Field";

export default function AdminOverview({ orders, commission, setCommission, depositDefault, setDepositDefault, pending }) {
  const gmv = orders.filter(o => o.paid).reduce((s, o) => s + o.qty * o.price, 0);

  return (
    <>
      <Head title="Platform Overview" />
      <div className="grid g4">
        <Stat label="Gross Merchandise Value" value={ugx(gmv)} sub="+18% growth" />
        <Stat label="Platform Revenue" value={ugx(gmv * commission / 100)} sub={`${commission}% commission`} />
        <Stat label="Total Orders" value={orders.length} sub="Active volume" />
        <Stat label="Verified Sellers" value="42" sub={`${pending.length} pending`} />
      </div>

      <div className="grid g2" style={{ marginTop: "20px" }}>
        <div className="card">
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 16px", color: "var(--color-obsidian)" }}>
            Volume by week
          </h2>
          <div className="row" style={{ alignItems: "flex-end", height: 130, gap: 12, marginTop: 16 }}>
            {[[26, 42], [27, 55], [28, 61], [29, 88]].map(([w, h]) => (
              <div key={w} style={{ flex: 1, textAlign: "center" }}>
                <div
                  style={{
                    height: h + "%",
                    background: w === 29 ? "var(--color-lime-voltage)" : "var(--color-forest-ink)",
                    borderRadius: "4px 4px 0 0",
                  }}
                />
                <div style={{ marginTop: 8, fontSize: "12px", fontFamily: "var(--font-monospace)", color: "var(--color-slate)" }}>
                  Wk {w}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 16px", color: "var(--color-obsidian)" }}>
            Platform Settings
          </h2>
          <div className="stack" style={{ gap: "16px" }}>
            <Field label={`Commission rate (${commission}%)`}>
              <input
                type="range"
                min="5"
                max="8"
                step="0.5"
                value={commission}
                onChange={e => setCommission(Number(e.target.value))}
              />
            </Field>
            <Field label={`Default pre-order deposit (${depositDefault}%)`}>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={depositDefault}
                onChange={e => setDepositDefault(Number(e.target.value))}
              />
            </Field>
          </div>
        </div>
      </div>
    </>
  );
}
