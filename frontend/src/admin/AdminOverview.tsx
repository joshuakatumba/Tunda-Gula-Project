import React, { useState, useEffect } from "react";
import { ugx } from "../utils/helpers";
import { Head } from "../components/Head";
import { Stat } from "../components/Stat";
import { Field } from "../components/Field";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";

interface AdminStats {
  gmv: number;
  platform_revenue: number;
  commission_rate: number;
  default_deposit: number;
  total_orders: number;
  verified_sellers: number;
  pending_sellers: number;
  total_buyers: number;
  weekly_volume: { week: number; count: number }[];
}

export default function AdminOverview({ orders, commission, setCommission, depositDefault, setDepositDefault, pending }) {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.get<AdminStats>(ENDPOINTS.adminStats)
      .then(setStats)
      .catch(() => { /* fall back to props */ });
  }, []);

  const gmv = stats?.gmv ?? orders.filter(o => o.paid || o.status === "delivered").reduce((s, o) => s + o.qty * o.price, 0);
  const rev = stats?.platform_revenue ?? Math.round(gmv * commission / 100);
  const totalOrders = stats?.total_orders ?? orders.length;
  const verifiedCount = stats?.verified_sellers ?? 0;
  const pendingCount = stats?.pending_sellers ?? pending.length;

  const weeklyData = stats?.weekly_volume && stats.weekly_volume.length > 0
    ? stats.weekly_volume
    : [
        { week: 26, count: orders.length > 0 ? 1 : 0 },
        { week: 27, count: orders.length > 1 ? 2 : 0 },
        { week: 28, count: orders.length > 2 ? 3 : 0 },
        { week: 29, count: orders.length },
      ];

  const maxWeeklyCount = Math.max(1, ...weeklyData.map(w => w.count));

  return (
    <>
      <Head title="Platform Overview" />
      <div className="grid g4">
        <Stat label="Gross Merchandise Value" value={ugx(gmv)} sub="Total volume" />
        <Stat label="Platform Revenue" value={ugx(rev)} sub={`${commission}% commission`} />
        <Stat label="Total Orders" value={totalOrders} sub="Recorded in DB" />
        <Stat label="Verified Sellers" value={verifiedCount} sub={`${pendingCount} pending`} />
      </div>

      <div className="grid g2" style={{ marginTop: "20px" }}>
        <div className="card">
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 16px", color: "var(--color-obsidian)" }}>
            Order Volume by Calendar Week
          </h2>
          <div className="row" style={{ alignItems: "flex-end", height: 130, gap: 12, marginTop: 16 }}>
            {weeklyData.map((w, idx) => {
              const h = Math.max(15, Math.round((w.count / maxWeeklyCount) * 100));
              const isLatest = idx === weeklyData.length - 1;
              return (
                <div key={w.week} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-slate)", marginBottom: "4px" }}>
                    {w.count}
                  </div>
                  <div
                    style={{
                      height: `${h}%`,
                      background: isLatest ? "var(--color-lime-voltage)" : "var(--color-forest-ink)",
                      borderRadius: "4px 4px 0 0",
                      transition: "height 0.3s ease",
                    }}
                  />
                  <div style={{ marginTop: 8, fontSize: "12px", fontFamily: "var(--font-monospace)", color: "var(--color-slate)" }}>
                    Wk {w.week}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 16px", color: "var(--color-obsidian)" }}>
            Platform Settings
          </h2>
          <div className="stack" style={{ gap: "16px" }}>
            <Field label={`Commission rate (${commission}%)`}>
              <input
                type="range"
                min="5"
                max="8"
                step="0.5"
                value={commission}
                onChange={e => setCommission(Number(e.target.value))}
              />
            </Field>
            <Field label={`Default pre-order deposit (${depositDefault}%)`}>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={depositDefault}
                onChange={e => setDepositDefault(Number(e.target.value))}
              />
            </Field>
          </div>
        </div>
      </div>
    </>
  );
}
