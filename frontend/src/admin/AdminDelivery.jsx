import React, { useState, useEffect, Suspense } from "react";
import { Head } from "../components/Head";
import { Stat } from "../components/Stat";
const FarmMap = React.lazy(() => import("../components/FarmMap"));
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { ugx } from "../utils/helpers";
import { useI18n } from "../context/I18nContext";

export default function AdminDelivery() {
  const { t } = useI18n();
  const [pins, setPins] = useState([]);
  const [stats, setStats] = useState(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    api.get(`${ENDPOINTS.pending}?role=seller&is_verified=true`)
      .then((data) => {
        const items = Array.isArray(data) ? data : data.results || [];
        setPins(
          items
            .filter((s) => s.gps_lat && s.gps_lng)
            .map((s) => ({
              id: s.id,
              name: s.name,
              district: s.district || "",
              lat: parseFloat(s.gps_lat),
              lng: parseFloat(s.gps_lng),
              is_verified: s.is_verified,
            }))
        );
      })
      .catch(() => setMapError(true));

    api.get(ENDPOINTS.reportDelivery).then(setStats).catch(() => {});
  }, []);

  return (
    <>
      <Head title={t("admin.delivery")} />
      <div className="grid g4">
        <Stat label={t("admin.total_orders")} value={stats?.total_orders ?? 0} />
        <Stat label={t("common.delivered")} value={stats?.delivered_orders ?? 0} />
        <Stat label="Completion" value={`${stats?.completion_rate ?? 0}%`} />
        <Stat label={t("admin.disputes")} value={stats?.open_disputes ?? 0} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>{t("admin.map_title")}</h2>
        {mapError ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--color-slate)" }}>Map unavailable</div>
        ) : (
          <Suspense fallback={<div className="skeleton" style={{ height: 340, width: "100%", borderRadius: 8 }} />}>
            <FarmMap pins={pins} height={340} />
          </Suspense>
        )}
      </div>

      {stats?.districts?.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>{t("buyer.district")}</th>
                <th>{t("seller.orders")}</th>
                <th>{t("buyer.delivery")}</th>
              </tr>
            </thead>
            <tbody>
              {stats.districts.map((r) => (
                <tr key={r.district}>
                  <td><strong>{r.district}</strong></td>
                  <td style={{ fontFamily: "var(--font-monospace)" }}>{r.orders}</td>
                  <td style={{ fontFamily: "var(--font-monospace)" }}>{ugx(r.delivery_fees)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
