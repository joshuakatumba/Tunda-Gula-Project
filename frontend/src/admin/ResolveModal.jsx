import React, { useState } from "react";
import { ugx } from "../utils/helpers";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";
import { Button } from "../components/ui/Button";
import { useI18n } from "../context/I18nContext";

export default function ResolveModal({ dispute, onClose, onResolve }) {
  const { t } = useI18n();
  const [decision, setDecision] = useState("");
  const options = [
    "Refund buyer in full",
    "Refund buyer in part",
    "Release payment to seller",
    "Split the difference",
  ];

  return (
    <Modal title={`${t("admin.resolve_title")} ${dispute.id}`} onClose={onClose}>
      <div style={{ background: "var(--color-fog)", padding: 14, borderRadius: "var(--radius-cards)" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate)" }}>
          {dispute.order} · {ugx(dispute.value)}
        </div>
        <p style={{ margin: "6px 0 0", fontSize: 14, fontWeight: 600 }}>{dispute.reason}</p>
      </div>
      <Field label={t("admin.resolve_decision")}>
        <div className="stack" style={{ gap: 8 }}>
          {options.map((o) => (
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
      <Button variant="primary" style={{ width: "100%", marginTop: 8 }} disabled={!decision} onClick={() => onResolve(decision)}>
        {t("common.confirm")}
      </Button>
    </Modal>
  );
}
