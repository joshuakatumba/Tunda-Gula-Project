import React from "react";
import { ugx } from "../utils/helpers";
import { Head } from "../components/Head";
import { Stat } from "../components/Stat";
import { Req } from "../components/Req";
import { Field } from "../components/Field";

export default function AdminOverview({ orders, commission, setCommission, depositDefault, setDepositDefault, pending }) {
  const gmv = orders.filter(o => o.paid).reduce((s, o) => s + o.qty * o.price, 0);
  return (
    <>
      <Head eyebrow="Administration" title="Platform overview"
        lede="Gross merchandise value, commission earned and order volume across the marketplace."
        reqs={["REQ-042", "REQ-058"]} />
      <div className="grid g4">
        <Stat label="GMV · July" value={ugx(gmv)} sub="+18% on June" />
        <Stat label="Commission earned" value={ugx(gmv * commission / 100)} sub={`at ${commission}%`} />
        <Stat label="Orders" value={orders.length} sub="1 pre-order deposit held" />
        <Stat label="Verified sellers" value="42" sub={`${pending.length} awaiting review`} />
      </div>
      <div className="grid g2" style={{ marginTop: 12 }}>
        <div className="card">
          <h2>GMV by week</h2>
          <div className="row" style={{ alignItems: "flex-end", height: 130, gap: 10, marginTop: 16 }}>
            {[[26, 42], [27, 55], [28, 61], [29, 88]].map(([w, h]) => (
              <div key={w} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: h + "%", background: w === 29 ? "#E8A317" : "#2E6B3E" }} />
                <div className="hint mono" style={{ marginTop: 6 }}>wk {w}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h2>Settings that change platform behaviour</h2>
          <p className="hint" style={{ marginTop: 4 }}>Editable here, with no code deployment.</p>
          <div className="stack" style={{ marginTop: 14 }}>
            <Field label={`Commission rate — ${commission}%`} hint="Allowed range 5–8%.">
              <input type="range" min="5" max="8" step="0.5" value={commission} onChange={e => setCommission(Number(e.target.value))} />
            </Field>
            <Field label={`Default pre-order deposit — ${depositDefault}%`}>
              <input type="range" min="10" max="50" step="5" value={depositDefault} onChange={e => setDepositDefault(Number(e.target.value))} />
            </Field>
            <div className="row"><Req id="REQ-039" /><Req id="REQ-028" /><span className="hint">Maintainability §5.4</span></div>
          </div>
        </div>
      </div>
    </>
  );
}
