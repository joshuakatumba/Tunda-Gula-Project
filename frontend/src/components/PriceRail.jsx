import React, { useState, useEffect } from "react";
import { REF_PRICES } from "../data/refPrices";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { useI18n } from "../context/I18nContext";

export const PriceRail = () => {
  const { t, tp, tu } = useI18n();
  const [prices, setPrices] = useState(REF_PRICES);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api
        .get(ENDPOINTS.prices)
        .then((data) => {
          if (!alive) return;
          const items = Array.isArray(data) ? data : data.results || [];
          if (items.length > 0) {
            setPrices(
              items.map((p) => ({
                name: p.name,
                unit: p.unit,
                price: p.price,
                move: p.week_change ?? 0,
              }))
            );
          }
        })
        .catch(() => {});
    load();
    const timer = setInterval(load, 30000);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const blockItems = [...prices, ...prices];
  const renderItems = (prefix) =>
    blockItems.map((p, i) => (
      <div className="chalk" key={`${prefix}-${p.name}-${i}`}>
        <div className="c-name">
          {tp(p.name)} / {tu(p.unit)}
        </div>
        <div className="c-price">
          {p.price.toLocaleString()}{" "}
          <span className={p.move > 0 ? "up" : p.move < 0 ? "down" : ""}>
            {p.move > 0 ? "▲" : p.move < 0 ? "▼" : "–"}
            {p.move !== 0 && `${Math.abs(p.move)}%`}
          </span>
        </div>
      </div>
    ));

  return (
    <div className="rail">
      <div className="rail-tag">{t("rail.live")}</div>
      <div className="rail-marquee">
        <div className="rail-track">
          <div className="rail-content">{renderItems("a")}</div>
          <div className="rail-content" aria-hidden="true">
            {renderItems("b")}
          </div>
        </div>
      </div>
    </div>
  );
};
