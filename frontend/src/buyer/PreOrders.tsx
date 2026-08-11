import React from "react";
import { EMOJI, TINT } from "../data/categories";
import { ugx, dshort, daysTo } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";

export default function PreOrders({ plans, t, onPreorder }) {
  return (
    <>
      <Head eyebrow="Harvest planning" title="Reserve it before it is picked"
        lede="Farmers post what is still in the ground. Pay a deposit, lock your quantity, and get an SMS three days before harvest."
        reqs={["REQ-026", "REQ-027", "REQ-028", "REQ-030", "REQ-031"]} />
      <div className="grid g3">
        {plans.map(p => {
          const left = p.qty - p.reserved;
          return (
            <article className="listing" key={p.id}>
              <div className="photo" style={{ background: TINT[p.cat] }}><span>{EMOJI[p.cat]}</span><Badge tone="b-maize">Pre-order available</Badge></div>
              <div style={{ padding: 13, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                <div><h3>{p.name}</h3><p className="hint" style={{ marginTop: 3 }}>{p.seller} · {p.district}</p></div>
                <div className="mono" style={{ fontSize: 12 }}>Harvest {dshort(p.harvest)} · in {daysTo(p.harvest)} days</div>
                <div className="price">{ugx(p.price)}<span className="hint"> / {p.unit}</span></div>
                <div>
                  <div className="bar"><i style={{ width: (p.reserved / p.qty) * 100 + "%" }} /></div>
                  <div className="hint" style={{ marginTop: 4 }}>{p.reserved} of {p.qty} {p.unit} reserved · {left} left</div>
                </div>
                <div className="hint">Deposit {p.deposit}% to reserve</div>
                <button className="btn-maize" style={{ marginTop: "auto" }} disabled={left === 0} onClick={() => onPreorder(p)}>
                  {left === 0 ? "Fully reserved" : t.preorder}</button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
