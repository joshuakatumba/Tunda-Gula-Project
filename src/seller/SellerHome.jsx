import React from "react";
import { ugx, typeLabel } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { Stat } from "../components/Stat";

export default function SellerHome({ session, mine, myOrders, gross, commission, sms, advance }) {
  return (
    <>
      <Head eyebrow={typeLabel(session.type)} title={`Good morning, ${session.name.split(" ")[0]}`}
        lede="What you have listed, what you have sold, and what you are owed."
        reqs={["REQ-005", "REQ-011", "REQ-018", "REQ-039"]} />
      <div className="row" style={{ marginBottom: 14 }}>
        <Badge tone="b-green">Verified farmer</Badge><Badge tone="b-maize">Top seller</Badge>
        <span className="hint">ID verified · phone verified · farm pinned in Wakiso</span>
      </div>
      <div className="grid g4">
        <Stat label="Active listings" value={mine.filter(l => l.qty > 0).length} sub={`${mine.length} total`} />
        <Stat label="Orders this month" value={myOrders.length} sub="2 waiting on you" />
        <Stat label="Earned (gross)" value={ugx(gross)} sub={`less ${commission}% commission`} />
        <Stat label="Your rating" value="4.7 ★" sub="38 buyer ratings" />
      </div>
      <div className="grid g2" style={{ marginTop: 12 }}>
        <div className="card">
          <h2>Needs your attention</h2>
          <div className="stack" style={{ marginTop: 12 }}>
            {myOrders.filter(o => o.status !== "delivered").map(o => (
              <div key={o.id} className="between" style={{ borderBottom: "1px solid #DDE6D2", paddingBottom: 10 }}>
                <div><div className="mono" style={{ fontSize: 12 }}>{o.id}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{o.qty} {o.unit} {o.item}</div>
                  <div className="hint">{o.buyer}</div></div>
                {o.type === "order" && <button className="btn-sm" onClick={() => advance(o)}>
                  {o.status === "accepted" ? "Start delivery" : "Mark delivered"}</button>}
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h2>Messages sent for you</h2>
          <p className="hint" style={{ marginTop: 4 }}>TundaGula sends these automatically. They cost you no airtime.</p>
          <div className="stack" style={{ marginTop: 12 }}>
            {sms.slice(0, 4).map((m, i) => <div className="sms" key={i}><strong style={{ fontSize: 11 }}>{m.to}</strong><div style={{ marginTop: 3 }}>{m.text}</div></div>)}
          </div>
        </div>
      </div>
    </>
  );
}
