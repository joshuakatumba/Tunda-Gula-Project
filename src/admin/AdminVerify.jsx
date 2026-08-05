import React from "react";
import { typeLabel } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";

export default function AdminVerify({ pending, onApprove, onReview }) {
  return (
    <>
      <Head eyebrow="Trust" title="Seller verifications"
        lede="Check the name on the national ID against the name the phone number is registered under. Rejections need a reason — the farmer receives it by SMS."
        reqs={["REQ-003", "REQ-009", "REQ-010", "REQ-054"]} />
      {pending.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 44 }}>
          <h3>Queue is clear</h3><p className="lede" style={{ margin: "8px auto 0" }}>New applications land here within seconds of submission.</p>
        </div>
      ) : (
        <div className="stack">
          {pending.map(s => (
            <div className="card" key={s.id}>
              <div className="between">
                <div>
                  <div className="row" style={{ gap: 8 }}><h3>{s.name}</h3><Badge tone="b-grey">{typeLabel(s.type)}</Badge></div>
                  <p className="hint mono" style={{ marginTop: 5 }}>{s.nin} · {s.phone} · {s.district}</p>
                  <div className="row" style={{ marginTop: 9, gap: 6 }}>
                    <Badge tone={s.ninMatch ? "b-green" : "b-red"}>{s.ninMatch ? "NIN name matches" : "NIN name mismatch"}</Badge>
                    <Badge tone={s.otp ? "b-green" : "b-red"}>{s.otp ? "Phone verified" : "OTP failed"}</Badge>
                    <Badge tone={s.gps ? "b-green" : "b-maize"}>{s.gps ? "Farm pinned" : "No GPS — manual address"}</Badge>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="hint">Submitted {s.submitted}</div>
                  <div className="row" style={{ marginTop: 9, justifyContent: "flex-end" }}>
                    <button className="btn-sm" onClick={() => onReview(s)}>Reject</button>
                    <button className="btn" onClick={() => onApprove(s)}>Approve</button>
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
