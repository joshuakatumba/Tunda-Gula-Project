import React, { useState, useEffect } from "react";
import { Head } from "../components/Head";
import { Stat } from "../components/Stat";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { useI18n } from "../context/I18nContext";

export default function SellerRatings({ session }) {
  const { t, tp } = useI18n();
  const [ratings, setRatings] = useState([]);
  const [summary, setSummary] = useState({ avg_rating: 0, total_reviews: 0, repeat_buyers: 0, total_buyers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get(ENDPOINTS.ratings).catch(() => ({ results: [] })),
      api.get(ENDPOINTS.ratingsSummary).catch(() => null),
    ]).then(([listRes, sumRes]) => {
      if (!active) return;
      const items = Array.isArray(listRes) ? listRes : listRes?.results || [];
      setRatings(items);
      if (sumRes) {
        setSummary(sumRes);
      } else {
        const total = items.length;
        const avg = total > 0 ? items.reduce((acc, r) => acc + r.stars, 0) / total : 0;
        setSummary({
          avg_rating: Math.round(avg * 10) / 10,
          total_reviews: total,
          repeat_buyers: 0,
          total_buyers: new Set(items.map((i) => i.buyer_name)).size,
        });
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [session?.id]);

  return (
    <>
      <Head title={t("seller.ratings_title")} />
      <div className="grid g3">
        <Stat label={t("seller.avg_rating")} value={summary.total_reviews > 0 ? `${summary.avg_rating} ★` : "—"} />
        <Stat label={t("seller.total_reviews")} value={String(summary.total_reviews)} />
        <Stat label={t("seller.repeat_buyers")} value={String(summary.repeat_buyers)} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--color-slate)" }}>{t("common.loading")}</div>
        ) : ratings.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: "var(--color-slate)" }}>{t("seller.no_reviews")}</div>
        ) : (
          <div className="stack" style={{ gap: 12 }}>
            {ratings.map((r) => (
              <div key={r.id} style={{ borderBottom: "1px solid var(--color-fog)", paddingBottom: 10 }}>
                <div className="between" style={{ alignItems: "center" }}>
                  <strong style={{ fontSize: 14 }}>{r.buyer_name}</strong>
                  <span style={{ color: "var(--color-forest-ink)", fontSize: 13, fontWeight: 700 }}>
                    {"★".repeat(r.stars)}
                  </span>
                </div>
                {r.item_name && <div style={{ fontSize: 12, color: "var(--color-slate)" }}>{tp(r.item_name)}</div>}
                {r.comment && <p style={{ margin: "4px 0 0", fontSize: 13 }}>{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
