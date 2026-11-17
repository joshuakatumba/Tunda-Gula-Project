import React from "react";
import { ugx } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { Stat } from "../components/Stat";
import { useI18n } from "../context/I18nContext";

export default function SellerPayouts({ myOrders, gross, paidOut, commission }) {
  const { t, tp, tu } = useI18n();
  return (
    <>
      <Head title={t("seller.payouts")} />
      <div className="grid g3">
        <Stat label={t("seller.net_payout")} value={ugx(paidOut)} />
        <Stat label={t("seller.gross")} value={ugx(gross)} />
        <Stat label={t("seller.revenue")} value={`${commission}%`} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>#</th>
              <th>{t("seller.listings")}</th>
              <th>{t("seller.gross")}</th>
              <th>{t("seller.net_payout")}</th>
              <th>{t("common.all")}</th>
            </tr>
          </thead>
          <tbody>
            {myOrders.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--color-slate)", padding: 24 }}>
                  {t("seller.no_payouts")}
                </td>
              </tr>
            ) : (
              myOrders.map((o) => {
                const g = o.qty * o.price;
                return (
                  <tr key={o.id}>
                    <td style={{ fontFamily: "var(--font-monospace)" }}>{o.id}</td>
                    <td>{o.qty} {tu(o.unit)} {tp(o.item)}</td>
                    <td style={{ fontFamily: "var(--font-monospace)" }}>{ugx(g)}</td>
                    <td style={{ fontFamily: "var(--font-monospace)", fontWeight: 700, color: "var(--color-forest-ink)" }}>
                      {ugx(g * (1 - commission / 100))}
                    </td>
                    <td>
                      <Badge tone={o.status === "delivered" ? "b-green" : "b-maize"}>
                        {t(`status.${o.status}`)}
                      </Badge>
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
