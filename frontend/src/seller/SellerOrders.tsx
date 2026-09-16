import React from "react";
import { ugx, STATUS_LABEL, STATUS_TONE } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { Button } from "../components/ui/Button";

export default function SellerOrders({ myOrders, commission, setOrders, advance }) {
  return (
    <>
      <Head title="Orders & Deliveries" />
      <div className="stack" style={{ gap: "16px" }}>
        {myOrders.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "var(--color-obsidian)" }}>No orders yet</h2>
          </div>
        ) : (
          myOrders.map(o => (
            <div className="card" key={o.id}>
              <div className="between" style={{ alignItems: "flex-start" }}>
                <div>
                  <div className="row" style={{ gap: "8px" }}>
                    <span style={{ fontFamily: "var(--font-monospace)", fontSize: "12px", fontWeight: 600, color: "var(--color-charcoal)" }}>
                      {o.id}
                    </span>
                    <Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge>
                  </div>
                  <h3 style={{ margin: "8px 0 0", fontSize: "18px", fontWeight: 700, color: "var(--color-obsidian)" }}>
                    {o.qty} {o.unit} · {o.item}
                  </h3>
                  <div style={{ fontSize: "13px", color: "var(--color-slate)", marginTop: "4px" }}>
                    {o.buyer} · Paid via {o.provider} Mobile Money
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-forest-ink)" }}>
                    {ugx(o.qty * o.price * (1 - commission / 100))}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-pebble)", marginTop: "2px" }}>
                    Net payout ({commission}% fee deducted)
                  </div>
                </div>
              </div>

              {o.type === "order" && (
                <div className="row" style={{ marginTop: "16px", borderTop: "1px solid var(--color-fog)", paddingTop: "14px", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-slate)" }}>Transport mode:</span>
                  <select
                    value={o.mode}
                    style={{ width: "160px" }}
                    onChange={e => setOrders(os => os.map(x => x.id === o.id ? { ...x, mode: e.target.value } : x))}
                  >
                    {["Motorcycle", "Motor truck", "Bicycle", "Car"].map(m => <option key={m}>{m}</option>)}
                  </select>
                  {o.status !== "delivered" && (
                    <div style={{ marginLeft: "auto" }}>
                      <Button variant="primary" onClick={() => advance(o)}>
                        {o.status === "accepted" ? "Start delivery" : "Confirm delivered"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
