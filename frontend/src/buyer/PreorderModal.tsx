import React, { useState } from "react";
import { Smartphone } from "lucide-react";
import { ugx, dshort } from "../utils/helpers";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";
import { Button } from "../components/ui/Button";

export default function PreorderModal({ plan, onClose, onPay }) {
  const [qty, setQty] = useState(50);
  const [provider, setProvider] = useState("MTN");
  const [busy, setBusy] = useState(false);
  const left = plan.qty - plan.reserved;
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
      title="Reserve harvest" 
      onClose={onClose}
      footer={
        <Button
          variant="primary"
          block
          disabled={busy}
          onClick={handlePay}
        >
          {busy ? "Processing..." : `Pay deposit · ${ugx(deposit)}`}
        </Button>
      }
    >
      <div>
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--color-obsidian)" }}>{plan.name}</h3>
        <div style={{ fontSize: "13px", color: "var(--color-slate)", marginTop: "4px" }}>
          {plan.seller} · Harvest {dshort(plan.harvest)}
        </div>
      </div>

      <Field label={`Quantity (${plan.unit})`}>
        <input
          type="number"
          min="1"
          max={left}
          value={qty}
          onChange={e => setQty(Math.max(1, Math.min(left, Number(e.target.value) || 1)))}
        />
      </Field>

      <Field label="Payment method">
        <div className="grid g2" style={{ gap: "12px" }}>
          {["MTN", "Airtel"].map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setProvider(p)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "20px 16px",
                borderRadius: "var(--radius-cards)",
                border: "2px solid",
                borderColor: provider === p ? "var(--color-forest-ink)" : "var(--color-fog)",
                background: provider === p ? "var(--color-linen-mist)" : "var(--color-paper)",
                color: "var(--color-forest-ink)",
                fontWeight: provider === p ? 700 : 500,
                transition: "all 0.2s ease"
              }}
            >
              <Smartphone size={24} color={provider === p ? "var(--color-forest-ink)" : "var(--color-pebble)"} />
              <span>{p} Mobile Money</span>
            </button>
          ))}
        </div>
      </Field>

      <div style={{ background: "var(--color-fog)", padding: "16px", borderRadius: "var(--radius-cards)" }}>
        <div className="between" style={{ fontSize: "14px", color: "var(--color-slate)" }}>
          <span>Total value</span>
          <span style={{ fontFamily: "var(--font-monospace)", fontWeight: 600 }}>{ugx(qty * plan.price)}</span>
        </div>
        <div className="between" style={{ marginTop: "8px", fontSize: "16px", fontWeight: 700, color: "var(--color-forest-ink)" }}>
          <span>Deposit ({plan.deposit}%)</span>
          <span style={{ fontFamily: "var(--font-monospace)" }}>{ugx(deposit)}</span>
        </div>
      </div>
    </Modal>
  );
}
