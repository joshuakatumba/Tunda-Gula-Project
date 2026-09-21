import React from "react";
import { ugx } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { Button } from "../components/ui/Button";

export default function AdminDisputes({ disputes, onResolve }) {
  return (
    <>
      <Head title="Disputes & Resolutions" />
      <div className="stack" style={{ gap: "16px" }}>
        {disputes.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "var(--color-obsidian)" }}>No active disputes</h2>
          </div>
        ) : (
          disputes.map(d => (
            <div className="card" key={d.id}>
              <div className="between" style={{ alignItems: "center" }}>
                <div>
                  <div className="row" style={{ gap: "8px", alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--font-monospace)", fontSize: "13px", fontWeight: 600 }}>{d.id}</span>
                    <Badge tone={d.status === "open" ? "b-red" : "b-green"}>
                      {d.status === "open" ? "Open" : "Resolved"}
                    </Badge>
                    <span style={{ fontSize: "12px", color: "var(--color-pebble)" }}>Order {d.order} · Opened {d.opened}</span>
                  </div>
                  <h3 style={{ margin: "8px 0 0", fontSize: "17px", fontWeight: 700, color: "var(--color-obsidian)" }}>
                    {d.reason}
                  </h3>
                  <div style={{ fontSize: "13px", color: "var(--color-slate)", marginTop: "4px" }}>
                    Raised by {d.raisedBy} · Dispute value: {ugx(d.value)}
                  </div>
                </div>
                <div>
                  {d.status === "open" ? (
                    <Button variant="primary" onClick={() => onResolve(d)}>
                      Resolve
                    </Button>
                  ) : (
                    <Badge tone="b-green">{d.resolution}</Badge>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        <div className="card">
          <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 700, color: "var(--color-obsidian)" }}>
            Flagged Low Ratings
          </h3>
          <div className="sms">
            1★ on ORD-5490 · "Produce arrived damaged" · Review flagged for moderation
          </div>
        </div>
      </div>
    </>
  );
}
