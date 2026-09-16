import React from "react";
import { ugx } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { Stat } from "../components/Stat";

export default function SellerPayouts({ myOrders, gross, paidOut, commission }) {
  return (
    <>
      <Head title="Payouts" />
      <div className="grid g3">
        <Stat label="Total paid out" value={ugx(paidOut)} sub="Mobile Money" />
        <Stat label="In escrow" value={ugx(gross * (1 - commission / 100) - paidOut)} sub="Released on delivery" />
        <Stat label="Platform fees" value={ugx(gross * commission / 100)} sub={`${commission}% rate`} />
      </div>
      <div className="card" style={{ marginTop: "20px" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Order</th>
              <th>Produce</th>
              <th>Gross</th>
              <th>Fee</th>
              <th>Net Payout</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {myOrders.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--color-slate)", padding: "24px" }}>
                  No payout transactions yet.
                </td>
              </tr>
            ) : (
              myOrders.map(o => {
                const g = o.qty * o.price;
                return (
                  <tr key={o.id}>
                    <td style={{ fontFamily: "var(--font-monospace)" }}>{o.id}</td>
                    <td>{o.qty} {o.unit} {o.item}</td>
                    <td style={{ fontFamily: "var(--font-monospace)" }}>{ugx(g)}</td>
                    <td style={{ fontFamily: "var(--font-monospace)", color: "var(--color-slate)" }}>−{ugx(g * commission / 100)}</td>
                    <td style={{ fontFamily: "var(--font-monospace)", fontWeight: 700, color: "var(--color-forest-ink)" }}>
                      {ugx(g * (1 - commission / 100))}
                    </td>
                    <td>
                      {o.status === "delivered" ? (
                        <Badge tone="b-green">Paid out</Badge>
                      ) : (
                        <Badge tone="b-maize">Escrow</Badge>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
