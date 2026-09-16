import React, { useState } from "react";
import { ugx, dshort } from "../utils/helpers";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";
import { Button } from "../components/ui/Button";

export default function PreorderModal({ plan, onClose, onPay }) {
  const [qty, setQty] = useState(50);
  const [provider, setProvider] = useState("MTN");
  const left = plan.qty - plan.reserved;
  const deposit = (qty * plan.price * plan.deposit) / 100;

  return (
    <Modal title="Reserve harvest" onClose={onClose}>
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
        <div className="row" style={{ gap: "8px" }}>
          {["MTN", "Airtel"].map(p => (
            <button
              key={p}
              type="button"
              className="btn-sm"
              onClick={() => setProvider(p)}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderColor: provider === p ? "var(--color-forest-ink)" : "var(--color-pebble)",
                background: provider === p ? "var(--color-linen-mist)" : "var(--color-paper)",
                color: "var(--color-forest-ink)",
                fontWeight: provider === p ? 700 : 500,
              }}
            >
              {p} Mobile Money
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

      <Button
        variant="primary"
        style={{ width: "100%" }}
        onClick={() => onPay(plan, qty, provider)}
      >
        Pay deposit · {ugx(deposit)}
      </Button>
    </Modal>
  );
}
