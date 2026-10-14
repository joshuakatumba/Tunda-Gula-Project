import React, { useState, useMemo } from "react";
import { Smartphone, CheckCircle, Truck, Trash2, Plus, Minus, Loader2, AlertCircle } from "lucide-react";
import { EMOJI } from "../data/categories";
import { ugx } from "../utils/helpers";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";
import { Button } from "../components/ui/Button";
import { Thumb } from "../components/Thumb";

export default function Checkout({ cart, setCart, commission, onClose, onPay, t, session }: any) {
  const [provider, setProvider] = useState<"MTN" | "Airtel">("MTN");
  const [phone, setPhone] = useState(session?.phone || "");
  const [deliveryMode, setDeliveryMode] = useState("Motorcycle");
  const [stage, setStage] = useState<"cart" | "waiting" | "done">("cart");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const total = useMemo(() => cart.reduce((s: number, c: any) => s + c.qty * c.price, 0), [cart]);

  const updateQty = (id: string, delta: number) => {
    setCart((prev: any[]) =>
      prev.map(item => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : item;
        }
        return item;
      })
    );
  };

  const removeItem = (id: string) => {
    setCart((prev: any[]) => prev.filter(item => item.id !== id));
  };

  const go = async () => {
    if (!cart.length) return;
    setErrorMsg(null);
    setSubmitting(true);
    setStage("waiting");
    try {
      await onPay({
        provider,
        phone: phone.trim() || session?.phone || "0772000000",
        deliveryMode,
      });
      setStage("done");
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || "Payment failed. Please try again.");
      setStage("cart");
    } finally {
      setSubmitting(false);
    }
  };

  const footer = stage === "cart" ? (
    <div style={{ display: "flex", gap: "10px", width: "100%" }}>
      <Button variant="outline" onClick={onClose} disabled={submitting}>
        Cancel
      </Button>
      <Button
        variant="primary"
        style={{ flex: 1 }}
        disabled={!cart.length || submitting}
        onClick={go}
      >
        {submitting ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Loader2 size={16} className="spin" /> Processing...
          </span>
        ) : (
          `Pay · ${ugx(total)}`
        )}
      </Button>
    </div>
  ) : undefined;

  return (
    <Modal
      title={stage === "cart" ? "Basket" : stage === "waiting" ? "Payment" : "Confirmed"}
      onClose={onClose}
      wide={stage === "cart"}
      footer={footer}
    >
      {stage === "cart" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {errorMsg && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 12px",
              background: "#fee2e2",
              borderRadius: "var(--radius-cards)",
              color: "#b91c1c",
              fontSize: "13px",
            }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Cart items list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {cart.map((c: any) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  border: "1px solid var(--color-fog)",
                  borderRadius: "var(--radius-cards)",
                  padding: "12px",
                  background: "var(--color-paper)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <Thumb src={c.thumbnail} alt={c.name} fallback={EMOJI[c.cat] || "🥬"} size={44} />
                    <div>
                      <strong style={{ fontSize: "15px", color: "var(--color-obsidian)", display: "block" }}>{c.name}</strong>
                      <div style={{ fontSize: "12px", color: "var(--color-slate)" }}>
                        {c.seller} · {ugx(c.price)} / {c.unit}
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn-sm"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--color-alarm-red)",
                      padding: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                    onClick={() => removeItem(c.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "var(--color-fog)",
                  padding: "6px 10px",
                  borderRadius: "var(--radius-cards)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button
                      type="button"
                      className="btn-sm"
                      style={{
                        width: "28px",
                        height: "28px",
                        padding: 0,
                        fontWeight: "bold",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onClick={() => updateQty(c.id, -1)}
                      disabled={c.qty <= 1}
                    >
                      <Minus size={13} />
                    </button>
                    <span style={{ fontWeight: 700, minWidth: "40px", textAlign: "center", fontSize: "13px" }}>
                      {c.qty} {c.unit}
                    </span>
                    <button
                      type="button"
                      className="btn-sm"
                      style={{
                        width: "28px",
                        height: "28px",
                        padding: 0,
                        fontWeight: "bold",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onClick={() => updateQty(c.id, 1)}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--color-forest-ink)" }}>
                    {ugx(c.qty * c.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery Mode */}
          <Field label="Delivery">
            <div className="grid g3" style={{ gap: "8px" }}>
              {[
                { id: "Motorcycle", label: "Boda Boda" },
                { id: "Pickup Van", label: "Pickup Van" },
                { id: "Farm Pickup", label: "Self Pickup" },
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setDeliveryMode(m.id)}
                  style={{
                    padding: "10px",
                    borderRadius: "var(--radius-cards)",
                    border: "2px solid",
                    borderColor: deliveryMode === m.id ? "var(--color-forest-ink)" : "var(--color-fog)",
                    background: deliveryMode === m.id ? "var(--color-linen-mist)" : "var(--color-paper)",
                    cursor: "pointer",
                    textAlign: "center",
                    fontWeight: deliveryMode === m.id ? 700 : 500,
                    fontSize: "13px",
                    color: "var(--color-obsidian)",
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </Field>

          {/* Payment Method */}
          <Field label="Payment">
            <div className="grid g2" style={{ gap: "10px" }}>
              {(["MTN", "Airtel"] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "12px",
                    borderRadius: "var(--radius-cards)",
                    border: "2px solid",
                    borderColor: provider === p ? "var(--color-forest-ink)" : "var(--color-fog)",
                    background: provider === p ? "var(--color-linen-mist)" : "var(--color-paper)",
                    color: "var(--color-forest-ink)",
                    fontWeight: provider === p ? 700 : 500,
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  <Smartphone size={18} />
                  <span>{p} Mobile Money</span>
                </button>
              ))}
            </div>
          </Field>

          {/* Phone Number */}
          <Field label="Phone number">
            <input
              type="tel"
              value={phone}
              placeholder="0772 000 000"
              onChange={e => setPhone(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "var(--radius-cards)",
                border: "1px solid var(--color-fog)",
                fontSize: "14px",
                fontWeight: 600,
              }}
            />
          </Field>

          {/* Pricing Breakdown */}
          <div style={{ background: "var(--color-fog)", padding: "12px", borderRadius: "var(--radius-cards)" }}>
            <div className="between" style={{ fontSize: "13px", color: "var(--color-slate)" }}>
              <span>Subtotal</span>
              <span style={{ fontFamily: "var(--font-monospace)", fontWeight: 600 }}>{ugx(total)}</span>
            </div>
            {commission > 0 && (
              <div className="between" style={{ marginTop: "6px", fontSize: "13px", color: "var(--color-slate)" }}>
                <span>Platform fee ({commission}%)</span>
                <span style={{ fontFamily: "var(--font-monospace)" }}>{ugx(Math.round((total * commission) / 100))}</span>
              </div>
            )}
            <div className="rule" style={{ margin: "10px 0" }} />
            <div className="between" style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-obsidian)" }}>
              <span>Total</span>
              <span style={{ fontFamily: "var(--font-monospace)", color: "var(--color-forest-ink)" }}>
                {ugx(total + (commission > 0 ? Math.round((total * commission) / 100) : 0))}
              </span>
            </div>
          </div>
        </div>
      )}

      {stage === "waiting" && (
        <div style={{ textAlign: "center", padding: "40px 16px" }}>
          <div style={{ color: "var(--color-forest-ink)", display: "flex", justifyContent: "center" }}>
            <Loader2 size={48} className="spin" />
          </div>
          <h3 style={{ margin: "20px 0 8px", fontSize: "18px", fontWeight: 700, color: "var(--color-obsidian)" }}>
            Approve on phone
          </h3>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--color-slate)" }}>
            Enter your PIN on {phone || "your phone"} to pay {ugx(total)}.
          </p>
        </div>
      )}

      {stage === "done" && (
        <div style={{ textAlign: "center", padding: "40px 16px" }}>
          <div style={{ color: "var(--color-spruce)", display: "flex", justifyContent: "center" }}>
            <CheckCircle size={56} />
          </div>
          <h3 style={{ margin: "20px 0 8px", fontSize: "20px", fontWeight: 700, color: "var(--color-obsidian)" }}>
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
