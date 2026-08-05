import React, { useState } from "react";
import SellerHome from "./SellerHome";
import SellerListings from "./SellerListings";
import SellerPlans from "./SellerPlans";
import SellerOrders from "./SellerOrders";
import SellerRatings from "./SellerRatings";
import SellerPayouts from "./SellerPayouts";
import ListingForm from "./ListingForm";
import PlanForm from "./PlanForm";

export default function SellerApp(props) {
  const { tab, listings, setListings, plans, setPlans, orders, setOrders, commission, say, pushSms, sms, session } = props;
  const ME = "S-01";
  const [creating, setCreating] = useState(false);
  const [planning, setPlanning] = useState(false);

  const mine = listings.filter(l => l.sellerId === ME);
  const myPlans = plans.filter(p => p.sellerId === ME);
  const myOrders = orders.filter(o => o.sellerId === ME);
  const gross = myOrders.filter(o => o.paid).reduce((s, o) => s + o.qty * o.price, 0);
  const paidOut = myOrders.filter(o => o.status === "delivered").reduce((s, o) => s + o.qty * o.price * (1 - commission / 100), 0);

  const advance = (o) => {
    const next = o.status === "accepted" ? "out_for_delivery" : "delivered";
    setOrders(os => os.map(x => x.id === o.id ? { ...x, status: next } : x));
    pushSms("Buyer · " + o.buyer, `${o.id}: ${next === "out_for_delivery" ? "on the way by " + o.mode : "delivered. Please confirm receipt in the app."}`);
    say(next === "out_for_delivery" ? "Buyer notified — you are on the way" : "Marked delivered. Buyer will confirm receipt.");
  };

  return (
    <>
      {tab === "home" && <SellerHome session={session} mine={mine} myOrders={myOrders} gross={gross} commission={commission} sms={sms} advance={advance} />}
      {tab === "listings" && <SellerListings mine={mine} setListings={setListings} onCreateListing={() => setCreating(true)} />}
      {tab === "plans" && <SellerPlans myPlans={myPlans} setPlans={setPlans} pushSms={pushSms} say={say} onCreatePlan={() => setPlanning(true)} />}
      {tab === "sorders" && <SellerOrders myOrders={myOrders} commission={commission} setOrders={setOrders} advance={advance} />}
      {tab === "sratings" && <SellerRatings />}
      {tab === "payouts" && <SellerPayouts myOrders={myOrders} gross={gross} paidOut={paidOut} commission={commission} />}

      {creating && <ListingForm onClose={() => setCreating(false)} onSave={(l) => {
        setListings(ls => [{ ...l, id: "L-" + (1049 + ls.length), seller: session.name, sellerId: ME, sellerType: session.type,
          district: "Wakiso", rating: 4.7, ratings: 38, verified: true, top: true, ref: Math.round(l.price * 1.06),
          note: l.note || "Listed by the farmer." }, ...ls]);
        setCreating(false); say("Your produce is live on the marketplace");
      }} />}
      {planning && <PlanForm onClose={() => setPlanning(false)} onSave={(p) => {
        setPlans(ps => [{ ...p, id: "H-" + (204 + ps.length), seller: session.name, sellerId: ME, district: "Wakiso", reserved: 0 }, ...ps]);
        setPlanning(false); say("Harvest plan posted. Buyers can reserve it now.");
      }} />}
    </>
  );
}
