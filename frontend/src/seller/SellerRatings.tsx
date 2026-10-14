import React, { useState, useEffect } from "react";
import { Head } from "../components/Head";
import { Stat } from "../components/Stat";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";

interface RatingItem {
  id: number;
  stars: number;
  comment: string;
  buyer_name: string;
  seller_name: string;
  item_name?: string;
  created_at: string;
}

interface RatingSummary {
  avg_rating: number;
  total_reviews: number;
  repeat_buyers: number;
  total_buyers: number;
}

export default function SellerRatings({ session }: { session?: any }) {
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [summary, setSummary] = useState<RatingSummary>({
    avg_rating: 0,
    total_reviews: 0,
    repeat_buyers: 0,
    total_buyers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get<any>(ENDPOINTS.ratings).catch(() => ({ results: [] })),
      api.get<any>(ENDPOINTS.ratingsSummary).catch(() => null),
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
          total_buyers: new Set(items.map(i => i.buyer_name)).size,
        });
      }
      setLoading(false);
    });

    return () => { active = false; };
  }, [session?.id]);

  const badgeStatus =
    summary.avg_rating >= 4.5 && summary.total_reviews >= 5
      ? "Top Seller"
      : summary.total_reviews > 0
      ? "Active Seller"
      : "New Seller";

  const badgeSub =
    summary.avg_rating >= 4.5 && summary.total_reviews >= 5
      ? "Qualified (4.5+ ★)"
      : summary.total_reviews > 0
      ? `${summary.total_reviews} reviews`
      : "Pending first review";

  return (
    <>
      <Head title="Customer Ratings" />
      <div className="grid g3">
        <Stat
          label="Average rating"
          value={summary.total_reviews > 0 ? `${summary.avg_rating} ★` : "No ratings"}
          sub={`${summary.total_reviews} total reviews`}
        />
        <Stat
          label="Repeat buyers"
          value={String(summary.repeat_buyers)}
          sub={`of ${summary.total_buyers} total buyers`}
        />
        <Stat label="Badge status" value={badgeStatus} sub={badgeSub} />
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 16px", color: "var(--color-obsidian)" }}>
          Recent Buyer Feedback
        </h2>

        {loading ? (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--color-slate)" }}>
            Loading reviews...
          </div>
        ) : ratings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: "36px", marginBottom: "8px" }}>⭐</div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 8px", color: "var(--color-obsidian)" }}>
              No buyer reviews yet
            </h3>
            <p style={{ fontSize: "14px", color: "var(--color-slate)", maxWidth: "420px", margin: "0 auto" }}>
              Ratings submitted by buyers after confirming their delivered orders will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="stack" style={{ gap: "16px" }}>
            {ratings.map(r => (
              <div key={r.id} style={{ borderBottom: "1px solid var(--color-fog)", paddingBottom: "14px" }}>
                <div className="between" style={{ alignItems: "center" }}>
                  <div className="row" style={{ gap: "8px", alignItems: "center" }}>
                    <strong style={{ fontSize: "15px", color: "var(--color-obsidian)" }}>
                      {r.buyer_name || "Verified Buyer"}
                    </strong>
                    <span style={{ color: "var(--color-forest-ink)", fontSize: "14px", fontWeight: 700 }}>
                      {"★".repeat(r.stars)}
                      <span style={{ color: "var(--color-pebble)" }}>{"★".repeat(5 - r.stars)}</span>
                    </span>
                  </div>
                  {r.created_at && (
                    <span style={{ fontSize: "12px", color: "var(--color-slate)" }}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {r.item_name && (
                  <div style={{ fontSize: "12px", color: "var(--color-slate)", marginTop: "2px" }}>
                    Ordered: {r.item_name}
                  </div>
                )}
                {r.comment ? (
                  <p style={{ margin: "6px 0 0", fontSize: "14px", color: "var(--color-charcoal)", lineHeight: 1.5 }}>
                    "{r.comment}"
                  </p>
                ) : (
                  <p style={{ margin: "6px 0 0", fontSize: "13px", color: "var(--color-pebble)", fontStyle: "italic" }}>
                    Rated {r.stars} out of 5 stars with no written feedback.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
