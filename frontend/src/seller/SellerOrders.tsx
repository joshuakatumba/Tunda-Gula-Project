import React, { useState, useMemo } from "react";
import { ugx, STATUS_LABEL, STATUS_TONE } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { Button } from "../components/ui/Button";
import { Thumb } from "../components/Thumb";
import { FilterChips } from "../components/FilterChips";
import { EMOJI } from "../data/categories";

export default function SellerOrders({ myOrders, commission, setOrders, advance }) {
  const [filter, setFilter] = useState("All");
  
  const filtered = useMemo(() => {
    if (filter === "All") return myOrders;
    if (filter === "Active") return myOrders.filter(o => o.status !== "delivered");
    if (filter === "Delivered") return myOrders.filter(o => o.status === "delivered");
    return myOrders;
  }, [myOrders, filter]);

  return (
    <>
      <Head title="Orders & Deliveries" />
      
      <div style={{ marginBottom: "20px" }}>
        <FilterChips 
          options={[{ id: "All", label: "All" }, { id: "Active", label: "Active" }, { id: "Delivered", label: "Delivered" }]}
          activeId={filter}
          onChange={setFilter}
        />
      </div>

      <div className="stack" style={{ gap: "16px" }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "var(--color-obsidian)" }}>No {filter.toLowerCase()} orders</h2>
          </div>
        ) : (
          filtered.map(o => (
            <div className="card" key={o.id}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <Thumb src={null} alt={o.item} fallback={EMOJI[o.cat]} size={60} />
                <div style={{ flex: 1 }}>
                  <div className="between" style={{ alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontFamily: "var(--font-monospace)", fontSize: "13px", fontWeight: 600, color: "var(--color-charcoal)" }}>
                      {o.id}
                    </span>
                    <Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge>
                  </div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700, color: "var(--color-obsidian)" }}>
                    {o.qty} {o.unit} · {o.item}
                  </h3>
                  <div style={{ fontSize: "13px", color: "var(--color-slate)" }}>
                    {o.buyer}
                  </div>
                </div>
              </div>

              <div className="between" style={{ marginTop: "16px", background: "var(--color-fog)", padding: "12px", borderRadius: "var(--radius-cards)", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--color-slate)" }}>Paid via {o.provider} MM</div>
                  <div style={{ fontSize: "12px", color: "var(--color-slate)" }}>Net payout ({commission}% fee deducted)</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-forest-ink)" }}>
                    {ugx(o.qty * o.price * (1 - commission / 100))}
                  </div>
                </div>
              </div>

              {o.type === "order" && (
                <div style={{ marginTop: "16px" }}>
                  <div className="row" style={{ alignItems: "center", gap: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-slate)", display: "block", marginBottom: "4px" }}>
                        Transport mode
                      </label>
                      <select
                        value={o.mode}
                        style={{ width: "100%", padding: "8px", borderRadius: "var(--radius-buttons)" }}
                        onChange={e => setOrders(os => os.map(x => x.id === o.id ? { ...x, mode: e.target.value } : x))}
                      >
                        {["Motorcycle", "Motor truck", "Bicycle", "Car"].map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                    {o.status !== "delivered" && (
                      <div style={{ alignSelf: "flex-end" }}>
                        <Button variant="primary" onClick={() => advance(o)}>
                          {o.status === "accepted" ? "Start delivery" : "Confirm delivered"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
