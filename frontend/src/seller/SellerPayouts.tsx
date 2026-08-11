import React from "react";
import { ugx } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { Stat } from "../components/Stat";

export default function SellerPayouts({ myOrders, gross, paidOut, commission }) {
  return (
    <>
      <Head eyebrow="Money" title="What you have been paid"
        lede="Money is released to your mobile money number once the buyer confirms the produce arrived."
        reqs={["REQ-039", "REQ-046"]} />
      <div className="grid g3">
        <Stat label="Paid out" value={ugx(paidOut)} sub="to 0772••882 (MTN)" />
        <Stat label="Held until delivery" value={ugx(gross * (1 - commission / 100) - paidOut)} sub="2 orders in transit" />
        <Stat label="Commission charged" value={ugx(gross * commission / 100)} sub={`${commission}% of ${ugx(gross)}`} />
      </div>
      <div className="card scroll-x" style={{ marginTop: 12 }}>
        <table className="tbl">
          <thead><tr><th>Order</th><th>Produce</th><th>Gross</th><th>Commission</th><th>Your payout</th><th>Status</th></tr></thead>
          <tbody>
            {myOrders.map(o => { const g = o.qty * o.price; return (
              <tr key={o.id}>
                <td className="mono">{o.id}</td><td>{o.qty} {o.unit} {o.item}</td>
                <td className="mono">{ugx(g)}</td><td className="mono">−{ugx(g * commission / 100)}</td>
                <td className="mono"><strong>{ugx(g * (1 - commission / 100))}</strong></td>
                <td>{o.status === "delivered" ? <Badge tone="b-green">Paid</Badge> : <Badge tone="b-maize">Held</Badge>}</td>
              </tr>); })}
          </tbody>
        </table>
      </div>
    </>
  );
}
