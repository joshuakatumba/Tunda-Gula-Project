import React, { useState } from "react";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";
import { Button } from "../components/ui/Button";

export default function RejectModal({ seller, onClose, onReject }) {
  const [reason, setReason] = useState("");
  const presets = [
    "NIN name does not match phone registration",
    "National ID unreadable",
    "Farm location outside coverage zone",
    "Duplicate account registration"
  ];

  return (
    <Modal title={`Reject application: ${seller.name}`} onClose={onClose}>
      <Field label="Select rejection reason">
        <div className="stack" style={{ gap: "8px" }}>
          {presets.map(p => (
            <button
              key={p}
              type="button"
              className="btn-sm"
              style={{
                textAlign: "left",
                justifyContent: "flex-start",
                padding: "10px 14px",
                borderColor: reason === p ? "var(--color-forest-ink)" : "var(--color-pebble)",
                background: reason === p ? "var(--color-linen-mist)" : "var(--color-paper)",
                color: "var(--color-forest-ink)",
                fontWeight: reason === p ? 700 : 400,
              }}
              onClick={() => setReason(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Or custom reason">
        <textarea
          rows={2}
          value={reason}
          placeholder="Specify reason..."
          onChange={e => setReason(e.target.value)}
        />
      </Field>

      <Button
        variant="primary"
        style={{ width: "100%", marginTop: "8px" }}
        disabled={!reason}
        onClick={() => onReject(reason)}
      >
        Confirm rejection
      </Button>
    </Modal>
  );
}
