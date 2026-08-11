import React, { useState } from "react";
import "./styles/tundagula.css";

import { STR } from "./data/strings";
import { SEED_LISTINGS, SEED_PLANS, SEED_ORDERS, SEED_PENDING, SEED_DISPUTES } from "./data/seedData";
import { typeLabel } from "./utils/helpers";

import { PriceRail } from "./components/PriceRail";
import Landing from "./landing/Landing";
import Auth from "./auth/Auth";
import BuyerApp from "./buyer/BuyerApp";
import SellerApp from "./seller/SellerApp";
import AdminApp from "./admin/AdminApp";

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [session, setSession] = useState(null);
  const [auth, setAuth] = useState(null);
  const [lang, setLang] = useState("en");
  const [tab, setTab] = useState("browse");
  const [toast, setToast] = useState(null);

  const [listings, setListings] = useState(SEED_LISTINGS);
  const [plans, setPlans] = useState(SEED_PLANS);
  const [orders, setOrders] = useState(SEED_ORDERS);
  const [pending, setPending] = useState(SEED_PENDING);
  const [disputes, setDisputes] = useState(SEED_DISPUTES);
  const [commission, setCommission] = useState(7);
  const [depositDefault, setDepositDefault] = useState(30);
  const [sms, setSms] = useState([
    { to: "Seller · David Ssemakula", text: "Order ORD-5514 paid. 200 kg sweet potatoes for Kampala Fresh Mart. Call 0772••882." },
    { to: "Buyer · Nakato Catering", text: "Green peppers harvest moved to 12 Aug. Your 180 kg reservation stands." },
  ]);

  const t = STR[lang];
  const say = (m) => { setToast(m); setTimeout(() => setToast(null), 2800); };
  const pushSms = (to, text) => setSms(s => [{ to, text }, ...s].slice(0, 8));

  const signIn = (s) => {
    setSession(s); setAuth(null); setScreen("app");
    setTab(s.role === "buyer" ? "browse" : s.role === "seller" ? "home" : "overview");
    say(`Welcome, ${s.name}`);
  };
  const signOut = () => { setSession(null); setScreen("landing"); say("Logged out"); };

  const NAV = {
    buyer: [["browse", t.browse], ["preorders", t.harvest], ["myorders", t.myorders]],
    seller: [["home", t.overview], ["listings", t.listings], ["plans", t.harvest], ["sorders", t.orders], ["sratings", t.ratings], ["payouts", t.payouts]],
    admin: [["overview", t.overview], ["verify", t.verify], ["accounts", t.accounts], ["disputes", t.disputes], ["adelivery", t.delivery], ["areports", t.reports]],
  };

  const ctx = { listings, setListings, plans, setPlans, orders, setOrders, pending, setPending, disputes, setDisputes,
    commission, setCommission, depositDefault, setDepositDefault, say, pushSms, sms, t, session };

  return (
    <div className="tg">
      <header className="topbar">
        <div className="topbar-in">
          <button onClick={() => setScreen(session ? "app" : "landing")} style={{ textAlign: "left" }}>
            <div className="brand">Tunda<span>Gula</span></div>
            <div className="tagline">From farm, to you</div>
          </button>

          {screen === "landing" && (
            <div className="row" style={{ gap: 18, marginLeft: 24 }}>
              {[["how", t.how], ["who", t.who], ["prices", t.prices]].map(([id, label]) => (
                <a key={id} href={"#" + id} style={{ fontSize: 13, color: "#B7C7B9", textDecoration: "none" }}>{label}</a>
              ))}
            </div>
          )}

          <div className="row" style={{ marginLeft: "auto", gap: 10 }}>
            <div className="lang">{["en", "lg", "sw"].map(l =>
              <button key={l} className={lang === l ? "on" : ""} onClick={() => setLang(l)}>{l.toUpperCase()}</button>)}
            </div>
            {session ? (
              <>
                <div className="who"><b>{session.name}</b>{session.role === "admin" ? "Administrator" : typeLabel(session.type)}</div>
                <button className="btn-sm" style={{ background: "transparent", color: "#F3F6EE", borderColor: "#3C5347" }} onClick={signOut}>{t.logout}</button>
              </>
            ) : (
              <>
                <button className="btn-sm" style={{ background: "transparent", color: "#F3F6EE", borderColor: "#3C5347" }} onClick={() => setAuth({ mode: "login" })}>{t.login}</button>
                <button className="btn-maize" style={{ padding: "8px 14px" }} onClick={() => setAuth({ mode: "join" })}>{t.join}</button>
              </>
            )}
          </div>
        </div>
      </header>

      <PriceRail t={t} />

      {screen === "landing" && <Landing t={t} onJoin={(role) => setAuth({ mode: "join", role })} onLogin={() => setAuth({ mode: "login" })} />}

      {screen === "app" && session && (
        <div className="shell">
          <nav className="nav">
            {NAV[session.role].map(([k, label]) => (
              <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{label}</button>
            ))}
          </nav>
          {session.role === "buyer" && <BuyerApp tab={tab} {...ctx} />}
          {session.role === "seller" && <SellerApp tab={tab} {...ctx} />}
          {session.role === "admin" && <AdminApp tab={tab} {...ctx} />}
        </div>
      )}

      {auth && <Auth init={auth} onClose={() => setAuth(null)} onDone={signIn} say={say} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
