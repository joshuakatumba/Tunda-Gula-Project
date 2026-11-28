import { useState, useCallback, useMemo, useEffect } from "react";
import { ugx, dshort } from "../utils/helpers";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { formatApiError } from "../utils/errorHandler";
import { clearCache } from "../utils/apiCache";
import Marketplace from "./Marketplace";
import ListingDetail from "./ListingDetail";
import PreOrders from "./PreOrders";
import MyOrders from "./MyOrders";
import Checkout from "./Checkout";
import PreorderModal from "./PreorderModal";
import RateModal from "./RateModal";
import { useI18n } from "../context/I18nContext";
export default function BuyerApp(props) {
  const { tab, onTabChange, listings, setListings, plans, setPlans, orders, setOrders, commission, say, pushSms, session, fetchData } = props;
  const { t, tp, tu } = useI18n();
  const [open, setOpen] = useState(null);
  const [cart, setCart] = useState([]);
  const [checkout, setCheckout] = useState(false);
  const [preordering, setPreordering] = useState(null);
  const [rating, setRating] = useState(null);
  const [f, setF] = useState({ q: "", cat: "All", district: "All", max: "", minRating: 0, sort: "relevance" });
  useEffect(() => {
    setOpen(null);
  }, [tab]);
  const myOrders = useMemo(() => orders.filter((o) => o.buyerId === `B-${session?.id}` || o.buyerId === "B-01"), [orders, session?.id]);
  const cartTotal = useMemo(() => cart.reduce((s, c) => s + c.qty * c.price, 0), [cart]);
  const addToCart = useCallback((l, qty) => {
    setCart((c) => {
      const has = c.find((x) => x.id === l.id);
      return has ? c.map((x) => x.id === l.id ? { ...x, qty: x.qty + qty } : x) : [...c, { ...l, qty }];
    });
    say(t("toast.added_basket", { qty, unit: tu(l.unit), name: tp(l.name) }));
  }, [say, t, tp, tu]);
  const pay = useCallback(async ({ provider = "MTN", phone, deliveryMode = "Motorcycle" } = {}) => {
    try {
      const buyerPhone = phone || session?.phone || "0772000000";
      const batchRes = await api.post(ENDPOINTS.batchCheckout, {
        delivery_mode: deliveryMode,
        items: cart.map((c) => ({
          listing: Number(String(c.id).replace("L-", "")),
          quantity: c.qty,
        })),
      });
      for (const ord of (batchRes?.orders || [])) {
        await api.post(ENDPOINTS.initiate, {
          order: ord.id,
          provider,
          phone: buyerPhone,
          amount: ord.total + (ord.delivery_fee || 0),
        });
      }
      say(t("toast.paid_order", { amount: ugx(batchRes?.total_amount ?? cartTotal), provider }));
      setCart([]);
      setCheckout(false);
      setOpen(null);
      clearCache();
      if (fetchData) await fetchData();
      if (onTabChange) onTabChange("myorders");
    } catch (err) {
      say(formatApiError(err));
      throw err;
    }
  }, [cart, session, fetchData, say, cartTotal, onTabChange, t]);
  const raiseDispute = useCallback(async (o, reason) => {
    try {
      const orderId = Number(String(o.id).replace("ORD-", "").replace("PRE-", ""));
      await api.post(ENDPOINTS.disputes, {
        order: orderId,
        reason,
        value: o.qty * o.price,
      });
      say(t("toast.dispute_submitted"));
      if (fetchData) await fetchData();
    } catch (err) {
      say(formatApiError(err));
      throw err;
    }
  }, [fetchData, say, t]);
  const placePreorder = useCallback(async (plan, qty, provider) => {
    try {
      const planId = String(plan.id).replace("H-", "");
      const res = await api.post(ENDPOINTS.preorder, {
        harvest_plan: Number(planId) || void 0,
        item_name: `${plan.name} (harvest ${dshort(plan.harvest)})`,
        quantity: qty,
        unit: plan.unit,
        price_per_unit: plan.price,
        deposit_percentage: plan.deposit
      });
      const depositAmount = Math.round(qty * plan.price * plan.deposit / 100);
      const buyerPhone = session?.phone || "0772000000";
      if (res && res.id) {
        await api.post(ENDPOINTS.initiate, {
          order: res.id,
          provider,
          phone: buyerPhone,
          amount: depositAmount
        });
      }
      setPreordering(null);
      say(t("toast.deposit_paid", { qty, unit: tu(plan.unit) }));
      clearCache();
      if (fetchData) await fetchData();
      if (onTabChange) onTabChange("myorders");
    } catch (err) {
      say(formatApiError(err));
    }
  }, [session, fetchData, say, onTabChange, t, tu]);
  const confirmReceipt = useCallback(async (o) => {
    try {
      const orderId = o.id.replace("ORD-", "");
      await api.post(ENDPOINTS.orderDeliver(orderId));
      if (fetchData) await fetchData();
      setRating(o);
    } catch (err) {
      say(formatApiError(err));
    }
  }, [fetchData, say]);
  const handleRate = useCallback(async (data) => {
    try {
      const orderId = String(rating.id).replace("ORD-", "").replace("PRE-", "");
      const stars = typeof data === "number" ? data : data.stars;
      const comment = typeof data === "object" ? data.comment || "" : "";
      await api.post(ENDPOINTS.orderRate(orderId), { stars, comment });
      if (fetchData) await fetchData();
      setRating(null);
      say(t("toast.rated"));
    } catch (err) {
      say(formatApiError(err));
    }
  }, [rating, say, fetchData, t]);
  const openedListing = useMemo(() => {
    if (!open) return null;
    return listings.find((x) => x.id === open) || open;
  }, [open, listings]);
  const otherListings = useMemo(() => {
    if (!openedListing) return [];
    return listings.filter((x) => x.sellerId === openedListing.sellerId && x.id !== openedListing.id);
  }, [openedListing, listings]);
  return <>{tab === "browse" && (openedListing ? <ListingDetail
    l={openedListing}
    other={otherListings}
    onBack={() => setOpen(null)}
    onAdd={addToCart}
    onOpen={setOpen}
    cart={cart}
    cartTotal={cartTotal}
    onCheckout={() => setCheckout(true)}
  /> : <Marketplace
    f={f}
    setF={setF}
    onOpen={setOpen}
    cart={cart}
    cartTotal={cartTotal}
    onCheckout={() => setCheckout(true)}
  />)}{tab === "preorders" && <PreOrders plans={plans} t={t} onPreorder={setPreordering} />}{tab === "myorders" && <MyOrders orders={myOrders} onConfirm={confirmReceipt} onRate={setRating} onDispute={raiseDispute} />}{checkout && <Checkout
    cart={cart}
    setCart={setCart}
    commission={commission}
    onClose={() => setCheckout(false)}
    onPay={pay}
    t={t}
    session={session}
  />}{preordering && <PreorderModal plan={preordering} onClose={() => setPreordering(null)} onPay={placePreorder} />}{rating && <RateModal order={rating} onClose={() => setRating(null)} onSubmit={handleRate} />}</>;
}
