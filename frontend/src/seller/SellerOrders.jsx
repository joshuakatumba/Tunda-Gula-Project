import React from "react";
import { ugx, STATUS_LABEL, STATUS_TONE } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";

export default function SellerOrders({ myOrders, commission, setOrders, advance }) {
  return (
    <>
      <Head eyebrow="Orders" title="Orders and deliveries"
        lede="Accept, choose how you will carry it, and update as you move. Every update sends the buyer an SMS."
        reqs={["REQ-043", "REQ-045", "REQ-046"]} />
      <div className="stack">
        {myOrders.map(o => (
          <div className="card" key={o.id}>
            <div className="between">
              <div>
                <div className="row" style={{ gap: 6 }}><span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{o.id}</span>
                  <Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge></div>
                <h3 style={{ marginTop: 8 }}>{o.qty} {o.unit} · {o.item}</h3>
                <p className="hint" style={{ marginTop: 3 }}>{o.buyer} · 0772••882 · paid by {o.provider}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="price">{ugx(o.qty * o.price * (1 - commission / 100))}</div>
                <div className="hint">your share after {commission}% commission</div>
              </div>
            </div>
            {o.type === "order" && (
              <div className="row" style={{ marginTop: 14 }}>
                <label className="hint">Carried by</label>
                <select value={o.mode} style={{ width: 160 }} onChange={e => setOrders(os => os.map(x => x.id === o.id ? { ...x, mode: e.target.value } : x))}>
                  {["Motor truck", "Motorcycle", "Bicycle", "Car"].map(m => <option key={m}>{m}</option>)}
                </select>
                {o.status !== "delivered" && <button className="btn" style={{ marginLeft: "auto" }} onClick={() => advance(o)}>
                  {o.status === "accepted" ? "Start delivery" : "Mark delivered"}</button>}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
