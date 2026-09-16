import React, { useState } from "react";
import { Smartphone, CheckCircle } from "lucide-react";
import { EMOJI } from "../data/categories";
import { ugx } from "../utils/helpers";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";
import { Button } from "../components/ui/Button";

export default function Checkout({ cart, setCart, commission, onClose, onPay, t }) {
  const [provider, setProvider] = useState("MTN");
  const [stage, setStage] = useState("cart");
  const total = cart.reduce((s, c) => s + c.qty * c.price, 0);

  const go = () => {
    setStage("waiting");
    setTimeout(() => {
      setStage("done");
      setTimeout(() => onPay(provider), 800);
    }, 1500);
  };

  return (
    <Modal title={stage === "cart" ? "Basket" : "Payment"} onClose={onClose} wide={stage === "cart"}>
      {stage === "cart" && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {cart.map(c => (
              <div
                className="between"
                key={c.id}
                style={{
                  borderBottom: "1px solid var(--color-fog)",
                  paddingBottom: "12px",
                  alignItems: "center",
                }}
              >
                <div className="row" style={{ gap: "12px" }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      background: "var(--color-fog)",
                      borderRadius: "var(--radius-cards)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                    }}
                  >
                    {EMOJI[c.cat]}
                  </div>
                  <div>
                    <strong style={{ fontSize: "15px", color: "var(--color-obsidian)" }}>{c.name}</strong>
                    <div style={{ fontSize: "13px", color: "var(--color-slate)", marginTop: "2px" }}>
                      {c.seller} · {c.qty} {c.unit} @ {ugx(c.price)}
                    </div>
                  </div>
                </div>
                <div className="row" style={{ gap: "12px", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-monospace)", fontWeight: 700, fontSize: "15px", color: "var(--color-forest-ink)" }}>
                    {ugx(c.qty * c.price)}
                  </span>
                  <button
                    className="btn-sm"
                    onClick={() => setCart(x => x.filter(y => y.id !== c.id))}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

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
              <span>Subtotal</span>
              <span style={{ fontFamily: "var(--font-monospace)" }}>{ugx(total)}</span>
            </div>
            <div className="between" style={{ marginTop: "6px", fontSize: "14px", color: "var(--color-slate)" }}>
              <span>Platform fee ({commission}%)</span>
              <span style={{ fontFamily: "var(--font-monospace)" }}>{ugx(total * commission / 100)}</span>
            </div>
            <div className="rule" style={{ margin: "10px 0" }} />
            <div className="between" style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-obsidian)" }}>
              <span>Total</span>
              <span style={{ fontFamily: "var(--font-monospace)" }}>{ugx(total)}</span>
            </div>
          </div>

          <Button
            variant="primary"
            style={{ width: "100%" }}
            disabled={!cart.length}
            onClick={go}
          >
            {t.pay || "Pay"} · {ugx(total)}
          </Button>
        </>
      )}

      {stage === "waiting" && (
        <div style={{ textAlign: "center", padding: "32px 16px" }}>
          <div style={{ fontSize: 44, color: "var(--color-forest-ink)", display: "flex", justifyContent: "center" }}>
            <Smartphone size={44} />
          </div>
          <h3 style={{ margin: "16px 0 8px", fontSize: "20px", fontWeight: 700, color: "var(--color-obsidian)" }}>
            Approve on your phone
          </h3>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--color-slate)" }}>
            Enter your {provider} PIN to confirm payment of {ugx(total)}.
          </p>
        </div>
      )}

      {stage === "done" && (
        <div style={{ textAlign: "center", padding: "32px 16px" }}>
          <div style={{ fontSize: 44, color: "var(--color-spruce)", display: "flex", justifyContent: "center" }}>
            <CheckCircle size={44} />
          </div>
          <h3 style={{ margin: "16px 0 8px", fontSize: "20px", fontWeight: 700, color: "var(--color-obsidian)" }}>
            Payment confirmed
          </h3>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--color-slate)" }}>
            Order placed successfully.
          </p>
        </div>
      )}
    </Modal>
  );
}
