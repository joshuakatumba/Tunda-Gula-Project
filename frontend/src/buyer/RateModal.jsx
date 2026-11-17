import React, { useState } from "react";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";
import { Button } from "../components/ui/Button";
import { useI18n } from "../context/I18nContext";

export default function RateModal({ order, onClose, onSubmit }) {
  const { t, tp } = useI18n();
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

  const Stars = ({ value, set }) => (
    <div className="row" style={{ gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => set(n)}
          aria-label={`${n} ★`}
          style={{
            fontSize: 34,
            color: n <= value ? "var(--color-forest-ink)" : "var(--color-pebble)",
            cursor: "pointer",
            background: "none",
            border: "none",
            padding: 8,
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
      title={t("buyer.rate_title")}
      onClose={onClose}
      footer={
        <Button variant="primary" block disabled={!quality || !service || busy} onClick={handleSubmit}>
          {busy ? t("buyer.submitting") : t("buyer.submit_rating")}
        </Button>
      }
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-obsidian)" }}>
        {tp(order.item)} · {order.seller}
      </div>
      <Field label={t("buyer.rate_quality")}>
        <Stars value={quality} set={setQuality} />
      </Field>
      <Field label={t("buyer.rate_service")}>
        <Stars value={service} set={setService} />
      </Field>
      <Field label={t("buyer.rate_comment")}>
        <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
    </Modal>
  );
}
