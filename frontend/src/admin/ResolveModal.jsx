import React, { useState } from "react";
import { ugx } from "../utils/helpers";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";
import { Button } from "../components/ui/Button";
import { useI18n } from "../context/I18nContext";

export default function ResolveModal({ dispute, onClose, onResolve }) {
  const { t } = useI18n();
  const [selected, setSelected] = useState(null);
  const options = [
    { id: "o1", label: t("admin.resolve_o1"), action: "refund" },
    { id: "o2", label: t("admin.resolve_o2"), action: "refund" },
    { id: "o3", label: t("admin.resolve_o3"), action: "release" },
    { id: "o4", label: t("admin.resolve_o4"), action: "split" },
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
              key={o.id}
              type="button"
              className="btn-sm"
              style={{
                textAlign: "left",
                justifyContent: "flex-start",
                padding: "10px 14px",
                borderColor: selected?.id === o.id ? "var(--color-forest-ink)" : "var(--color-pebble)",
                background: selected?.id === o.id ? "var(--color-linen-mist)" : "var(--color-paper)",
                color: "var(--color-forest-ink)",
                fontWeight: selected?.id === o.id ? 700 : 400,
              }}
              onClick={() => setSelected(o)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </Field>
      <Button variant="primary" style={{ width: "100%", marginTop: 8 }} disabled={!selected} onClick={() => onResolve({ resolution: selected.label, action: selected.action })}>
        {t("common.confirm")}
      </Button>
    </Modal>
  );
}
