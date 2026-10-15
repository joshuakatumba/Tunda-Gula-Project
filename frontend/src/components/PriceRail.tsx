import React, { useState, useEffect } from "react";
import { REF_PRICES } from "../data/refPrices";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";

export const PriceRail = ({ t }) => {
  const [prices, setPrices] = useState(REF_PRICES);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api.get(ENDPOINTS.prices)
        .then((data) => {
          if (!alive) return;
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
        .catch(() => { /* keep last known prices */ });

    load();
    const timer = setInterval(load, 30000);
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Ensure plenty of items in each block for wide screens
  const blockItems = [...prices, ...prices];

  return (
    <div className="rail">
      <div className="rail-tag">{t.live} · InfoTrade Connect · wk 29</div>
      <div className="rail-marquee">
        <div className="rail-track">
          <div className="rail-content">
            {blockItems.map((p, i) => (
              <div className="chalk" key={`a-${p.name}-${i}`}>
                <div className="c-name">{p.name} / {p.unit}</div>
                <div className="c-price">
                  {p.price.toLocaleString()}{" "}
                  <span className={p.move > 0 ? "up" : p.move < 0 ? "down" : ""}>
                    {p.move > 0 ? "▲" : p.move < 0 ? "▼" : "–"}
                    {p.move !== 0 && Math.abs(p.move) + "%"}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="rail-content" aria-hidden="true">
            {blockItems.map((p, i) => (
              <div className="chalk" key={`b-${p.name}-${i}`}>
                <div className="c-name">{p.name} / {p.unit}</div>
                <div className="c-price">
                  {p.price.toLocaleString()}{" "}
                  <span className={p.move > 0 ? "up" : p.move < 0 ? "down" : ""}>
                    {p.move > 0 ? "▲" : p.move < 0 ? "▼" : "–"}
                    {p.move !== 0 && Math.abs(p.move) + "%"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
