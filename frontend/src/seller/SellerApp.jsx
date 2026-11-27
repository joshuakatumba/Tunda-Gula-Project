import { useState, useMemo, useCallback } from "react";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { formatApiError } from "../utils/errorHandler";
import SellerHome from "./SellerHome";
import SellerListings from "./SellerListings";
import SellerPlans from "./SellerPlans";
import SellerOrders from "./SellerOrders";
import SellerRatings from "./SellerRatings";
import SellerPayouts from "./SellerPayouts";
import SellerRecords from "./SellerRecords";
import ListingForm from "./ListingForm";
import PlanForm from "./PlanForm";
export default function SellerApp(props) {
  const { tab, listings, setListings, plans, setPlans, orders, setOrders, commission, say, pushSms, sms, session, fetchData } = props;
  const ME = `S-${session?.id || "01"}`;
  const [creating, setCreating] = useState(false);
  const [relistDraft, setRelistDraft] = useState(null);
  const [planning, setPlanning] = useState(false);
  const mine = useMemo(() => listings.filter((l) => l.sellerId === ME || String(l.sellerId) === `S-${session?.id}` || l.seller === session?.name), [listings, ME, session]);
  const myPlans = useMemo(() => plans.filter((p) => p.sellerId === ME || String(p.sellerId) === `S-${session?.id}` || p.seller === session?.name), [plans, ME, session]);
  const myOrders = useMemo(() => orders.filter((o) => o.sellerId === ME || String(o.sellerId) === `S-${session?.id}` || o.seller === session?.name), [orders, ME, session]);
  const gross = useMemo(() => myOrders.filter((o) => o.paid || o.status === "delivered").reduce((s, o) => s + o.qty * o.price, 0), [myOrders]);
  const paidOut = useMemo(() => myOrders.filter((o) => o.status === "delivered").reduce((s, o) => s + o.qty * o.price * (1 - commission / 100), 0), [myOrders, commission]);
  const advance = useCallback(async (o) => {
    const orderId = String(o.id).replace("ORD-", "").replace("PRE-", "");
    let nextStatus = "delivered";
    try {
      if (o.status === "placed") {
        await api.post(ENDPOINTS.orderAccept(orderId));
        nextStatus = "accepted";
        pushSms("Buyer \xB7 " + o.buyer, `${o.id}: accepted by ${session?.name || "Farmer"}. Produce is being prepared.`);
        say("Order accepted. Prepare items for dispatch.");
      } else if (o.status === "accepted") {
        await api.post(ENDPOINTS.orderDispatch(orderId), { delivery_mode: o.mode || "Motorcycle" });
        nextStatus = "out_for_delivery";
        pushSms("Buyer \xB7 " + o.buyer, `${o.id}: on the way by ${o.mode || "Motorcycle"}.`);
        say("Buyer notified \u2014 order is out for delivery");
      } else {
        await api.post(ENDPOINTS.orderDeliver(orderId));
        nextStatus = "delivered";
        pushSms("Buyer \xB7 " + o.buyer, `${o.id}: marked delivered. Please confirm receipt in the app.`);
        say("Marked delivered. Buyer can now rate your produce.");
      }
      if (fetchData) fetchData();
    } catch (err) {
      say(formatApiError(err));
      setOrders((os) => os.map((x) => x.id === o.id ? { ...x, status: nextStatus } : x));
    }
  }, [setOrders, fetchData, pushSms, say, session]);
  const handleCreateListing = useCallback(async (_saved) => {
    setCreating(false);
    say("Your produce is live on the marketplace");
    if (fetchData) fetchData();
  }, [fetchData, say]);
  const handleCreatePlan = useCallback(async (_saved) => {
    setPlanning(false);
    say("Harvest plan posted. Buyers can reserve it now.");
    if (fetchData) fetchData();
  }, [fetchData, say]);
  return <>{tab === "home" && <SellerHome session={session} mine={mine} myOrders={myOrders} gross={gross} commission={commission} sms={sms} advance={advance} />}{tab === "listings" && <SellerListings mine={mine} setListings={setListings} onCreateListing={() => { setRelistDraft(null); setCreating(true); }} onRelist={(l) => { setRelistDraft(l); setCreating(true); }} />}{tab === "plans" && <SellerPlans myPlans={myPlans} setPlans={setPlans} pushSms={pushSms} say={say} onCreatePlan={() => setPlanning(true)} />}{tab === "sorders" && <SellerOrders myOrders={myOrders} commission={commission} setOrders={setOrders} advance={advance} />}{tab === "sratings" && <SellerRatings session={session} />}{tab === "payouts" && <SellerPayouts myOrders={myOrders} gross={gross} paidOut={paidOut} commission={commission} />}{tab === "records" && <SellerRecords say={say} session={session} />}{creating && <ListingForm initial={relistDraft} onClose={() => { setCreating(false); setRelistDraft(null); }} onSave={handleCreateListing} />}{planning && <PlanForm onClose={() => setPlanning(false)} onSave={handleCreatePlan} />}</>;
}
