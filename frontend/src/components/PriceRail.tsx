import React, { useState, useEffect } from "react";
import { REF_PRICES } from "../data/refPrices";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";

export const PriceRail = ({ t }) => {
  const [prices, setPrices] = useState(REF_PRICES);

  useEffect(() => {
    api.get(ENDPOINTS.prices)
      .then((data) => {
        const items = Array.isArray(data) ? data : data.results || [];
        if (items.length > 0) {
          setPrices(items.map((p: any) => ({
            name: p.name,
            unit: p.unit,
            price: p.price,
            move: p.week_change ?? 0,
          })));
        }
      })
      .catch(() => { /* keep hardcoded fallback */ });
  }, []);

  // Duplicate for smooth infinite marquee scrolling
  const marqueePrices = [...prices, ...prices];

  return (
    <div className="rail">
      <div className="rail-tag" style={{ position: 'absolute', zIndex: 2 }}>{t.live} · InfoTrade Connect · wk 29</div>
      <div className="rail-marquee">
        {marqueePrices.map((p, i) => (
          <div className="chalk" key={`${p.name}-${i}`}>
            <div className="c-name">{p.name} / {p.unit}</div>
            <div className="c-price">{p.price.toLocaleString()}{" "}
              <span className={p.move > 0 ? "up" : p.move < 0 ? "down" : ""}>{p.move > 0 ? "▲" : p.move < 0 ? "▼" : "–"}{p.move !== 0 && Math.abs(p.move) + "%"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
