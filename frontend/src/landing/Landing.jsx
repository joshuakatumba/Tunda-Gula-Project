import React from "react";
import { Sprout, ShoppingBasket } from "lucide-react";
import { CATEGORIES, EMOJI, TINT } from "../data/categories";
import { REF_PRICES } from "../data/refPrices";
import { useI18n } from "../context/I18nContext";

export default function Landing({ onJoin, onLogin }) {
  const { t, tp, tu } = useI18n();
  return (
    <>
      <section className="hero">
        <div className="hero-in">
          <div>
            <h1>{t("landing.hero.title")}</h1>
            <p>{t("landing.hero.subtitle")}</p>
            <div className="hero-cta" style={{ alignItems: "center" }}>
              <button className="btn-maize" onClick={() => onJoin("seller")}>{t("landing.hero.sell")}</button>
              <button className="btn-alt" onClick={() => onJoin("buyer")}>{t("landing.hero.buy")}</button>
            </div>
            <div className="hero-stats">
              <div><span>1,240+</span><small>{t("landing.stats.farmers")}</small></div>
              <div><span>10</span><small>{t("landing.stats.districts")}</small></div>
              <div><span>5–8%</span><small>{t("landing.stats.fee")}</small></div>
            </div>
          </div>

          <div className="board">
            <div className="board-h"><span>{t("landing.board.title")}</span><span>UGX</span></div>
            {REF_PRICES.slice(0, 5).map(p => (
              <div className="board-row" key={p.name}>
                <div className="n">{tp(p.name)}<small>/{tu(p.unit)}</small></div>
                <div className="p">
                  {p.price.toLocaleString()}{" "}
                  <span className={p.move > 0 ? "up" : p.move < 0 ? "down" : ""} style={{ fontSize: 12 }}>
                    {p.move > 0 ? "▲" : p.move < 0 ? "▼" : "–"}{p.move !== 0 && `${Math.abs(p.move)}%`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band" id="how">
        <div className="shell" style={{ paddingTop: 40, paddingBottom: 40 }}>
          <div className="sec-head"><h2 style={{ fontSize: 22 }}>{t("landing.how.title")}</h2></div>
          <div className="steps" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {[
              [t("landing.step1.t"), t("landing.step1.d")],
              [t("landing.step2.t"), t("landing.step2.d")],
              [t("landing.step3.t"), t("landing.step3.d")],
            ].map(([h, d]) => (
              <div className="step" key={h}>
                <h3>{h}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" id="who">
        <div className="shell" style={{ paddingTop: 40, paddingBottom: 40 }}>
          <div className="grid g2">
            <div className="door">
              <span className="ic"><Sprout size="1em" /></span>
              <h3>{t("landing.sellers.t")}</h3>
              <p className="hint" style={{ margin: "6px 0 14px" }}>{t("landing.sellers.d")}</p>
              <button className="btn" onClick={() => onJoin("seller")}>{t("landing.sellers.btn")}</button>
            </div>
            <div className="door">
              <span className="ic"><ShoppingBasket size="1em" /></span>
              <h3>{t("landing.buyers.t")}</h3>
              <p className="hint" style={{ margin: "6px 0 14px" }}>{t("landing.buyers.d")}</p>
              <button className="btn" onClick={() => onJoin("buyer")}>{t("landing.buyers.btn")}</button>
            </div>
          </div>
        </div>
      </section>

      <section className="band" id="prices">
        <div className="shell" style={{ paddingTop: 36, paddingBottom: 36 }}>
          <div className="grid g5">
            {CATEGORIES.map(c => (
              <div className="card" key={c} style={{ background: TINT[c], borderColor: "#C9D4BE", textAlign: "center", padding: "18px 12px" }}>
                <div style={{ fontSize: 26 }}>{EMOJI[c]}</div>
                <h3 style={{ marginTop: 6, fontSize: 15 }}>{t(`cat.${c}`)}</h3>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <button className="btn-text" onClick={onLogin} style={{ fontSize: 13, color: "var(--color-slate)" }}>
              {t("landing.staff_login")}
            </button>
          </div>
        </div>
      </section>

      <footer className="foot">
        <div className="shell" style={{ paddingTop: 20, paddingBottom: 20, textAlign: "center", fontSize: 13 }}>
          {t("landing.footer")}
        </div>
      </footer>
    </>
  );
}
