import React from "react";
import { ugx, dshort, daysTo } from "../utils/helpers";
import { Head } from "../components/Head";

export default function SellerPlans({ myPlans, setPlans, pushSms, say, onCreatePlan }) {
  return (
    <>
      <Head eyebrow="Harvest planning" title="Sell it before it is ready"
        lede="Tell buyers what is in the ground and when you expect to harvest. They reserve it with a deposit, so you know your income early."
        reqs={["REQ-025", "REQ-032", "REQ-033"]} />
      <div className="row" style={{ marginBottom: 14 }}><button className="btn-maize" onClick={onCreatePlan}>+ Add a harvest plan</button></div>
      <div className="stack">
        {myPlans.map(p => (
          <div className="card" key={p.id}>
            <div className="between">
              <div><h3>{p.name}</h3><p className="hint" style={{ marginTop: 3 }}>Planted {dshort(p.planted)} · harvest {dshort(p.harvest)} ({daysTo(p.harvest)} days)</p></div>
              <button className="btn-sm" onClick={() => {
                setPlans(ps => ps.map(x => x.id === p.id ? { ...x, harvest: "2026-08-19" } : x));
                pushSms("Buyer · Nakato Catering", `${p.name} harvest moved to 19 Aug. Your reservation of ${p.reserved} ${p.unit} stands.`);
                say("Harvest date pushed a week. Every pre-order buyer was sent an SMS.");
              }}>Push harvest by a week</button>
            </div>
            <div style={{ marginTop: 12 }}>
              <div className="bar"><i style={{ width: (p.reserved / p.qty) * 100 + "%" }} /></div>
              <div className="hint" style={{ marginTop: 5 }}>{p.reserved} of {p.qty} {p.unit} reserved · {ugx(p.reserved * p.price * p.deposit / 100)} in deposits received</div>
            </div>
            {p.reserved > 0 && (
              <div className="scroll-x" style={{ marginTop: 12 }}>
                <table className="tbl">
                  <thead><tr><th>Buyer</th><th>Reserved</th><th>Deposit paid</th><th>Contact</th></tr></thead>
                  <tbody><tr><td>Nakato Catering</td><td className="mono">{p.reserved} {p.unit}</td>
                    <td className="mono">{ugx(p.reserved * p.price * p.deposit / 100)}</td><td className="mono">0772••882</td></tr></tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
