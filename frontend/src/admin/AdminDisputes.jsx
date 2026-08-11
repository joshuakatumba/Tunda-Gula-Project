import React from "react";
import { ugx } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";

export default function AdminDisputes({ disputes, onResolve }) {
  return (
    <>
      <Head eyebrow="Resolution" title="Disputes"
        lede="Read the transaction history, then issue a decision. It is binding, and both sides are told by SMS."
        reqs={["REQ-053", "REQ-057"]} />
      <div className="stack">
        {disputes.map(d => (
          <div className="card" key={d.id}>
            <div className="between">
              <div>
                <div className="row" style={{ gap: 6 }}>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{d.id}</span>
                  <Badge tone={d.status === "open" ? "b-red" : "b-green"}>{d.status === "open" ? "Open" : "Resolved"}</Badge>
                  <span className="hint">on order {d.order} · opened {d.opened}</span>
                </div>
                <h3 style={{ marginTop: 8 }}>{d.reason}</h3>
                <p className="hint" style={{ marginTop: 3 }}>Raised by {d.raisedBy} · value {ugx(d.value)}</p>
              </div>
              {d.status === "open" ? <button className="btn" onClick={() => onResolve(d)}>Resolve</button>
                : <Badge tone="b-green">{d.resolution}</Badge>}
            </div>
          </div>
        ))}
        <div className="card">
          <h3>Flagged ratings</h3>
          <p className="hint" style={{ marginTop: 4 }}>Ratings at or below 2★ surface here automatically.</p>
          <div className="sms" style={{ marginTop: 10 }}>1★ on ORD-5490 · "Produce was rotten on arrival" · Moses Wanyama · 15 Jul</div>
        </div>
      </div>
    </>
  );
}
