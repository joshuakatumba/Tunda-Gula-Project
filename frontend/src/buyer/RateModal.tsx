import React, { useState } from "react";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";
import { Button } from "../components/ui/Button";

export default function RateModal({ order, onClose, onSubmit }) {
  const [quality, setQuality] = useState(0);
  const [service, setService] = useState(0);
  const [note, setNote] = useState("");

  const Stars = ({ value, set }: { value: number; set: (n: number) => void }) => (
    <div className="row" style={{ gap: "8px" }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => set(n)}
          aria-label={`${n} stars`}
          style={{
            fontSize: "26px",
            color: n <= value ? "var(--color-forest-ink)" : "var(--color-pebble)",
            cursor: "pointer",
            background: "none",
            border: "none",
            padding: "2px",
            lineHeight: 1,
          }}
        >
          ★
        </button>
      ))}
    </div>
  );

  return (
    <Modal title="Rate seller" onClose={onClose}>
      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-obsidian)" }}>
        {order.item} · {order.seller}
      </div>
      <Field label="Produce quality">
        <Stars value={quality} set={setQuality} />
      </Field>
      <Field label="Seller service">
        <Stars value={service} set={setService} />
      </Field>
      <Field label="Feedback (optional)">
        <textarea
          rows={3}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Additional notes..."
        />
      </Field>
      <Button
        variant="primary"
        style={{ width: "100%" }}
        disabled={!quality || !service}
        onClick={() => onSubmit(Math.round((quality + service) / 2))}
      >
        Submit rating
      </Button>
    </Modal>
  );
}
