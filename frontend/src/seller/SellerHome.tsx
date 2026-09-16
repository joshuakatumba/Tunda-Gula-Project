import React, { useState, useEffect } from "react";
import { ugx } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { Stat } from "../components/Stat";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";

interface DashStats {
  active_listings: number;
  total_listings: number;
  orders_this_month: number;
  pending_orders: number;
  gross_revenue: number;
  avg_rating: number;
  rating_count: number;
  is_verified: boolean;
  district: string;
}

export default function SellerHome({ session, mine, myOrders, gross, commission, sms, advance }) {
  const [stats, setStats] = useState<DashStats | null>(null);

  useEffect(() => {
    api.get<DashStats>(ENDPOINTS.sellerDashboard)
      .then(setStats)
      .catch(() => { /* fall back to props */ });
  }, []);

  const activeCount = stats?.active_listings ?? mine.filter(l => l.qty > 0).length;
  const totalListings = stats?.total_listings ?? mine.length;
  const ordersCount = stats?.orders_this_month ?? myOrders.length;
  const pendingCount = stats?.pending_orders ?? myOrders.filter(o => o.status !== "delivered").length;
  const grossRevenue = stats?.gross_revenue ?? gross;
  const avgRating = stats ? `${stats.avg_rating} ★` : "4.7 ★";
  const ratingCount = stats?.rating_count ?? 38;

  return (
    <>
      <Head title="Seller Overview" />

      <div className="row" style={{ marginBottom: 20, gap: 8 }}>
        <Badge tone={stats?.is_verified ? "b-green" : "default"}>
          {stats?.is_verified ? "Verified farmer" : "Pending verification"}
        </Badge>
        {activeCount > 0 && <Badge tone="b-maize">Active seller</Badge>}
      </div>

      <div className="grid g4">
        <Stat label="Active listings" value={activeCount} sub={`${totalListings} total`} />
        <Stat label="Orders this month" value={ordersCount} sub={`${pendingCount} pending`} />
        <Stat label="Earned (gross)" value={ugx(grossRevenue)} sub={`${commission}% commission`} />
        <Stat label="Rating" value={avgRating} sub={`${ratingCount} reviews`} />
      </div>

      <div className="grid g2" style={{ marginTop: 20 }}>
        <div className="card">
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 16px", color: "var(--color-obsidian)" }}>
            Pending orders
          </h2>
          <div className="stack" style={{ gap: "12px" }}>
            {myOrders.filter(o => o.status !== "delivered").length === 0 ? (
              <div style={{ fontSize: "14px", color: "var(--color-slate)" }}>No orders waiting for action.</div>
            ) : (
              myOrders.filter(o => o.status !== "delivered").map(o => (
                <div key={o.id} className="between" style={{ borderBottom: "1px solid var(--color-fog)", paddingBottom: "12px", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-monospace)", fontSize: "12px", color: "var(--color-charcoal)" }}>{o.id}</div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-obsidian)", marginTop: "2px" }}>{o.qty} {o.unit} {o.item}</div>
                    <div style={{ fontSize: "13px", color: "var(--color-slate)" }}>{o.buyer}</div>
                  </div>
                  {o.type === "order" && (
                    <button className="btn-sm" onClick={() => advance(o)}>
                      {o.status === "accepted" ? "Start delivery" : "Mark delivered"}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 16px", color: "var(--color-obsidian)" }}>
            Automated SMS notifications
          </h2>
          <div className="stack" style={{ gap: "10px" }}>
            {sms.slice(0, 4).map((m, i) => (
              <div className="sms" key={i}>
                <strong style={{ fontSize: "12px", display: "block", color: "var(--color-forest-ink)" }}>{m.to}</strong>
                <div style={{ marginTop: "4px", fontSize: "13px" }}>{m.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
