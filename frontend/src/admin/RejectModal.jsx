import React, { useState } from "react";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";

export default function RejectModal({ seller, onClose, onReject }) {
  const [reason, setReason] = useState("");
  const presets = ["NIN name does not match the phone registration", "National ID could not be read",
    "Farm location outside the launch area", "Duplicate account"];
  return (
    <Modal title={`Reject ${seller.name}`} onClose={onClose}>
      <p className="hint">A reason is required. It is sent to the farmer by SMS so they know how to fix it.</p>
      <div className="stack">
        {presets.map(p => <button key={p} className="btn-sm" style={{ textAlign: "left", borderColor: reason === p ? "#16261E" : "#C9D4BE" }} onClick={() => setReason(p)}>{p}</button>)}
      </div>
      <Field label="Or write your own"><textarea rows="2" value={reason} onChange={e => setReason(e.target.value)} /></Field>
      <button className="btn" disabled={!reason} onClick={() => onReject(reason)}>Reject and send SMS</button>
    </Modal>
  );
}
