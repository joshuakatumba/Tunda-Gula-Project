import React, { useState } from "react";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";

export default function RateModal({ order, onClose, onSubmit }) {
  const [quality, setQuality] = useState(0);
  const [service, setService] = useState(0);
  const [note, setNote] = useState("");
  const Stars = ({ value, set }) => (
    <div className="row" style={{ gap: 4 }}>{[1, 2, 3, 4, 5].map(n =>
      <button key={n} onClick={() => set(n)} aria-label={n + " stars"} style={{ fontSize: 25, color: n <= value ? "#E8A317" : "#C9D4BE" }}>★</button>)}
    </div>
  );
  return (
    <Modal title="How was it?" onClose={onClose}>
      <p className="hint">{order.item} from {order.seller}</p>
      <Field label="Produce quality"><Stars value={quality} set={setQuality} /></Field>
      <Field label="Seller service"><Stars value={service} set={setService} /></Field>
      <Field label="Comment (optional)"><textarea rows="3" value={note} onChange={e => setNote(e.target.value)} placeholder="What should other buyers know?" /></Field>
      <button className="btn-maize" disabled={!quality || !service} onClick={() => onSubmit(Math.round((quality + service) / 2))}>Post rating</button>
    </Modal>
  );
}
