import React, { useState } from "react";
import { ugx, dshort } from "../utils/helpers";
import Marketplace from "./Marketplace";
import ListingDetail from "./ListingDetail";
import PreOrders from "./PreOrders";
import MyOrders from "./MyOrders";
import Checkout from "./Checkout";
import PreorderModal from "./PreorderModal";
import RateModal from "./RateModal";

export default function BuyerApp(props) {
  const { tab, listings, setListings, plans, setPlans, orders, setOrders, commission, say, pushSms, t, session } = props;
  const [open, setOpen] = useState(null);
  const [cart, setCart] = useState([]);
  const [checkout, setCheckout] = useState(false);
  const [preordering, setPreordering] = useState(null);
  const [rating, setRating] = useState(null);
  const [f, setF] = useState({ q: "", cat: "All", district: "All", max: "", minRating: 0, sort: "relevance" });

  const myOrders = orders.filter(o => o.buyerId === "B-01");
  const cartTotal = cart.reduce((s, c) => s + c.qty * c.price, 0);

  const addToCart = (l, qty) => {
    setCart(c => {
      const has = c.find(x => x.id === l.id);
      return has ? c.map(x => x.id === l.id ? { ...x, qty: x.qty + qty } : x) : [...c, { ...l, qty }];
    });
    say(`${qty} ${l.unit} ${l.name} added to your basket`);
  };

  const pay = (provider) => {
    const base = 5515 + orders.filter(o => o.type === "order").length;
    const made = cart.map((c, i) => ({
      id: "ORD-" + (base + i), type: "order", buyer: session.name, buyerId: "B-01", sellerId: c.sellerId, seller: c.seller,
      item: c.name, qty: c.qty, unit: c.unit, price: c.price, status: "accepted", mode: "Motorcycle", paid: true,
      provider, rated: false, placed: "19 Jul",
    }));
    setOrders(o => [...made, ...o]);
    setListings(ls => ls.map(l => { const c = cart.find(x => x.id === l.id); return c ? { ...l, qty: Math.max(0, l.qty - c.qty) } : l; }));
    made.forEach(m => pushSms("Seller · " + m.seller, `${m.id} paid. ${m.qty} ${m.unit} ${m.item}. Buyer: ${session.name}, 0772••882.`));
    pushSms("Buyer · " + session.name, `${made.length} order(s) confirmed. Total ${ugx(cartTotal)} paid by ${provider}.`);
    setCart([]); setCheckout(false);
    say(`Paid ${ugx(cartTotal)} with ${provider} Mobile Money`);
  };

  const placePreorder = (plan, qty, provider) => {
    const id = "PRE-" + (3302 + orders.filter(o => o.type === "preorder").length);
    setOrders(o => [{ id, type: "preorder", buyer: session.name, buyerId: "B-01", sellerId: plan.sellerId, seller: plan.seller,
      item: `${plan.name} (harvest ${dshort(plan.harvest)})`, qty, unit: plan.unit, price: plan.price, status: "reserved",
      paid: true, provider, depositPct: plan.deposit, rated: false, placed: "19 Jul" }, ...o]);
    setPlans(ps => ps.map(p => p.id === plan.id ? { ...p, reserved: p.reserved + qty } : p));
    pushSms("Seller · " + plan.seller, `Pre-order ${id}: ${qty} ${plan.unit} ${plan.name} reserved by ${session.name}.`);
    setPreordering(null); say(`Deposit paid · ${qty} ${plan.unit} reserved`);
  };

  const confirmReceipt = (o) => {
    setOrders(os => os.map(x => x.id === o.id ? { ...x, status: "delivered" } : x));
    pushSms("Seller · " + o.seller, `${o.id} received. Payout of ${ugx(o.qty * o.price * (1 - commission / 100))} is on the way.`);
    setRating(o);
  };

  if (open) {
    const l = listings.find(x => x.id === open) || open;
    const other = listings.filter(x => x.sellerId === l.sellerId && x.id !== l.id);
    return <ListingDetail l={l} other={other} onBack={() => setOpen(null)} onAdd={addToCart} onOpen={setOpen} />;
  }

  return (
    <>
      {tab === "browse" && <Marketplace listings={listings} f={f} setF={setF} onOpen={setOpen} cart={cart} cartTotal={cartTotal} onCheckout={() => setCheckout(true)} />}
      {tab === "preorders" && <PreOrders plans={plans} t={t} onPreorder={setPreordering} />}
      {tab === "myorders" && <MyOrders orders={myOrders} onConfirm={confirmReceipt} onRate={setRating} />}

      {checkout && <Checkout cart={cart} setCart={setCart} commission={commission} onClose={() => setCheckout(false)} onPay={pay} t={t} />}
      {preordering && <PreorderModal plan={preordering} onClose={() => setPreordering(null)} onPay={placePreorder} />}
      {rating && <RateModal order={rating} onClose={() => setRating(null)} onSubmit={(stars) => {
        setOrders(os => os.map(x => x.id === rating.id ? { ...x, rated: true, stars } : x));
        setListings(ls => ls.map(l => l.sellerId === rating.sellerId
          ? { ...l, ratings: l.ratings + 1, rating: Math.round(((l.rating * l.ratings + stars) / (l.ratings + 1)) * 10) / 10 } : l));
        setRating(null); say("Thank you — your rating is now on the farmer's profile");
      }} />}
    </>
  );
}
