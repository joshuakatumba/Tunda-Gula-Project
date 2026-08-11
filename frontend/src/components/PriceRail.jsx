import React from "react";
import { REF_PRICES } from "../data/refPrices";

export const PriceRail = ({ t }) => (
  <div className="rail"><div className="rail-in">
    <div className="rail-tag">{t.live} · InfoTrade Connect · wk 29</div>
    {REF_PRICES.map(p => (
      <div className="chalk" key={p.name}>
        <div className="c-name">{p.name} / {p.unit}</div>
        <div className="c-price">{p.price.toLocaleString()}{" "}
          <span className={p.move > 0 ? "up" : p.move < 0 ? "down" : ""}>{p.move > 0 ? "▲" : p.move < 0 ? "▼" : "–"}{p.move !== 0 && Math.abs(p.move) + "%"}</span>
        </div>
      </div>
    ))}
  </div></div>
);
