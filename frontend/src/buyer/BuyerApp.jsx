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
export default function BuyerApp(props) {
  const { tab, onTabChange, listings, setListings, plans, setPlans, orders, setOrders, commission, say, pushSms, t, session, fetchData } = props;
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
    say(`${qty} ${l.unit} ${l.name} added to your basket`);
  }, [say]);
  const pay = useCallback(async ({ provider = "MTN", phone, deliveryMode = "Motorcycle" } = {}) => {
    try {
      const buyerPhone = phone || session?.phone || "0772000000";
      for (const c of cart) {
        const listingId = String(c.id).replace("L-", "");
        const res = await api.post(ENDPOINTS.orders, {
          listing: Number(listingId) || void 0,
          item_name: c.name,
          quantity: c.qty,
          unit: c.unit,
          price_per_unit: c.price,
          delivery_mode: deliveryMode
        });
        if (res && res.id) {
          await api.post(ENDPOINTS.initiate, {
            order: res.id,
            provider,
            phone: buyerPhone,
            amount: c.qty * c.price
          });
        }
      }
      say(`Paid ${ugx(cartTotal)} with ${provider} Mobile Money \xB7 Order placed!`);
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
  }, [cart, session, fetchData, say, cartTotal, onTabChange]);
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
      say(`Deposit paid \xB7 ${qty} ${plan.unit} reserved`);
      clearCache();
      if (fetchData) await fetchData();
      if (onTabChange) onTabChange("myorders");
    } catch (err) {
      say(formatApiError(err));
    }
  }, [session, fetchData, say, onTabChange]);
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
      say("Thank you \u2014 your rating is now on the farmer's profile");
    } catch (err) {
      say(formatApiError(err));
    }
  }, [rating, say, fetchData]);
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
  />)}{tab === "preorders" && <PreOrders plans={plans} t={t} onPreorder={setPreordering} />}{tab === "myorders" && <MyOrders orders={myOrders} onConfirm={confirmReceipt} onRate={setRating} />}{checkout && <Checkout
    cart={cart}
    setCart={setCart}
    commission={commission}
    onClose={() => setCheckout(false)}
    onPay={pay}
    t={t}
    session={session}
  />}{preordering && <PreorderModal plan={preordering} onClose={() => setPreordering(null)} onPay={placePreorder} />}{rating && <RateModal order={rating} onClose={() => setRating(null)} onSubmit={handleRate} />}</>;
}
