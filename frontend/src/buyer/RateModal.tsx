import React, { useState } from "react";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";
import { Button } from "../components/ui/Button";

export default function RateModal({ order, onClose, onSubmit }) {
  const [quality, setQuality] = useState(0);
  const [service, setService] = useState(0);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    setBusy(true);
    try {
      await onSubmit({
        stars: Math.round((quality + service) / 2),
        comment: note.trim(),
      });
    } finally {
      setBusy(false);
    }
  };

  const Stars = ({ value, set }: { value: number; set: (n: number) => void }) => (
    <div className="row" style={{ gap: "4px" }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => set(n)}
          aria-label={`${n} stars`}
          style={{
            fontSize: "36px",
            color: n <= value ? "var(--color-forest-ink)" : "var(--color-pebble)",
            cursor: "pointer",
            background: "none",
            border: "none",
            padding: "8px",
            lineHeight: 1,
            touchAction: "manipulation",
          }}
        >
          ★
        </button>
      ))}
    </div>
  );

  return (
    <Modal 
      title="Rate seller" 
      onClose={onClose}
      footer={
        <Button
          variant="primary"
          block
          disabled={!quality || !service || busy}
          onClick={handleSubmit}
        >
          {busy ? "Submitting..." : "Submit rating"}
        </Button>
      }
    >
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
    </Modal>
  );
}
