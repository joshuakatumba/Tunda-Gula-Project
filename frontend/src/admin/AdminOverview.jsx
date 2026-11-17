import React, { useState, useEffect } from "react";
import { ugx } from "../utils/helpers";
import { Head } from "../components/Head";
import { Stat } from "../components/Stat";
import { Field } from "../components/Field";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { useI18n } from "../context/I18nContext";

export default function AdminOverview({ orders, commission, setCommission, depositDefault, setDepositDefault, pending }) {
  const { t } = useI18n();
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.get(ENDPOINTS.adminStats).then(setStats).catch(() => {});
  }, []);

  const gmv = stats?.gmv ?? orders.filter((o) => o.paid || o.status === "delivered").reduce((s, o) => s + o.qty * o.price, 0);
  const rev = stats?.platform_revenue ?? Math.round((gmv * commission) / 100);
  const totalOrders = stats?.total_orders ?? orders.length;
  const verifiedCount = stats?.verified_sellers ?? 0;
  const pendingCount = stats?.pending_sellers ?? pending.length;

  const weeklyData = stats?.weekly_volume?.length > 0 ? stats.weekly_volume : [
    { week: 26, count: orders.length > 0 ? 1 : 0 },
    { week: 27, count: orders.length > 1 ? 2 : 0 },
    { week: 28, count: orders.length > 2 ? 3 : 0 },
    { week: 29, count: orders.length }
  ];
  const maxWeeklyCount = Math.max(1, ...weeklyData.map((w) => w.count));

  return (
    <>
      <Head title={t("admin.overview")} />
      <div className="grid g4">
        <Stat label={t("admin.gmv")} value={ugx(gmv)} />
        <Stat label={t("admin.revenue")} value={ugx(rev)} sub={`${commission}%`} />
        <Stat label={t("admin.total_orders")} value={totalOrders} />
        <Stat label={t("admin.verified_sellers")} value={verifiedCount} sub={t("admin.pending_sub", { count: pendingCount })} />
      </div>

      <div className="grid g2" style={{ marginTop: 20 }}>
        <div className="card">
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 16px", color: "var(--color-obsidian)" }}>
            {t("admin.weekly_volume")}
          </h2>
          <div className="row" style={{ alignItems: "flex-end", height: 130, gap: 12, marginTop: 16 }}>
            {weeklyData.map((w, idx) => {
              const h = Math.max(15, Math.round((w.count / maxWeeklyCount) * 100));
              const isLatest = idx === weeklyData.length - 1;
              return (
                <div key={w.week} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-slate)", marginBottom: 4 }}>{w.count}</div>
                  <div style={{ height: `${h}%`, background: isLatest ? "var(--color-lime-voltage)" : "var(--color-forest-ink)", borderRadius: "4px 4px 0 0", transition: "height 0.3s ease" }} />
                  <div style={{ marginTop: 8, fontSize: 12, fontFamily: "var(--font-monospace)", color: "var(--color-slate)" }}>W{w.week}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 16px", color: "var(--color-obsidian)" }}>
            {t("admin.settings")}
          </h2>
          <div className="stack" style={{ gap: 16 }}>
            <Field label={t("admin.commission", { val: commission })}>
              <input type="range" min="5" max="8" step="0.5" value={commission} onChange={(e) => setCommission(Number(e.target.value))} />
            </Field>
            <Field label={t("admin.deposit_default", { val: depositDefault })}>
              <input type="range" min="10" max="50" step="5" value={depositDefault} onChange={(e) => setDepositDefault(Number(e.target.value))} />
            </Field>
          </div>
        </div>
      </div>
    </>
  );
}
