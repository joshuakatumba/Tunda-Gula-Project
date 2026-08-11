import React from "react";
import { ugx, STATUS_LABEL, STATUS_TONE } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { DeliveryTrack } from "../components/DeliveryTrack";

export default function MyOrders({ orders, onConfirm, onRate }) {
  return (
    <>
      <Head eyebrow="Orders" title="Your orders and deliveries"
        lede="Track each delivery, confirm what arrives, rate the farmer. Confirming receipt is what releases the farmer's money."
        reqs={["REQ-024", "REQ-044", "REQ-045", "REQ-046", "REQ-048"]} />
      <div className="stack">
        {orders.map(o => (
          <div className="card" key={o.id}>
            <div className="between">
              <div>
                <div className="row" style={{ gap: 6 }}>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{o.id}</span>
                  <Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge>
                  {o.type === "preorder" && <Badge tone="b-grey">Deposit {o.depositPct}% paid</Badge>}
                </div>
                <h3 style={{ marginTop: 8 }}>{o.item}</h3>
                <p className="hint" style={{ marginTop: 3 }}>{o.qty} {o.unit} from {o.seller} · placed {o.placed} · {o.provider} Mobile Money</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="price">{ugx(o.qty * o.price)}</div><div className="hint">{ugx(o.price)} / {o.unit}</div>
              </div>
            </div>
            {o.type === "order" && (
              <div style={{ marginTop: 14 }}>
                <DeliveryTrack status={o.status} />
                <div className="row" style={{ marginTop: 12 }}>
                  <span className="hint">Delivery by {o.mode}</span>
                  {o.status === "out_for_delivery" && <span className="hint"><span className="dot" style={{ background: "#2E6B3E" }} /> Live GPS 0.3412°N, 32.5810°E · about 18 min away</span>}
                  {o.status !== "delivered" && <button className="btn" style={{ marginLeft: "auto" }} onClick={() => onConfirm(o)}>Confirm receipt</button>}
                  {o.status === "delivered" && !o.rated && <button className="btn-maize" style={{ marginLeft: "auto" }} onClick={() => onRate(o)}>Rate this farmer</button>}
                  {o.rated && <span className="hint" style={{ marginLeft: "auto" }}>You rated {o.stars}★</span>}
                </div>
              </div>
            )}
            {o.type === "preorder" && (
              <div className="sms" style={{ marginTop: 12 }}>
                Harvest expected 12 Aug. SMS reminder three days before. Balance of {ugx(o.qty * o.price * (1 - o.depositPct / 100))} due on delivery.
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
