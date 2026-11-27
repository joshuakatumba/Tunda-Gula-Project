import React, { useState, useEffect } from "react";
import { TrendingUp, Repeat } from "lucide-react";
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
  const [pulse, setPulse] = useState([]);
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    api.get(ENDPOINTS.sellerDashboard).then(setStats).catch(() => {});
    api.get(ENDPOINTS.predictions).then((d) => setPulse(Array.isArray(d) ? d.slice(0, 3) : [])).catch(() => {});
    api.get(ENDPOINTS.subscriptions).then((d) => setContracts(Array.isArray(d) ? d : d?.results || [])).catch(() => {});
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
      <div className="row" style={{ marginBottom: 14, gap: 8 }}>
        <Badge tone={(stats?.is_verified ?? session?.is_verified) ? "b-green" : "default"}>
          {(stats?.is_verified ?? session?.is_verified) ? t("seller.verified") : t("seller.pending_verify")}
        </Badge>
        {contracts.length > 0 && (
          <Badge tone="b-maize">
            <Repeat size={11} style={{ marginRight: 4 }} /> {contracts.length} {t("seller.recurring_buyers")}
          </Badge>
        )}
      </div>

      {pulse.length > 0 && (
        <div className="card" style={{ marginBottom: 14, padding: 12, background: "var(--color-linen-mist)" }}>
          <div className="row" style={{ gap: 6, marginBottom: 8, alignItems: "center" }}>
            <TrendingUp size={15} color="var(--color-forest-ink)" />
            <strong style={{ fontSize: 13, color: "var(--color-forest-ink)" }}>{t("seller.market_pulse")}</strong>
          </div>
          <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
            {pulse.map((p) => (
              <div key={p.crop} style={{ fontSize: 12 }}>
                <strong>{tp(p.crop)}</strong>: {ugx(p.current_price)}/{tu(p.unit)}{" "}
                <span style={{ fontWeight: 700, color: p.signal === "rise" ? "var(--color-forest-ink)" : p.signal === "dip" ? "var(--color-alarm-red)" : "var(--color-slate)" }}>
                  {p.signal === "rise" ? "▲" : p.signal === "dip" ? "▼" : "–"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        <Stat label={t("seller.listings")} value={activeCount} />
        <Stat label={t("seller.orders")} value={ordersCount} />
        <Stat label={t("seller.revenue")} value={ugx(grossRevenue)} />
        <Stat label={t("seller.rating")} value={avgRating} />
      </div>

      {contracts.length > 0 && (
        <div className="card" style={{ marginTop: 14, padding: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>{t("seller.recurring_buyers")}</h2>
          <div className="stack" style={{ gap: 8 }}>
            {contracts.map((c) => (
              <div key={c.id} className="between" style={{ fontSize: 13 }}>
                <span><strong>{c.buyer_name}</strong> · {c.quantity} {tu(c.unit)} {tp(c.listing_name)}</span>
                <Badge tone="b-green">{c.frequency}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 14 }}>
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
