import React, { useState, useEffect, useCallback } from "react";
import "./styles/tundagula.css";

import { STR } from "./data/strings";
import { SEED_LISTINGS, SEED_PLANS, SEED_ORDERS, SEED_PENDING, SEED_DISPUTES } from "./data/seedData";
import { typeLabel } from "./utils/helpers";

import { useAuth } from "./context/AuthContext";
import { api } from "./api/client";
import { ENDPOINTS } from "./api/endpoints";

import { PriceRail } from "./components/PriceRail";
import Landing from "./landing/Landing";
import Auth from "./auth/Auth";
import BuyerApp from "./buyer/BuyerApp";
import SellerApp from "./seller/SellerApp";
import AdminApp from "./admin/AdminApp";

export default function App() {
  const { user, logout, loading: authLoading } = useAuth();

  const [screen, setScreen] = useState("landing");
  const [auth, setAuth] = useState(null);
  const [lang, setLang] = useState("en");
  const [tab, setTab] = useState("browse");
  const [toast, setToast] = useState(null);

  // ── Data state (start with seed data, will be replaced by API calls) ──
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

  // ── Fetch data from API when user logs in ──
  const fetchData = useCallback(async () => {
    try {
      // Listings — public
      const listingsRes = await api.get(ENDPOINTS.listings);
      const apiListings = (listingsRes.results || listingsRes);
      if (Array.isArray(apiListings) && apiListings.length > 0) {
        setListings(apiListings.map((l: any) => ({
          id: `L-${l.id}`, seller: l.seller_name, sellerId: `S-${l.seller}`,
          sellerType: "", district: l.district, cat: l.category,
          name: l.name, qty: l.quantity, unit: l.unit, price: l.price,
          rating: 0, ratings: 0, verified: l.seller_verified, top: false,
          voice: l.voice_duration || 0, photos: l.photo_count || 0,
          ref: Math.round(l.price * 1.06), note: l.description || "",
        })));
      }
    } catch { /* keep seed data if API fails */ }

    try {
      // Harvest plans — public
      const plansRes = await api.get(ENDPOINTS.plans);
      const apiPlans = (plansRes.results || plansRes);
      if (Array.isArray(apiPlans) && apiPlans.length > 0) {
        setPlans(apiPlans.map((p: any) => ({
          id: `H-${p.id}`, seller: p.seller_name, sellerId: `S-${p.seller}`,
          district: p.district, cat: p.category, name: p.name,
          planted: p.date_planted, harvest: p.expected_harvest,
          qty: p.quantity, reserved: p.reserved, unit: p.unit,
          price: p.price, deposit: p.deposit_percentage,
        })));
      }
    } catch { /* keep seed data */ }

    if (!user) return;

    try {
      // Orders — requires auth
      const ordersRes = await api.get(ENDPOINTS.orders);
      const apiOrders = (ordersRes.results || ordersRes);
      if (Array.isArray(apiOrders) && apiOrders.length > 0) {
        setOrders(apiOrders.map((o: any) => ({
          id: `ORD-${o.id}`, type: o.order_type,
          buyer: o.buyer_name, buyerId: `B-${o.buyer}`,
          sellerId: `S-${o.seller}`, seller: o.seller_name,
          item: o.item_name, qty: o.quantity, unit: o.unit,
          price: o.price_per_unit, status: o.status,
          mode: o.delivery_mode || "Motorcycle",
          paid: true, provider: "MTN", rated: !!o.rating,
          stars: o.rating?.stars, placed: o.placed_at,
          depositPct: o.deposit_percentage,
        })));
      }
    } catch { /* keep seed data */ }

    if (user.role === "admin") {
      try {
        const pendingRes = await api.get(ENDPOINTS.pending);
        const apiPending = (pendingRes.results || pendingRes);
        if (Array.isArray(apiPending)) {
          setPending(apiPending.map((s: any) => ({
            id: `S-${s.id}`, name: s.name, type: s.seller_type,
            nin: s.nin, phone: s.phone, district: s.district,
            ninMatch: s.nin_match, otp: s.otp_verified, gps: s.gps_pinned,
            submitted: s.verification_submitted_at,
          })));
        }
      } catch { /* keep seed data */ }

      try {
        const disputesRes = await api.get(ENDPOINTS.disputes);
        const apiDisputes = (disputesRes.results || disputesRes);
        if (Array.isArray(apiDisputes)) {
          setDisputes(apiDisputes.map((d: any) => ({
            id: `D-${d.id}`, order: `ORD-${d.order}`,
            raisedBy: `${d.raised_by_role} · ${d.raised_by_name}`,
            reason: d.reason, value: d.value,
            opened: d.opened_at, status: d.status,
          })));
        }
      } catch { /* keep seed data */ }

      try {
        const settings = await api.get(ENDPOINTS.settings);
        if (settings.commission_rate) setCommission(Number(settings.commission_rate));
        if (settings.default_deposit_percentage) setDepositDefault(settings.default_deposit_percentage);
      } catch { /* keep defaults */ }
    }
  }, [user]);

  // ── Respond to auth state changes ──
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      setScreen("app");
      setTab(user.role === "buyer" ? "browse" : user.role === "seller" ? "home" : "overview");
      fetchData();
    } else {
      setScreen("landing");
    }
  }, [user, authLoading, fetchData]);

  const signIn = () => {
    // Auth context already sets the user — just close the modal
    setAuth(null);
    say(`Welcome, ${user?.name || "back"}`);
  };

  const signOut = () => {
    logout();
    setScreen("landing");
    say("Logged out");
  };

  const NAV = {
    buyer: [["browse", t.browse], ["preorders", t.harvest], ["myorders", t.myorders]],
    seller: [["home", t.overview], ["listings", t.listings], ["plans", t.harvest], ["sorders", t.orders], ["sratings", t.ratings], ["payouts", t.payouts]],
    admin: [["overview", t.overview], ["verify", t.verify], ["accounts", t.accounts], ["disputes", t.disputes], ["adelivery", t.delivery], ["areports", t.reports]],
  };

  // Build a session-like object for child components (backward compatible)
  const session = user ? {
    ...user,
    type: user.seller_type || user.buyer_type || null,
  } : null;

  const ctx = { listings, setListings, plans, setPlans, orders, setOrders, pending, setPending, disputes, setDisputes,
    commission, setCommission, depositDefault, setDepositDefault, say, pushSms, sms, t, session, fetchData };

  if (authLoading) {
    return (
      <div className="tg" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="brand">Tunda<span>Gula</span></div>
          <p className="hint" style={{ marginTop: 12 }}>Loading…</p>
        </div>
      </div>
    );
  }

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
                <a key={id} href={"#" + id} className="link" style={{ fontSize: 13, textDecoration: "none", color: "var(--mute)" }}>{label}</a>
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
                <button className="btn-alt btn-sm" onClick={signOut}>{t.logout}</button>
              </>
            ) : (
              <>
                <button className="btn-alt btn-sm" onClick={() => setAuth({ mode: "login" })}>{t.login}</button>
                <button className="btn-maize btn-sm" onClick={() => setAuth({ mode: "join" })}>{t.join}</button>
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
