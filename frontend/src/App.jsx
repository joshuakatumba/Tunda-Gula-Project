import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import "./styles/tundagula.css";
import { Toaster, toast } from "sonner";
import { typeLabel } from "./utils/helpers";
import { useAuth } from "./context/AuthContext";
import { useI18n } from "./context/I18nContext";
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
  <div className="shell" style={{ padding: "24px 16px" }}>
    <div className="skeleton" style={{ width: 180, height: 26, marginBottom: 20 }} />
    <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="skeleton" style={{ height: 120, borderRadius: 0 }} />
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="skeleton" style={{ width: "70%", height: 14 }} />
            <div className="skeleton" style={{ width: "45%", height: 12 }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);
import { Button } from "./components/ui/Button";
export default function App() {
  const { user, logout, loading: authLoading } = useAuth();
  const { lang, setLang, t } = useI18n();
  const [screen, setScreen] = useState("landing");
  const [auth, setAuth] = useState(null);
  const [tab, setTab] = useState("browse");
  const [listings, setListings] = useState([]);
  const [plans, setPlans] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pending, setPending] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [commission, setCommission] = useState(7);
  const [depositDefault, setDepositDefault] = useState(30);
  const [sms, setSms] = useState([
    { to: "Seller \xB7 David Ssemakula", text: "Order ORD-5514 paid. 200 kg sweet potatoes for Kampala Fresh Mart. Call 0772\u2022\u2022882." },
    { to: "Buyer \xB7 Nakato Catering", text: "Green peppers harvest moved to 12 Aug. Your 180 kg reservation stands." }
  ]);
  const [theme, setTheme] = useState(localStorage.getItem("tg-theme") || "light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("tg-theme", theme);
  }, [theme]);
  const toggleTheme = () => setTheme((prev) => prev === "light" ? "dark" : "light");
  const say = (m) => {
    toast(m, { duration: 2500 });
  };
  const pushSms = (to, text) => setSms((s) => [{ to, text }, ...s].slice(0, 8));
  const [dataLoading, setDataLoading] = useState(false);
  const fetchData = useCallback(async () => {
    setDataLoading(true);
    try {
      const listingsRes = await api.get(ENDPOINTS.listings);
      const apiListings = listingsRes.results || listingsRes;
      if (Array.isArray(apiListings)) {
        setListings(apiListings.map((l) => ({
          id: `L-${l.id}`,
          seller: l.seller_name,
          sellerId: `S-${l.seller}`,
          sellerType: "",
          district: l.district,
          cat: l.category,
          name: l.name,
          qty: l.quantity,
          unit: l.unit,
          price: l.price,
          rating: l.seller_rating || 0,
          ratings: l.seller_rating_count || 0,
          verified: l.seller_verified,
          top: l.seller_rating >= 4.5 && l.seller_rating_count >= 5,
          voice: l.voice_duration || 0,
          photos: l.photo_count || 0,
          thumbnail: l.thumbnail || null,
          photos_data: l.photos || [],
          ref: Math.round(l.price * 1.06),
          note: l.description || ""
        })));
      }
    } catch {
    }
    try {
      const plansRes = await api.get(ENDPOINTS.plans);
      const apiPlans = plansRes.results || plansRes;
      if (Array.isArray(apiPlans)) {
        setPlans(apiPlans.map((p) => ({
          id: `H-${p.id}`,
          seller: p.seller_name,
          sellerId: `S-${p.seller}`,
          district: p.district,
          cat: p.category,
          name: p.name,
          planted: p.date_planted,
          harvest: p.expected_harvest,
          qty: p.quantity,
          reserved: p.reserved,
          unit: p.unit,
          price: p.price,
          deposit: p.deposit_percentage
        })));
      }
    } catch {
    }
    if (!user) return;
    try {
      const ordersRes = await api.get(ENDPOINTS.orders);
      const apiOrders = ordersRes.results || ordersRes;
      if (Array.isArray(apiOrders)) {
        setOrders(apiOrders.map((o) => ({
          id: `ORD-${o.id}`,
          type: o.order_type,
          buyer: o.buyer_name,
          buyerId: `B-${o.buyer}`,
          sellerId: `S-${o.seller}`,
          seller: o.seller_name,
          item: o.item_name,
          qty: o.quantity,
          unit: o.unit,
          price: o.price_per_unit,
          status: o.status,
          mode: o.delivery_mode || "Motorcycle",
          paid: true,
          provider: "MTN",
          rated: !!o.rating,
          stars: o.rating?.stars,
          placed: o.placed_at,
          depositPct: o.deposit_percentage,
          thumbnail: o.thumbnail || null,
          cat: o.category || "Vegetables"
        })));
      }
    } catch {
    }
    if (user.role === "admin") {
      try {
        const pendingRes = await api.get(ENDPOINTS.pending);
        const apiPending = pendingRes.results || pendingRes;
        if (Array.isArray(apiPending)) {
          setPending(apiPending.map((s) => ({
            id: `S-${s.id}`,
            name: s.name,
            type: s.seller_type,
            nin: s.nin,
            phone: s.phone,
            district: s.district,
            ninMatch: s.nin_match,
            otp: s.otp_verified,
            gps: s.gps_pinned,
            submitted: s.verification_submitted_at
          })));
        }
      } catch {
      }
      try {
        const disputesRes = await api.get(ENDPOINTS.disputes);
        const apiDisputes = disputesRes.results || disputesRes;
        if (Array.isArray(apiDisputes)) {
          setDisputes(apiDisputes.map((d) => ({
            id: `D-${d.id}`,
            order: `ORD-${d.order}`,
            raisedBy: `${d.raised_by_role} \xB7 ${d.raised_by_name}`,
            reason: d.reason,
            value: d.value,
            opened: d.opened_at,
            status: d.status
          })));
        }
      } catch {
      }
      try {
        const settings = await api.get(ENDPOINTS.settings);
        if (settings.commission_rate) setCommission(Number(settings.commission_rate));
        if (settings.default_deposit_percentage) setDepositDefault(settings.default_deposit_percentage);
      } catch {
      }
    }
    setDataLoading(false);
  }, [user]);
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
  const handleTabChange = (newTab) => {
    setTab(newTab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const signIn = (u) => {
    setAuth(null);
    const displayName = u?.name || user?.name || "";
    say(t("toast.welcome", { name: displayName }));
  };
  const signOut = () => {
    logout();
    setScreen("landing");
    say(t("nav.logged_out"));
  };
  const SIDEBAR_NAV = {
    buyer: [
      { id: "browse", label: t("nav.browse"), icon: "bx-store-alt" },
      { id: "preorders", label: t("nav.harvest"), icon: "bx-calendar" },
      { id: "myorders", label: t("nav.myorders"), icon: "bx-receipt" }
    ],
    seller: [
      { id: "home", label: t("nav.overview"), icon: "bx-home-alt-2" },
      { id: "listings", label: t("nav.listings"), icon: "bx-list-ul" },
      { id: "plans", label: t("nav.harvest"), icon: "bx-calendar" },
      { id: "sorders", label: t("nav.orders"), icon: "bx-package" },
      { id: "sratings", label: t("nav.ratings"), icon: "bx-star" },
      { id: "payouts", label: t("nav.payouts"), icon: "bx-money" },
      { id: "records", label: t("nav.records"), icon: "bx-book-open" }
    ],
    admin: [
      { id: "overview", label: t("nav.overview"), icon: "bx-pie-chart-alt-2" },
      { id: "verify", label: t("nav.verify"), icon: "bx-check-shield" },
      { id: "accounts", label: t("nav.accounts"), icon: "bx-group" },
      { id: "disputes", label: t("nav.disputes"), icon: "bx-error-circle" },
      { id: "adelivery", label: t("nav.delivery"), icon: "bx-truck" },
      { id: "areports", label: t("nav.reports"), icon: "bx-bar-chart-alt-2" }
    ]
  };
  const BOTTOM_NAV = {
    buyer: {
      tabs: [
        { id: "browse", label: t("nav.browse"), icon: "bx-store-alt" },
        { id: "preorders", label: t("nav.harvest"), icon: "bx-calendar" },
        { id: "myorders", label: t("nav.myorders"), icon: "bx-receipt" }
      ]
    },
    seller: {
      tabs: [
        { id: "home", label: t("nav.overview"), icon: "bx-home-alt-2" },
        { id: "listings", label: t("nav.listings"), icon: "bx-list-ul" },
        { id: "plans", label: t("nav.harvest"), icon: "bx-calendar" },
        { id: "sorders", label: t("nav.orders"), icon: "bx-package" }
      ],
      moreTabs: [
        { id: "sratings", label: t("nav.ratings"), icon: "bx-star" },
        { id: "payouts", label: t("nav.payouts"), icon: "bx-money" },
        { id: "records", label: t("nav.records"), icon: "bx-book-open" }
      ]
    },
    admin: {
      tabs: [
        { id: "overview", label: t("nav.overview"), icon: "bx-pie-chart-alt-2" },
        { id: "verify", label: t("nav.verify"), icon: "bx-check-shield" },
        { id: "accounts", label: t("nav.accounts"), icon: "bx-group" },
        { id: "disputes", label: t("nav.disputes"), icon: "bx-error-circle" }
      ],
      moreTabs: [
        { id: "adelivery", label: t("nav.delivery"), icon: "bx-truck" },
        { id: "areports", label: t("nav.reports"), icon: "bx-bar-chart-alt-2" }
      ]
    }
  };
  const session = user ? {
    ...user,
    type: user.seller_type || user.buyer_type || null
  } : null;
  const ctx = useMemo(
    () => ({
      listings,
      setListings,
      plans,
      setPlans,
      orders,
      setOrders,
      pending,
      setPending,
      disputes,
      setDisputes,
      commission,
      setCommission,
      depositDefault,
      setDepositDefault,
      say,
      pushSms,
      sms,
      t,
      session,
      fetchData,
      dataLoading
    }),
    [listings, plans, orders, pending, disputes, commission, depositDefault, sms, t, session, fetchData, dataLoading]
  );
  const nextLang = lang === "en" ? "lg" : lang === "lg" ? "sw" : "en";
  const roleLabel = session ? (session.role === "admin" ? t("nav.role.admin") : session.role === "seller" ? t("nav.role.seller") : t("nav.role.buyer")) : "";
  if (authLoading) {
    return (
      <div className="tg" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div className="brand">Tunda<span>Gula</span></div>
          <div style={{ width: 24, height: 24, border: "3px solid var(--color-fog)", borderTopColor: "var(--color-forest-ink)", borderRadius: "50%" }} className="spin" />
        </div>
      </div>
    );
  }
  return <div className="tg"><header className="topbar"><div className="topbar-in"><button className="brand-btn" onClick={() => setScreen(session ? "app" : "landing")}><div className="brand">Tunda<span>Gula</span></div><div className="tagline desktop-only">{t("nav.tagline")}</div></button>{screen === "landing" && <nav className="topbar-nav desktop-only">{[["how", t("nav.how")], ["who", t("nav.who")], ["prices", t("nav.prices")]].map(([id, label]) => <a key={id} href={"#" + id}>{label}</a>)}</nav>}<div className="topbar-actions"><button
    onClick={toggleTheme}
    className="tb-ctl tb-icon"
    title={t("common.toggle_theme")}
    aria-label={t("common.toggle_theme")}
  ><i className={`bx ${theme === "dark" ? "bx-sun" : "bx-moon"}`} style={{ fontSize: 20 }} /></button><button
    className="tb-ctl tb-lang mobile-only"
    onClick={() => setLang(nextLang)}
    title={t("nav.language")}
    aria-label={t("nav.language")}
  >{lang.toUpperCase()}</button><div className="tb-langs desktop-only">{["en", "lg", "sw"].map((l) => <button key={l} className={`tb-ctl tb-lang${lang === l ? " on" : ""}`} onClick={() => setLang(l)}>{l.toUpperCase()}</button>)}</div><span className="tb-divider desktop-only" />{session ? <div className="desktop-only row" style={{ gap: 14 }}><div className="tb-user"><b>{session.name}</b><span>{roleLabel}</span></div><Button variant="outline" className="btn-header" onClick={signOut}>{t("nav.logout")}</Button></div> : <div className="desktop-only row" style={{ gap: 12 }}><Button variant="text" className="btn-header" onClick={() => setAuth({ mode: "login" })} style={{ color: "var(--color-paper)", textDecoration: "none" }}>{t("nav.login")}</Button><Button variant="primary" className="btn-header" onClick={() => setAuth({ mode: "join" })}>{t("nav.join")}</Button></div>}<MobileNav
    onAuthOpen={() => setAuth({ mode: "login" })}
    lang={lang}
    setLang={setLang}
    tabs={session ? SIDEBAR_NAV[session.role] : void 0}
    activeTab={tab}
    onTabChange={handleTabChange}
  /></div></div></header><PriceRail t={t} />{screen === "landing" && <Suspense fallback={<LazyFallback />}><Landing t={t} onJoin={(role) => setAuth({ mode: "join", role })} onLogin={() => setAuth({ mode: "login" })} /></Suspense>}{screen === "app" && session && <div className="app-layout"><Sidebar tabs={SIDEBAR_NAV[session.role]} activeId={tab} onChange={handleTabChange} /><div className="shell main-content">{dataLoading && listings.length === 0 && orders.length === 0 ? <LazyFallback /> : <Suspense fallback={<LazyFallback />}>{session.role === "buyer" && <BuyerApp tab={tab} onTabChange={handleTabChange} {...ctx} />}{session.role === "seller" && <SellerApp tab={tab} {...ctx} />}{session.role === "admin" && <AdminApp tab={tab} {...ctx} />}</Suspense>}</div>{BOTTOM_NAV[session.role] && <BottomNav
    tabs={BOTTOM_NAV[session.role].tabs}
    moreTabs={BOTTOM_NAV[session.role].moreTabs}
    activeId={tab}
    onChange={handleTabChange}
  />}</div>}<Suspense fallback={null}>{auth && <Auth init={auth} onClose={() => setAuth(null)} onDone={signIn} say={say} />}</Suspense><Toaster
    position="top-center"
    duration={2500}
    visibleToasts={1}
    toastOptions={{
      unstyled: true,
      classNames: {
        toast: "tg-toast",
        title: "tg-toast-title"
      }
    }}
  /></div>;
}
