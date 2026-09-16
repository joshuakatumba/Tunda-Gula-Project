import React from "react";
import { ugx, STATUS_LABEL, STATUS_TONE } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { DeliveryTrack } from "../components/DeliveryTrack";
import { Button } from "../components/ui/Button";

export default function MyOrders({ orders, onConfirm, onRate }) {
  return (
    <>
      <Head title="My Orders" />
      <div className="stack" style={{ gap: "16px" }}>
        {orders.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0", color: "var(--color-obsidian)" }}>No orders yet</h2>
          </div>
        ) : (
          orders.map(o => (
            <div className="card" key={o.id}>
              <div className="between" style={{ alignItems: "flex-start" }}>
                <div>
                  <div className="row" style={{ gap: "8px" }}>
                    <span style={{ fontFamily: "var(--font-monospace)", fontSize: "13px", fontWeight: 600, color: "var(--color-charcoal)" }}>
                      {o.id}
                    </span>
                    <Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge>
                    {o.type === "preorder" && <Badge>Deposit {o.depositPct}% paid</Badge>}
                  </div>
                  <h3 style={{ margin: "8px 0 0", fontSize: "18px", fontWeight: 700, color: "var(--color-obsidian)" }}>
                    {o.item}
                  </h3>
                  <div style={{ fontSize: "13px", color: "var(--color-slate)", marginTop: "4px" }}>
                    {o.qty} {o.unit} · {o.seller} · {o.placed} · {o.provider} Mobile Money
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-forest-ink)" }}>
                    {ugx(o.qty * o.price)}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-pebble)", marginTop: "2px" }}>
                    {ugx(o.price)} / {o.unit}
                  </div>
                </div>
              </div>

              {o.type === "order" && (
                <div style={{ marginTop: "16px", borderTop: "1px solid var(--color-fog)", paddingTop: "14px" }}>
                  <DeliveryTrack status={o.status} />
                  <div className="row" style={{ marginTop: "12px", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", color: "var(--color-slate)" }}>
                      Delivery: {o.mode}
                    </span>
                    {o.status === "out_for_delivery" && (
                      <span style={{ fontSize: "13px", color: "var(--color-spruce)", fontWeight: 500 }}>
                        · Live in transit
                      </span>
                    )}
                    {o.status !== "delivered" && (
                      <div style={{ marginLeft: "auto" }}>
                        <Button variant="outline" onClick={() => onConfirm(o)}>
                          Confirm receipt
                        </Button>
                      </div>
                    )}
                    {o.status === "delivered" && !o.rated && (
                      <div style={{ marginLeft: "auto" }}>
                        <Button variant="primary" onClick={() => onRate(o)}>
                          Rate seller
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
                  Harvest expected 12 Aug. Balance of {ugx(o.qty * o.price * (1 - o.depositPct / 100))} due on delivery.
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
