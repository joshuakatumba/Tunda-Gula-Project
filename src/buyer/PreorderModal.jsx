import React, { useState } from "react";
import { ugx, dshort } from "../utils/helpers";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";

export default function PreorderModal({ plan, onClose, onPay }) {
  const [qty, setQty] = useState(50);
  const [provider, setProvider] = useState("MTN");
  const left = plan.qty - plan.reserved;
  const deposit = qty * plan.price * plan.deposit / 100;
  return (
    <Modal title="Reserve this harvest" onClose={onClose}>
      <div><h3>{plan.name}</h3><p className="hint" style={{ marginTop: 3 }}>{plan.seller} · harvest expected {dshort(plan.harvest)} 2026</p></div>
      <Field label={`Quantity to reserve (${plan.unit})`} hint={`${left} ${plan.unit} still unreserved`}>
        <input type="number" min="1" max={left} value={qty} onChange={e => setQty(Math.max(1, Math.min(left, Number(e.target.value) || 1)))} />
      </Field>
      <Field label="Pay deposit with">
        <div className="row">{["MTN", "Airtel"].map(p => (
          <button key={p} className="btn-sm" onClick={() => setProvider(p)} style={{ flex: 1, padding: 12,
            borderColor: provider === p ? "#16261E" : "#C9D4BE", background: provider === p ? "#DDE6D2" : "#FBFCF8" }}>{p}</button>))}
        </div>
      </Field>
      <div style={{ background: "#F0F2EC", padding: 12 }}>
        <div className="between"><span className="hint">Full value</span><span className="mono">{ugx(qty * plan.price)}</span></div>
        <div className="between" style={{ marginTop: 6 }}><strong>Deposit now ({plan.deposit}%)</strong><strong className="mono">{ugx(deposit)}</strong></div>
        <div className="hint" style={{ marginTop: 4 }}>Balance due when the harvest is delivered.</div>
      </div>
      <button className="btn-maize" onClick={() => onPay(plan, qty, provider)}>Pay deposit · {ugx(deposit)}</button>
    </Modal>
  );
}
