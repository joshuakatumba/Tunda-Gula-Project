import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import "./styles/tundagula.css";
import { Toaster, toast } from "sonner";

import { STR } from "./data/strings";
import { SEED_LISTINGS, SEED_PLANS, SEED_ORDERS, SEED_PENDING, SEED_DISPUTES } from "./data/seedData";
import { typeLabel } from "./utils/helpers";

import { useAuth } from "./context/AuthContext";
import { api } from "./api/client";
import { ENDPOINTS } from "./api/endpoints";

import { PriceRail } from "./components/PriceRail";
import { MobileNav } from "./components/MobileNav";
import { Sidebar } from "./components/Sidebar";
import { BottomNav } from "./components/BottomNav";
const Landing = React.lazy(() => import("./landing/Landing"));
const Auth = React.lazy(() => import("./auth/Auth"));
const BuyerApp = React.lazy(() => import("./buyer/BuyerApp"));
const SellerApp = React.lazy(() => import("./seller/SellerApp"));
const AdminApp = React.lazy(() => import("./admin/AdminApp"));

const LazyFallback = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 24px" }}>
    <div className="skeleton" style={{ width: "100%", maxWidth: 600, height: 200, borderRadius: "var(--radius-cards)" }} />
  </div>
);

import { Button } from "./components/ui/Button";

export default function App() {
  const { user, logout, loading: authLoading } = useAuth();

  const [screen, setScreen] = useState("landing");
  const [auth, setAuth] = useState(null);
  const [lang, setLang] = useState("en");
  const [tab, setTab] = useState("browse");


  // ── Data state (start with seed data, will be replaced by API calls) ──
  const [listings, setListings] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [commission, setCommission] = useState(7);
  const [depositDefault, setDepositDefault] = useState(30);
  const [sms, setSms] = useState([
    { to: "Seller · David Ssemakula", text: "Order ORD-5514 paid. 200 kg sweet potatoes for Kampala Fresh Mart. Call 0772••882." },
    { to: "Buyer · Nakato Catering", text: "Green peppers harvest moved to 12 Aug. Your 180 kg reservation stands." },
  ]);

  const t = STR[lang];
  const [theme, setTheme] = useState(localStorage.getItem("tg-theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("tg-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === "light" ? "dark" : "light");

  const say = (m: string) => { toast(m, { duration: 2500 }); };
  const pushSms = (to, text) => setSms(s => [{ to, text }, ...s].slice(0, 8));

  // ── Fetch data from API when user logs in ──
  const fetchData = useCallback(async () => {
    try {
      // Listings — public
      const listingsRes = await api.get(ENDPOINTS.listings);
      const apiListings = (listingsRes.results || listingsRes);
      if (Array.isArray(apiListings)) {
        setListings(apiListings.map((l: any) => ({
          id: `L-${l.id}`, seller: l.seller_name, sellerId: `S-${l.seller}`,
          sellerType: "", district: l.district, cat: l.category,
          name: l.name, qty: l.quantity, unit: l.unit, price: l.price,
          rating: l.seller_rating || 0, ratings: l.seller_rating_count || 0,
          verified: l.seller_verified, top: (l.seller_rating >= 4.5 && l.seller_rating_count >= 5),
          voice: l.voice_duration || 0, photos: l.photo_count || 0,
          thumbnail: l.thumbnail || null,
          photos_data: l.photos || [],
          ref: Math.round(l.price * 1.06), note: l.description || "",
        })));
      }
    } catch { /* keep seed data if API fails */ }

    try {
      // Harvest plans — public
      const plansRes = await api.get(ENDPOINTS.plans);
      const apiPlans = (plansRes.results || plansRes);
      if (Array.isArray(apiPlans)) {
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
      if (Array.isArray(apiOrders)) {
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
          thumbnail: o.thumbnail || null,
          cat: o.category || "Vegetables",
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

  const handleTabChange = (newTab: string) => {
    setTab(newTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const signIn = (u?: any) => {
    // Auth context already sets the user — just close the modal
    setAuth(null);
    const displayName = u?.name || user?.name || "back";
    say(`Welcome, ${displayName}`);
  };

  const signOut = () => {
    logout();
    setScreen("landing");
    say("Logged out");
  };

  const SIDEBAR_NAV = {
    buyer: [
      { id: "browse", label: t.browse, icon: "bx-store-alt" },
      { id: "preorders", label: t.harvest, icon: "bx-calendar" },
      { id: "myorders", label: t.myorders, icon: "bx-receipt" }
    ],
    seller: [
      { id: "home", label: t.overview, icon: "bx-home-alt-2" },
      { id: "listings", label: t.listings, icon: "bx-list-ul" },
      { id: "plans", label: t.harvest, icon: "bx-calendar" },
      { id: "sorders", label: t.orders, icon: "bx-package" },
      { id: "sratings", label: t.ratings, icon: "bx-star" },
      { id: "payouts", label: t.payouts, icon: "bx-money" }
    ],
    admin: [
      { id: "overview", label: t.overview, icon: "bx-pie-chart-alt-2" },
      { id: "verify", label: t.verify, icon: "bx-check-shield" },
      { id: "accounts", label: t.accounts, icon: "bx-group" },
      { id: "disputes", label: t.disputes, icon: "bx-error-circle" },
      { id: "adelivery", label: t.delivery, icon: "bx-truck" },
      { id: "areports", label: t.reports, icon: "bx-bar-chart-alt-2" }
    ]
  };

  const BOTTOM_NAV: Record<string, { tabs: { id: string; label: string; icon: string }[]; moreTabs?: { id: string; label: string; icon: string }[] }> = {
    buyer: {
      tabs: [
        { id: "browse", label: t.browse, icon: "bx-store-alt" },
        { id: "preorders", label: t.harvest, icon: "bx-calendar" },
        { id: "myorders", label: t.myorders, icon: "bx-receipt" }
      ]
    },
    seller: {
      tabs: [
        { id: "home", label: t.overview, icon: "bx-home-alt-2" },
        { id: "listings", label: t.listings, icon: "bx-list-ul" },
        { id: "plans", label: t.harvest, icon: "bx-calendar" },
        { id: "sorders", label: t.orders, icon: "bx-package" }
      ],
      moreTabs: [
        { id: "sratings", label: t.ratings, icon: "bx-star" },
        { id: "payouts", label: t.payouts, icon: "bx-money" }
      ]
    },
    admin: {
      tabs: [
        { id: "overview", label: t.overview, icon: "bx-pie-chart-alt-2" },
        { id: "verify", label: t.verify, icon: "bx-check-shield" },
        { id: "accounts", label: t.accounts, icon: "bx-group" },
        { id: "disputes", label: t.disputes, icon: "bx-error-circle" }
      ],
      moreTabs: [
        { id: "adelivery", label: t.delivery, icon: "bx-truck" },
        { id: "areports", label: t.reports, icon: "bx-bar-chart-alt-2" }
      ]
    }
  };


  // Build a session-like object for child components (backward compatible)
  const session = user ? {
    ...user,
    type: user.seller_type || user.buyer_type || null,
  } : null;

  const ctx = useMemo(() => ({ listings, setListings, plans, setPlans, orders, setOrders, pending, setPending, disputes, setDisputes,
    commission, setCommission, depositDefault, setDepositDefault, say, pushSms, sms, t, session, fetchData }),
    [listings, plans, orders, pending, disputes, commission, depositDefault, sms, t, session, fetchData]);

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
          <button onClick={() => setScreen(session ? "app" : "landing")} style={{ textAlign: "left", padding: 0, display: "flex", flexDirection: "column" }}>
            <div className="brand">Tunda<span>Gula</span></div>
            <div className="tagline desktop-only">From farm, to you</div>
          </button>

          {screen === "landing" && (
            <nav className="topbar-nav desktop-only">
              {[["how", t.how], ["who", t.who], ["prices", t.prices]].map(([id, label]) => (
                <a key={id} href={"#" + id}>{label}</a>
              ))}
            </nav>
          )}

          <div className="topbar-actions">
            <button
              onClick={toggleTheme}
              className="tb-ctl tb-icon"
              title="Toggle Theme"
              aria-label="Toggle theme"
            >
              <i className={`bx ${theme === 'dark' ? 'bx-sun' : 'bx-moon'}`} style={{ fontSize: 20 }}></i>
            </button>
            <div className="tb-langs desktop-only">
              {["en", "lg", "sw"].map(l => (
                <button key={l} className={`tb-ctl tb-lang${lang === l ? " on" : ""}`} onClick={() => setLang(l)}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <span className="tb-divider desktop-only"></span>
            {session ? (
              <div className="desktop-only row" style={{ gap: 14 }}>
                <div className="tb-user">
                  <b>{session.name}</b>
                  <span>{session.role === "admin" ? "Administrator" : typeLabel(session.type)}</span>
                </div>
                <Button variant="outline" className="btn-header" onClick={signOut}>{t.logout}</Button>
              </div>
            ) : (
              <div className="desktop-only row" style={{ gap: 12 }}>
                <Button variant="text" className="btn-header" onClick={() => setAuth({ mode: "login" })} style={{ color: 'var(--color-paper)', textDecoration: 'none' }}>{t.login}</Button>
                <Button variant="primary" className="btn-header" onClick={() => setAuth({ mode: "join" })}>{t.join}</Button>
              </div>
            )}
            <MobileNav
              onAuthOpen={() => setAuth({ mode: "login" })}
              lang={lang}
              setLang={setLang}
              tabs={session ? SIDEBAR_NAV[session.role as keyof typeof SIDEBAR_NAV] : undefined}
              activeTab={tab}
              onTabChange={handleTabChange}
            />
          </div>
        </div>
      </header>

      <PriceRail t={t} />

      {screen === "landing" && <Suspense fallback={<LazyFallback />}><Landing t={t} onJoin={(role) => setAuth({ mode: "join", role })} onLogin={() => setAuth({ mode: "login" })} /></Suspense>}

      {screen === "app" && session && (
        <div className="app-layout">
          <Sidebar tabs={SIDEBAR_NAV[session.role as keyof typeof SIDEBAR_NAV]} activeId={tab} onChange={handleTabChange} />
          <div className="shell main-content">
            <Suspense fallback={<LazyFallback />}>
              {session.role === "buyer" && <BuyerApp tab={tab} onTabChange={handleTabChange} {...ctx} />}
              {session.role === "seller" && <SellerApp tab={tab} {...ctx} />}
              {session.role === "admin" && <AdminApp tab={tab} {...ctx} />}
            </Suspense>
          </div>
          {BOTTOM_NAV[session.role] && (
            <BottomNav
              tabs={BOTTOM_NAV[session.role].tabs}
              moreTabs={BOTTOM_NAV[session.role].moreTabs}
              activeId={tab}
              onChange={handleTabChange}
            />
          )}
        </div>
      )}

      <Suspense fallback={null}>
        {auth && <Auth init={auth} onClose={() => setAuth(null)} onDone={signIn} say={say} />}
      </Suspense>
      <Toaster
        position="top-center"
        duration={2500}
        visibleToasts={1}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast: "tg-toast",
            title: "tg-toast-title",
          },
        }}
      />
    </div>
  );
}
