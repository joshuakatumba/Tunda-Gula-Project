import React from "react";
import { Sprout, ShoppingBasket } from "lucide-react";
import { CATEGORIES, EMOJI, TINT, CAT_EG } from "../data/categories";
import { SELLER_TYPES, BUYER_TYPES } from "../data/userTypes";
import { REF_PRICES } from "../data/refPrices";

export default function Landing({ t, onJoin, onLogin }) {
  return (
    <>
      <section className="hero">
        <div className="hero-in">
          <div>
            <div className="eyebrow" style={{ color: "#94A3B8" }}>Uganda's open agricultural marketplace</div>
            <h1>One marketplace<br />for Uganda's <em>food</em>.</h1>
            <p>Farmers list what they grow. Buyers buy it straight from them. No line of middlemen in between, and the price everyone is working from is on the screen for both sides to see.</p>
            <div className="hero-cta">
              <button className="btn-maize" onClick={() => onJoin("seller")}>I am selling produce</button>
              <button className="btn-alt" style={{ borderColor: "rgba(255,255,255,0.4)", color: "#FFF" }} onClick={() => onJoin("buyer")}>I am buying produce</button>
            </div>
            <div className="hero-stats">
              <div><span>1,240+</span><small>verified farmers</small></div>
              <div><span>10</span><small>districts served</small></div>
              <div><span>5–8%</span><small>commission, nothing hidden</small></div>
            </div>
          </div>

          <div className="board">
            <div className="board-h"><span>Today at the market</span><span>19 Jul 2026</span></div>
            {REF_PRICES.slice(0, 5).map(p => (
              <div className="board-row" key={p.name}>
                <div className="n">{p.name}<small>per {p.unit}</small></div>
                <div className="p">{p.price.toLocaleString()}{" "}
                  <span className={p.move > 0 ? "up" : p.move < 0 ? "down" : ""} style={{ fontSize: 12 }}>
                    {p.move > 0 ? "▲" : p.move < 0 ? "▼" : "–"}{p.move !== 0 && Math.abs(p.move) + "%"}
                  </span>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 12, fontSize: 11, color: "#94A3B8", lineHeight: 1.5 }}>
              Reference prices from InfoTrade Connect and the WFP food price database, refreshed every week.
            </div>
          </div>
        </div>
      </section>

      {/* about */}
      <section className="sec" id="about">
        <div className="shell" style={{ paddingBottom: 0 }}>
          <div className="sec-head">
            <div className="eyebrow">What TundaGula is</div>
            <h2 style={{ fontSize: 27 }}>A farmer sells. A buyer buys. Nobody in between takes the difference.</h2>
            <p className="lede">
              For most food grown in Uganda, the person who grew it never meets the person who eats it. Traders in between
              set the farmgate price, and the farmer takes what is offered. TundaGula puts both sides on one platform:
              any verified farmer can list, any verified buyer can order, and the platform takes a small commission
              on completed trades instead of a cut of the margin.
            </p>
            <p className="lede">
              It works on a normal phone browser, in English, Luganda or Swahili, and a farmer who cannot type can
              record a voice note instead. Payment is mobile money. Money reaches the farmer once the buyer confirms
              the produce arrived.
            </p>
          </div>
          <div className="grid g4">
            {[["Price you can see", "This week's market reference sits next to every listing, so neither side is guessing."],
              ["Verified people", "Every farmer is checked against their national ID and their phone registration before they can sell."],
              ["Sell before harvest", "Post what is still in the ground. Buyers reserve it with a deposit, so income is known early."],
              ["Less waste", "Matching demand to supply before picking means less produce rotting at the farm gate."]].map(([h, d]) => (
              <div className="card" key={h}><h3>{h}</h3><p className="lede" style={{ fontSize: 13, marginTop: 7 }}>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="sec" id="how" style={{ background: "var(--leaf2)" }}>
        <div className="shell">
          <div className="sec-head"><div className="eyebrow">{t.how}</div><h2 style={{ fontSize: 25 }}>Four steps, in order</h2>
            <p className="lede">Numbered because it really is a sequence — nothing moves to the next step until the one before it is done.</p></div>
          <div className="grid g4" style={{ gap: 0, borderLeft: "1px solid var(--line)" }}>
            {[["Register and get verified", "National ID checked against your phone registration. Farm pinned on the map. Takes under a day."],
              ["List, or say it out loud", "Photos, quantity, price. If writing is hard, record a voice note instead."],
              ["Buyer orders and pays", "MTN or Airtel Mobile Money. The money is held until the produce arrives."],
              ["Deliver, confirm, get paid", "Buyer confirms receipt, payout lands on your mobile money, buyer rates you."]].map(([h, d], i) => (
              <div className="card" style={{ borderLeft: 0, borderTop: 0, borderRadius: 0, boxShadow: "none" }} key={h}><div className="mono" style={{ color: "var(--murram)", fontSize: 11, marginBottom: 12, fontWeight: 700 }}>STEP {String(i + 1).padStart(2, "0")}</div><h3>{h}</h3><p className="lede" style={{ fontSize: 13, marginTop: 8 }}>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* who it's for */}
      <section className="sec" id="who">
        <div className="shell" style={{ paddingBottom: 0 }}>
          <div className="sec-head"><div className="eyebrow">{t.who}</div><h2 style={{ fontSize: 25 }}>Pick the door that fits you</h2>
            <p className="lede">Each account type gets its own tools. You choose the type when you register — it decides what your dashboard does.</p></div>
          <div className="grid g2">
            <div className="door">
              <span className="ic"><Sprout size="1em" /></span>
              <div><h3>Sellers</h3><p className="lede" style={{ fontSize: 13 }}>You grow it or you gather it. You list, price it, and deliver.</p></div>
              <ul>{SELLER_TYPES.map(s => <li key={s.id}>{s.t}</li>)}</ul>
              <button className="btn" onClick={() => onJoin("seller")}>Register as a seller</button>
            </div>
            <div className="door">
              <span className="ic"><ShoppingBasket size="1em" /></span>
              <div><h3>Buyers</h3><p className="lede" style={{ fontSize: 13 }}>You need food, in a small basket or by the truck.</p></div>
              <ul>{BUYER_TYPES.map(s => <li key={s.id}>{s.t}</li>)}</ul>
              <button className="btn" onClick={() => onJoin("buyer")}>Register as a buyer</button>
            </div>
          </div>
          <div className="card" style={{ marginTop: 20 }}>
            <div className="between">
              <div><h3>TundaGula staff</h3><p className="lede" style={{ fontSize: 13, marginTop: 5 }}>Verification, disputes, account management and platform reporting.</p></div>
              <button className="btn-alt" onClick={onLogin}>Staff log in</button>
            </div>
          </div>
        </div>
      </section>

      {/* categories */}
      <section className="sec" id="prices" style={{ background: "var(--leaf2)" }}>
        <div className="shell">
          <div className="sec-head"><div className="eyebrow">On the market</div><h2 style={{ fontSize: 25 }}>What is traded here</h2></div>
          <div className="grid g5">
            {CATEGORIES.map(c => (
              <div className="card" key={c} style={{ background: `linear-gradient(to bottom right, #FFF, ${TINT[c]}40)` }}>
                <div style={{ fontSize: 32 }}>{EMOJI[c]}</div>
                <h3 style={{ marginTop: 12 }}>{c}</h3>
                <p className="hint" style={{ marginTop: 6, lineHeight: 1.5 }}>{CAT_EG[c]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="shell" style={{ textAlign: "center", paddingBottom: 0 }}>
          <h2 style={{ fontSize: 36 }}>Ready to sell what you grew?</h2>
          <p className="lede" style={{ margin: "16px auto 32px" }}>Registration needs your national ID, the phone number it is registered on, and your farm location. Nothing else.</p>
          <div className="row" style={{ justifyContent: "center" }}>
            <button className="btn-maize" onClick={() => onJoin("seller")}>Start selling</button>
            <button className="btn-alt" onClick={() => onJoin("buyer")}>Start buying</button>
          </div>
        </div>
      </section>

      <footer className="foot">
        <div className="foot-in">
          <div>
            <div className="brand" style={{ color: "#FFF" }}>Tunda<span>Gula</span></div>
            <div style={{ marginTop: 12, maxWidth: "38ch", lineHeight: 1.6 }}>Uganda's open agricultural marketplace. Kampala and the Central region, expanding.</div>
          </div>
          <div style={{ lineHeight: 2 }}>
            <div style={{ color: "#FFF", fontWeight: 700, marginBottom: 8 }}>Platform</div>
            How it works<br />Produce categories<br />Market prices<br />Farmer guide
          </div>
          <div style={{ lineHeight: 2 }}>
            <div style={{ color: "#FFF", fontWeight: 700, marginBottom: 8 }}>Legal</div>
            Terms of service<br />Privacy policy<br />Data Protection Act, 2019<br />Complaints
          </div>
        </div>
        <div className="foot-in" style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 12 }}>
          <span>© 2026 TundaGula Limited.</span>
          <span className="mono" style={{ color: "var(--mute)" }}>English · Luganda · Swahili</span>
        </div>
      </footer>
    </>
  );
}
