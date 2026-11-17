import React, { useState } from "react";
import { Smartphone } from "lucide-react";
import { ugx, dshort } from "../utils/helpers";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";
import { Button } from "../components/ui/Button";
import { useI18n } from "../context/I18nContext";

export default function PreorderModal({ plan, onClose, onPay }) {
  const { t, tp, tu } = useI18n();
  const left = Math.max(1, plan.qty - plan.reserved);
  const [qty, setQty] = useState(Math.min(50, left));
  const [provider, setProvider] = useState("MTN");
  const [busy, setBusy] = useState(false);
  const deposit = (qty * plan.price * plan.deposit) / 100;

  const handlePay = async () => {
    setBusy(true);
    try {
      await onPay(plan, qty, provider);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={t("buyer.reserve_harvest")}
      onClose={onClose}
      footer={
        <Button variant="primary" block disabled={busy} onClick={handlePay}>
          {busy ? t("buyer.processing") : t("buyer.pay_deposit", { amount: ugx(deposit) })}
        </Button>
      }
    >
      <div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--color-obsidian)" }}>{tp(plan.name)}</h3>
        <div style={{ fontSize: 13, color: "var(--color-slate)", marginTop: 4 }}>
          {plan.seller} · {dshort(plan.harvest)}
        </div>
      </div>
      <Field label={t("buyer.qty_label", { unit: tu(plan.unit) })}>
        <input
          type="number"
          min="1"
          max={left}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Math.min(left, Number(e.target.value) || 1)))}
        />
      </Field>
      <Field label={t("buyer.payment_method")}>
        <div className="grid g2" style={{ gap: 12 }}>
          {["MTN", "Airtel"].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProvider(p)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "16px 12px",
                borderRadius: "var(--radius-cards)",
                border: "2px solid",
                borderColor: provider === p ? "var(--color-forest-ink)" : "var(--color-fog)",
                background: provider === p ? "var(--color-linen-mist)" : "var(--color-paper)",
                color: "var(--color-forest-ink)",
                fontWeight: provider === p ? 700 : 500,
              }}
            >
              <Smartphone size={22} color={provider === p ? "var(--color-forest-ink)" : "var(--color-pebble)"} />
              <span>{p} Mobile Money</span>
            </button>
          ))}
        </div>
      </Field>
      <div style={{ background: "var(--color-fog)", padding: 14, borderRadius: "var(--radius-cards)" }}>
        <div className="between" style={{ fontSize: 14, color: "var(--color-slate)" }}>
          <span>{t("buyer.total_value")}</span>
          <span style={{ fontFamily: "var(--font-monospace)", fontWeight: 600 }}>{ugx(qty * plan.price)}</span>
        </div>
        <div className="between" style={{ marginTop: 8, fontSize: 16, fontWeight: 700, color: "var(--color-forest-ink)" }}>
          <span>{t("buyer.deposit_pct", { pct: plan.deposit })}</span>
          <span style={{ fontFamily: "var(--font-monospace)" }}>{ugx(deposit)}</span>
        </div>
      </div>
    </Modal>
  );
}
