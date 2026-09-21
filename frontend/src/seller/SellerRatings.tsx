import React from "react";
import { Head } from "../components/Head";
import { Stat } from "../components/Stat";

export default function SellerRatings() {
  return (
    <>
      <Head title="Customer Ratings" />
      <div className="grid g3">
        <Stat label="Average rating" value="4.7 ★" sub="38 total reviews" />
        <Stat label="Repeat buyers" value="9" sub="of 24 total buyers" />
        <Stat label="Badge status" value="Top Seller" sub="Qualified" />
      </div>
      <div className="card" style={{ marginTop: "20px" }}>
        <div className="stack" style={{ gap: "16px" }}>
          {[
            ["Nakato Catering", 5, "Tomatoes were firm and clean. Delivered on time."],
            ["Kampala Fresh Mart", 4, "Good produce quality."],
            ["Ssebo Grocers", 5, "Best price and fresh produce. Will buy again."]
          ].map(([who, st, txt]) => (
            <div key={who as string} style={{ borderBottom: "1px solid var(--color-fog)", paddingBottom: "14px" }}>
              <div className="row" style={{ gap: "8px", alignItems: "center" }}>
                <strong style={{ fontSize: "15px", color: "var(--color-obsidian)" }}>{who}</strong>
                <span style={{ color: "var(--color-forest-ink)", fontSize: "14px", fontWeight: 700 }}>
                  {"★".repeat(Number(st))}
                </span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: "14px", color: "var(--color-charcoal)", lineHeight: 1.5 }}>
                {txt}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
