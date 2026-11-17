import React, { useState, useEffect } from "react";
import { ugx } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { Stat } from "../components/Stat";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { useI18n } from "../context/I18nContext";

export default function SellerHome({ session, mine, myOrders, gross, advance }) {
  const { t, tp, tu } = useI18n();
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.get(ENDPOINTS.sellerDashboard).then(setStats).catch(() => {});
  }, [session?.id]);

  const activeCount = stats?.active_listings ?? mine.filter((l) => l.qty > 0).length;
  const ordersCount = stats?.orders_this_month ?? myOrders.length;
  const grossRevenue = stats?.gross_revenue ?? gross;
  const ratingCount = stats?.rating_count ?? 0;
  const avgRating = stats && ratingCount > 0 ? `${stats.avg_rating} ★` : "—";
  const pending = myOrders.filter((o) => o.status !== "delivered");

  return (
    <>
      <Head title={t("seller.overview")} />
      <div className="row" style={{ marginBottom: 16 }}>
        <Badge tone={(stats?.is_verified ?? session?.is_verified) ? "b-green" : "default"}>
          {(stats?.is_verified ?? session?.is_verified) ? t("seller.verified") : t("seller.pending_verify")}
        </Badge>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        <Stat label={t("seller.listings")} value={activeCount} />
        <Stat label={t("seller.orders")} value={ordersCount} />
        <Stat label={t("seller.revenue")} value={ugx(grossRevenue)} />
        <Stat label={t("seller.rating")} value={avgRating} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px", color: "var(--color-obsidian)" }}>
          {t("seller.pending_orders")}
        </h2>
        <div className="stack" style={{ gap: 10 }}>
          {pending.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--color-slate)" }}>{t("seller.no_pending")}</div>
          ) : (
            pending.map((o) => (
              <div key={o.id} className="between" style={{ borderBottom: "1px solid var(--color-fog)", paddingBottom: 10, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-obsidian)" }}>{o.qty} {tu(o.unit)} {tp(o.item)}</div>
                  <div style={{ fontSize: 12, color: "var(--color-slate)" }}>{o.id} · {o.buyer}</div>
                </div>
                {o.type === "order" && (
                  <button className="btn-sm" onClick={() => advance(o)}>
                    {o.status === "placed" ? t("seller.accept_order") : o.status === "accepted" ? t("seller.start_delivery") : t("seller.confirm_delivered")}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
