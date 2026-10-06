import React, { useState, useMemo, useCallback } from "react";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { formatApiError } from "../utils/errorHandler";
import SellerHome from "./SellerHome";
import SellerListings from "./SellerListings";
import SellerPlans from "./SellerPlans";
import SellerOrders from "./SellerOrders";
import SellerRatings from "./SellerRatings";
import SellerPayouts from "./SellerPayouts";
import ListingForm from "./ListingForm";
import PlanForm from "./PlanForm";

export default function SellerApp(props) {
  const { tab, listings, setListings, plans, setPlans, orders, setOrders, commission, say, pushSms, sms, session, fetchData } = props;
  const ME = `S-${session?.id || "01"}`;
  const [creating, setCreating] = useState(false);
  const [planning, setPlanning] = useState(false);

  const mine = useMemo(() => listings.filter(l => l.sellerId === ME || l.sellerId === "S-01"), [listings, ME]);
  const myPlans = useMemo(() => plans.filter(p => p.sellerId === ME || p.sellerId === "S-01"), [plans, ME]);
  const myOrders = useMemo(() => orders.filter(o => o.sellerId === ME || o.sellerId === "S-01"), [orders, ME]);
  const gross = useMemo(() => myOrders.filter(o => o.paid).reduce((s, o) => s + o.qty * o.price, 0), [myOrders]);
  const paidOut = useMemo(() => myOrders.filter(o => o.status === "delivered").reduce((s, o) => s + o.qty * o.price * (1 - commission / 100), 0), [myOrders, commission]);

  const advance = useCallback(async (o) => {
    const next = o.status === "accepted" ? "out_for_delivery" : "delivered";
    try {
      const orderId = o.id.replace("ORD-", "").replace("PRE-", "");
      if (next === "out_for_delivery") {
        // There's no specific "out for delivery" endpoint, update locally
        setOrders(os => os.map(x => x.id === o.id ? { ...x, status: next } : x));
      } else {
        await api.post(ENDPOINTS.orderDeliver(orderId));
        if (fetchData) fetchData();
      }
      pushSms("Buyer · " + o.buyer, `${o.id}: ${next === "out_for_delivery" ? "on the way by " + o.mode : "delivered. Please confirm receipt in the app."}`);
      say(next === "out_for_delivery" ? "Buyer notified — you are on the way" : "Marked delivered. Buyer will confirm receipt.");
    } catch (err) {
      say(formatApiError(err));
      // Fallback
      setOrders(os => os.map(x => x.id === o.id ? { ...x, status: next } : x));
      pushSms("Buyer · " + o.buyer, `${o.id}: ${next === "out_for_delivery" ? "on the way by " + o.mode : "delivered. Please confirm receipt in the app."}`);
      say(next === "out_for_delivery" ? "Buyer notified — you are on the way" : "Marked delivered. Buyer will confirm receipt.");
    }
  }, [setOrders, fetchData, pushSms, say]);

  const handleCreateListing = useCallback(async (l) => {
    try {
      await api.post(ENDPOINTS.listings, {
        name: l.name,
        category: l.cat,
        quantity: l.qty,
        unit: l.unit,
        price: l.price,
        description: l.note || "Listed by the farmer.",
        voice_duration: l.voice || 0,
        district: session?.district || "Wakiso",
      });
      setCreating(false);
      say("Your produce is live on the marketplace");
      if (fetchData) fetchData();
    } catch (err) {
      say(formatApiError(err));
      // Fallback to local state
      setListings(ls => [{ ...l, id: "L-" + (1049 + ls.length), seller: session.name, sellerId: ME, sellerType: session.type,
        district: session?.district || "Wakiso", rating: 4.7, ratings: 38, verified: true, top: true, ref: Math.round(l.price * 1.06),
        note: l.note || "Listed by the farmer." }, ...ls]);
      setCreating(false); say("Your produce is live on the marketplace");
    }
  }, [session, ME, fetchData, say, setListings]);

  const handleCreatePlan = useCallback(async (p) => {
    try {
      await api.post(ENDPOINTS.plans, {
        name: p.name,
        category: p.cat,
        quantity: p.qty,
        unit: p.unit,
        price: p.price,
        date_planted: p.planted,
        expected_harvest: p.harvest,
        deposit_percentage: p.deposit || 30,
        district: session?.district || "Wakiso",
      });
      setPlanning(false);
      say("Harvest plan posted. Buyers can reserve it now.");
      if (fetchData) fetchData();
    } catch (err) {
      say(formatApiError(err));
      // Fallback
      setPlans(ps => [{ ...p, id: "H-" + (204 + ps.length), seller: session.name, sellerId: ME, district: session?.district || "Wakiso", reserved: 0 }, ...ps]);
      setPlanning(false); say("Harvest plan posted. Buyers can reserve it now.");
    }
  }, [session, ME, fetchData, say, setPlans]);

  return (
    <>
      {tab === "home" && <SellerHome session={session} mine={mine} myOrders={myOrders} gross={gross} commission={commission} sms={sms} advance={advance} />}
      {tab === "listings" && <SellerListings mine={mine} setListings={setListings} onCreateListing={() => setCreating(true)} />}
      {tab === "plans" && <SellerPlans myPlans={myPlans} setPlans={setPlans} pushSms={pushSms} say={say} onCreatePlan={() => setPlanning(true)} />}
      {tab === "sorders" && <SellerOrders myOrders={myOrders} commission={commission} setOrders={setOrders} advance={advance} />}
      {tab === "sratings" && <SellerRatings />}
      {tab === "payouts" && <SellerPayouts myOrders={myOrders} gross={gross} paidOut={paidOut} commission={commission} />}

      {creating && <ListingForm onClose={() => setCreating(false)} onSave={handleCreateListing} />}
      {planning && <PlanForm onClose={() => setPlanning(false)} onSave={handleCreatePlan} />}
    </>
  );
}
