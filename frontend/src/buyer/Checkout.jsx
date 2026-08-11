import React, { useState } from "react";
import { Smartphone, CheckCircle } from "lucide-react";
import { EMOJI, TINT } from "../data/categories";
import { ugx } from "../utils/helpers";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";

export default function Checkout({ cart, setCart, commission, onClose, onPay, t }) {
  const [provider, setProvider] = useState("MTN");
  const [stage, setStage] = useState("cart");
  const total = cart.reduce((s, c) => s + c.qty * c.price, 0);

  const go = () => { setStage("waiting"); setTimeout(() => { setStage("done"); setTimeout(() => onPay(provider), 800); }, 1500); };

  return (
    <Modal title={stage === "cart" ? "Your basket" : "Mobile money"} onClose={onClose} wide={stage === "cart"}>
      {stage === "cart" && (
        <>
          {cart.map(c => (
            <div className="between" key={c.id} style={{ borderBottom: "1px solid #DDE6D2", paddingBottom: 11 }}>
              <div className="row" style={{ gap: 11 }}>
                <div style={{ width: 44, height: 44, background: TINT[c.cat], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{EMOJI[c.cat]}</div>
                <div><strong style={{ fontSize: 14 }}>{c.name}</strong><div className="hint">{c.seller} · {c.qty} {c.unit} @ {ugx(c.price)}</div></div>
              </div>
              <div className="row">
                <span className="mono">{ugx(c.qty * c.price)}</span>
                <button className="btn-sm" onClick={() => setCart(x => x.filter(y => y.id !== c.id))}>Remove</button>
              </div>
            </div>
          ))}
          <Field label="Pay with">
            <div className="row">
              {["MTN", "Airtel"].map(p => (
                <button key={p} className="btn-sm" onClick={() => setProvider(p)} style={{ flex: 1, padding: 12,
                  borderColor: provider === p ? "#16261E" : "#C9D4BE", background: provider === p ? "#DDE6D2" : "#FBFCF8" }}>{p} Mobile Money</button>
              ))}
            </div>
          </Field>
          <div style={{ background: "#F0F2EC", padding: 12 }}>
            <div className="between"><span className="hint">Produce total</span><span className="mono">{ugx(total)}</span></div>
            <div className="between" style={{ marginTop: 6 }}><span className="hint">Platform commission ({commission}%)</span><span className="mono">{ugx(total * commission / 100)}</span></div>
            <div className="rule" style={{ margin: "9px 0" }} />
            <div className="between"><strong>You pay</strong><strong className="mono">{ugx(total)}</strong></div>
            <div className="hint" style={{ marginTop: 4 }}>Farmers receive {ugx(total * (1 - commission / 100))} between them, after you confirm delivery.</div>
          </div>
          <button className="btn-maize" disabled={!cart.length} onClick={go}>{t.pay} · {ugx(total)}</button>
        </>
      )}
      {stage === "waiting" && (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ fontSize: 36, display: 'flex', justifyContent: 'center' }}><Smartphone size="1em" /></div><h3 style={{ marginTop: 12 }}>Check your phone</h3>
          <p className="lede" style={{ margin: "8px auto 0" }}>Enter your {provider} Mobile Money PIN to approve {ugx(total)}. This request times out after 30 seconds.</p>
        </div>
      )}
      {stage === "done" && (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ fontSize: 36, display: 'flex', justifyContent: 'center' }}><CheckCircle size="1em" /></div><h3 style={{ marginTop: 12 }}>Payment received</h3>
          <p className="lede" style={{ margin: "8px auto 0" }}>Each farmer has been sent your order by SMS.</p>
        </div>
      )}
    </Modal>
  );
}
