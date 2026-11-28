import React, { useState } from "react";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";
import { Button } from "../components/ui/Button";
import { useI18n } from "../context/I18nContext";

export default function RejectModal({ seller, onClose, onReject }) {
  const { t } = useI18n();
  const [reason, setReason] = useState("");
  const presets = [
    t("admin.reject_p1"),
    t("admin.reject_p2"),
    t("admin.reject_p3"),
    t("admin.reject_p4"),
  ];

  return (
    <Modal title={`${t("admin.reject_title")}: ${seller.name}`} onClose={onClose}>
      <Field label={t("admin.reject_reason")}>
        <div className="stack" style={{ gap: 8 }}>
          {presets.map((p) => (
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
      <Field>
        <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <Button variant="primary" style={{ width: "100%", marginTop: 8 }} disabled={!reason} onClick={() => onReject(reason)}>
        {t("common.confirm")}
      </Button>
    </Modal>
  );
}
