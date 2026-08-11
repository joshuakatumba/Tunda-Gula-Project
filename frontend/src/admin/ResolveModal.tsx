import React, { useState } from "react";
import { ugx } from "../utils/helpers";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";

export default function ResolveModal({ dispute, onClose, onResolve }) {
  const [decision, setDecision] = useState("");
  const options = ["Refund buyer in full", "Refund buyer in part", "Release payment to seller", "Split the difference"];
  return (
    <Modal title={`Resolve ${dispute.id}`} onClose={onClose}>
      <div style={{ background: "#F0F2EC", padding: 12 }}>
        <div className="hint">Order {dispute.order} · {ugx(dispute.value)}</div>
        <p style={{ marginTop: 6, fontSize: 14 }}>{dispute.reason}</p>
        <p className="hint" style={{ marginTop: 6 }}>Raised by {dispute.raisedBy}</p>
      </div>
      <Field label="Decision">
        <div className="stack">
          {options.map(o => <button key={o} className="btn-sm" style={{ textAlign: "left", borderColor: decision === o ? "#16261E" : "#C9D4BE" }} onClick={() => setDecision(o)}>{o}</button>)}
        </div>
      </Field>
      <button className="btn" disabled={!decision} onClick={() => onResolve(decision)}>Issue binding decision</button>
    </Modal>
  );
}
