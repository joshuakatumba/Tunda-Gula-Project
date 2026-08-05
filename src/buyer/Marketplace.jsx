import React, { useState, useMemo } from "react";
import { CATEGORIES, EMOJI, TINT } from "../data/categories";
import { ugx } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { Field } from "../components/Field";
import { Mic } from "lucide-react";

export default function Marketplace({ listings, f, setF, onOpen, cart, cartTotal, onCheckout }) {
  const districts = ["All", ...Array.from(new Set(listings.map(l => l.district)))];
  const shown = useMemo(() => {
    let out = listings.filter(l =>
      (f.cat === "All" || l.cat === f.cat) && (f.district === "All" || l.district === f.district) &&
      (!f.max || l.price <= Number(f.max)) && l.rating >= f.minRating &&
      (l.name + l.seller).toLowerCase().includes(f.q.toLowerCase()));
    if (f.sort === "price") out = [...out].sort((a, b) => a.price - b.price);
    if (f.sort === "rating") out = [...out].sort((a, b) => b.rating - a.rating);
    if (f.sort === "value") out = [...out].sort((a, b) => (a.price / a.ref) - (b.price / b.ref));
    return out;
  }, [listings, f]);

  return (
    <>
      <Head eyebrow="Marketplace" title="Buy straight from the farm"
        lede="Everything listed here comes from a farmer whose ID and phone we have checked. This week's market reference sits beside every price."
        reqs={["REQ-013", "REQ-020", "REQ-021", "REQ-022", "REQ-034"]} />

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="grid g5">
          <Field label="Search"><input value={f.q} placeholder="Tomatoes, maize…" onChange={e => setF({ ...f, q: e.target.value })} /></Field>
          <Field label="Category"><select value={f.cat} onChange={e => setF({ ...f, cat: e.target.value })}>{["All", ...CATEGORIES].map(c => <option key={c}>{c}</option>)}</select></Field>
          <Field label="District"><select value={f.district} onChange={e => setF({ ...f, district: e.target.value })}>{districts.map(x => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Max price per unit"><input type="number" value={f.max} placeholder="Any" onChange={e => setF({ ...f, max: e.target.value })} /></Field>
          <Field label="Sort by">
            <select value={f.sort} onChange={e => setF({ ...f, sort: e.target.value })}>
              <option value="relevance">Most relevant</option><option value="price">Lowest price</option>
              <option value="rating">Best rated seller</option><option value="value">Furthest below market</option>
            </select>
          </Field>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <span className="hint" style={{ fontWeight: 600 }}>Seller rating at least</span>
          {[0, 3, 4, 4.5].map(r => (
            <button key={r} className="btn-sm" onClick={() => setF({ ...f, minRating: r })}
              style={f.minRating === r ? { borderColor: "#16261E", background: "#DDE6D2" } : null}>{r === 0 ? "Any" : r + "★"}</button>
          ))}
          <span className="hint" style={{ marginLeft: "auto" }}>{shown.length} of {listings.length} listings</span>
          {cart.length > 0 && (
            <button className="btn cartbtn" onClick={onCheckout}>Basket · {ugx(cartTotal)}<i>{cart.length}</i></button>
          )}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 44 }}>
          <h3>Nothing matches that yet</h3>
          <p className="lede" style={{ margin: "8px auto 14px" }}>Widen the district or raise your price ceiling. New produce is listed every morning.</p>
          <button className="btn-alt" style={{ borderColor: "#16261E" }} onClick={() => setF({ q: "", cat: "All", district: "All", max: "", minRating: 0, sort: "relevance" })}>Clear filters</button>
        </div>
      ) : (
        <div className="grid g4">
          {shown.map(l => (
            <button className="listing" key={l.id} onClick={() => onOpen(l.id)}>
              <div className="photo" style={{ background: TINT[l.cat] }}>
                <span>{EMOJI[l.cat]}</span>
                <span className="mono" style={{ fontSize: 10, color: "#6B7A6E", display: 'inline-flex', alignItems: 'center', gap: 4 }}>{l.photos} photos{l.voice ? <><span style={{ margin: "0 4px" }}>·</span> {l.voice}s <Mic size="1em" /></> : ""}</span>
              </div>
              <div style={{ padding: 13, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                <div className="row" style={{ gap: 5 }}>
                  {l.verified && <Badge tone="b-green">Verified farmer</Badge>}
                  {l.top && <Badge tone="b-maize">Top seller</Badge>}
                </div>
                <div><h3>{l.name}</h3><p className="hint" style={{ marginTop: 3 }}>{l.seller} · {l.district}</p></div>
                <div>
                  <div className="price">{ugx(l.price)}<span className="hint"> / {l.unit}</span></div>
                  <div className="ref">{l.price < l.ref ? `${Math.round((1 - l.price / l.ref) * 100)}% below` : "above"} market reference</div>
                </div>
                <div className="hint">★ {l.rating} ({l.ratings}) · {l.qty > 0 ? `${l.qty} ${l.unit} available` : "Sold out"}</div>
                <span className="btn-sm" style={{ marginTop: "auto", textAlign: "center" }}>View listing</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
