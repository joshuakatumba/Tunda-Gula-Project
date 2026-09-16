import React, { useState } from "react";
import { ugx } from "../utils/helpers";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";
import { Button } from "../components/ui/Button";

export default function ResolveModal({ dispute, onClose, onResolve }) {
  const [decision, setDecision] = useState("");
  const options = [
    "Refund buyer in full",
    "Refund buyer in part",
    "Release payment to seller",
    "Split the difference"
  ];

  return (
    <Modal title={`Resolve ${dispute.id}`} onClose={onClose}>
      <div style={{ background: "var(--color-fog)", padding: "16px", borderRadius: "var(--radius-cards)" }}>
        <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: "var(--color-slate)" }}>
          Order {dispute.order} · {ugx(dispute.value)}
        </div>
        <p style={{ margin: "8px 0 4px", fontSize: "15px", fontWeight: 600, color: "var(--color-obsidian)" }}>
          {dispute.reason}
        </p>
        <div style={{ fontSize: "13px", color: "var(--color-slate)" }}>
          Raised by {dispute.raisedBy}
        </div>
      </div>

      <Field label="Resolution decision">
        <div className="stack" style={{ gap: "8px" }}>
          {options.map(o => (
            <button
              key={o}
              type="button"
              className="btn-sm"
              style={{
                textAlign: "left",
                justifyContent: "flex-start",
                padding: "10px 14px",
                borderColor: decision === o ? "var(--color-forest-ink)" : "var(--color-pebble)",
                background: decision === o ? "var(--color-linen-mist)" : "var(--color-paper)",
                color: "var(--color-forest-ink)",
                fontWeight: decision === o ? 700 : 400,
              }}
              onClick={() => setDecision(o)}
            >
              {o}
            </button>
          ))}
        </div>
      </Field>

      <Button
        variant="primary"
        style={{ width: "100%", marginTop: "8px" }}
        disabled={!decision}
        onClick={() => onResolve(decision)}
      >
        Issue binding decision
      </Button>
    </Modal>
  );
}
