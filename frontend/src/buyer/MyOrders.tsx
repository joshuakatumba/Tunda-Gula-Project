import React, { useState, useMemo } from "react";
import { ugx, STATUS_LABEL, STATUS_TONE } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { DeliveryTrack } from "../components/DeliveryTrack";
import { Button } from "../components/ui/Button";
import { FilterChips } from "../components/FilterChips";
import { Thumb } from "../components/Thumb";
import { EMOJI } from "../data/categories";

export default function MyOrders({ orders, onConfirm, onRate }) {
  const [filter, setFilter] = useState("All");
  const filtered = useMemo(() => {
    if (filter === "All") return orders;
    if (filter === "Active") return orders.filter(o => o.status !== "delivered");
    if (filter === "Delivered") return orders.filter(o => o.status === "delivered");
    return orders;
  }, [orders, filter]);

  return (
    <>
      <Head title="My Orders" />
      <div style={{ marginBottom: "16px" }}>
        <FilterChips 
          options={[{ id: "All", label: "All" }, { id: "Active", label: "Active" }, { id: "Delivered", label: "Delivered" }]}
          activeId={filter}
          onChange={setFilter}
        />
      </div>
      
      <div className="stack" style={{ gap: "16px" }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "var(--color-obsidian)" }}>
              {filter === "All" ? "No orders yet" : `No ${filter.toLowerCase()} orders`}
            </h2>
          </div>
        ) : (
          filtered.map(o => (
            <div className="card" key={o.id}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <Thumb src={o.thumbnail} alt={o.item} fallback={EMOJI[o.cat] || "🥬"} size={60} />
                <div style={{ flex: 1 }}>
                  <div className="between" style={{ alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontFamily: "var(--font-monospace)", fontSize: "13px", fontWeight: 600, color: "var(--color-charcoal)" }}>
                      {o.id}
                    </span>
                    <Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge>
                  </div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700, color: "var(--color-obsidian)" }}>
                    {o.item}
                  </h3>
                  <div style={{ fontSize: "13px", color: "var(--color-slate)" }}>
                    {o.qty} {o.unit} · {o.seller}
                  </div>
                </div>
              </div>
              
              <div className="between" style={{ marginTop: "16px", background: "var(--color-fog)", padding: "12px", borderRadius: "var(--radius-cards)", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--color-slate)" }}>{o.placed}</div>
                  <div style={{ fontSize: "12px", color: "var(--color-slate)" }}>{o.provider} MM</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-forest-ink)" }}>
                    {ugx(o.qty * o.price)}
                  </div>
                </div>
              </div>

              {o.type === "preorder" && <Badge style={{ marginTop: 12 }}>Deposit {o.depositPct}% paid</Badge>}

              {o.type === "order" && (
                <div style={{ marginTop: "16px" }}>
                  <DeliveryTrack status={o.status} />
                  <div className="row" style={{ marginTop: "12px", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", color: "var(--color-slate)" }}>
                      Mode: {o.mode}
                    </span>
                    {o.status === "out_for_delivery" && (
                      <span style={{ fontSize: "13px", color: "var(--color-spruce)", fontWeight: 500 }}>
                        · Live transit
                      </span>
                    )}
                    {o.status !== "delivered" && (
                      <div style={{ marginLeft: "auto" }}>
                        <Button variant="outline" onClick={() => onConfirm(o)}>
                          Confirm
                        </Button>
                      </div>
                    )}
                    {o.status === "delivered" && !o.rated && (
                      <div style={{ marginLeft: "auto" }}>
                        <Button variant="primary" onClick={() => onRate(o)}>
                          Rate
                        </Button>
                      </div>
                    )}
                    {o.rated && (
                      <span style={{ marginLeft: "auto", fontSize: "13px", fontWeight: 600, color: "var(--color-forest-ink)" }}>
                        Rated {o.stars} ★
                      </span>
                    )}
                  </div>
                </div>
              )}

              {o.type === "preorder" && (
                <div className="sms" style={{ marginTop: "14px" }}>
                  Harvest approx 12 Aug. Balance {ugx(o.qty * o.price * (1 - o.depositPct / 100))} due.
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
