import React from "react";
import { typeLabel } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { Button } from "../components/ui/Button";

export default function AdminVerify({ pending, onApprove, onReview }) {
  return (
    <>
      <Head title="Seller Verifications" />

      {pending.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "var(--color-obsidian)" }}>
            Verification queue is clear
          </h2>
        </div>
      ) : (
        <div className="stack" style={{ gap: "16px" }}>
          {pending.map(s => (
            <div className="card" key={s.id}>
              <div className="between" style={{ alignItems: "flex-start" }}>
                <div>
                  <div className="row" style={{ gap: "8px", alignItems: "center" }}>
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--color-obsidian)" }}>
                      {s.name}
                    </h3>
                    <Badge>{typeLabel(s.type)}</Badge>
                  </div>
                  <div style={{ fontFamily: "var(--font-monospace)", fontSize: "13px", color: "var(--color-slate)", marginTop: "4px" }}>
                    NIN: {s.nin} · {s.phone} · {s.district}
                  </div>
                  <div className="row" style={{ marginTop: "12px", gap: "8px" }}>
                    <Badge tone={s.ninMatch ? "b-green" : "b-red"}>
                      {s.ninMatch ? "NIN Matched" : "NIN Mismatch"}
                    </Badge>
                    <Badge tone={s.otp ? "b-green" : "b-red"}>
                      {s.otp ? "Phone Verified" : "OTP Failed"}
                    </Badge>
                    <Badge tone={s.gps ? "b-green" : "default"}>
                      {s.gps ? "GPS Pinned" : "District Only"}
                    </Badge>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "12px", color: "var(--color-pebble)" }}>
                    Submitted {s.submitted}
                  </div>
                  <div className="row" style={{ marginTop: "12px", justifyContent: "flex-end", gap: "8px" }}>
                    <Button variant="outline" onClick={() => onReview(s)}>
                      Reject
                    </Button>
                    <Button variant="primary" onClick={() => onApprove(s)}>
                      Approve
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
