import React, { useState, useEffect, useCallback, useRef } from "react";
import { CATEGORIES, EMOJI, TINT } from "../data/categories";
import { SEED_LISTINGS } from "../data/seedData";
import { ugx } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { Field } from "../components/Field";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { Mic, Loader2 } from "lucide-react";

function mapApiListing(l: any) {
  return {
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
    rating: 0,
    ratings: 0,
    verified: l.seller_verified,
    top: false,
    voice: l.voice_duration || 0,
    photos: l.photo_count || 0,
    photos_data: l.photos || [],
    voice_file: l.voice_file || null,
    ref: Math.round(l.price * 1.06),
    note: l.description || "",
  };
}

export default function Marketplace({ f, setF, onOpen, cart, cartTotal, onCheckout }) {
  const [listings, setListings] = useState(SEED_LISTINGS);
  const [total, setTotal] = useState(SEED_LISTINGS.length);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchListings = useCallback(async (filters: typeof f) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.cat && filters.cat !== "All") params.set("category", filters.cat);
      if (filters.district && filters.district !== "All") params.set("district", filters.district);
      if (filters.max) params.set("max_price", filters.max);
      if (filters.q) params.set("q", filters.q);
      if (filters.sort && filters.sort !== "relevance") params.set("sort", filters.sort);

      const queryString = params.toString();
      const url = queryString ? `${ENDPOINTS.listings}?${queryString}` : ENDPOINTS.listings;
      const res = await api.get(url);
      const items = Array.isArray(res) ? res : res.results || [];
      setTotal(res.count ?? items.length);

      if (items.length > 0) {
        let mapped = items.map(mapApiListing);
        // Client-side rating filter (backend does not support it)
        if (filters.minRating > 0) {
          mapped = mapped.filter(l => l.rating >= filters.minRating);
        }
        setListings(mapped);
      } else {
        setListings([]);
      }
    } catch {
      // Keep existing listings on failure
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce filter changes — immediate for selects, delayed for text input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const delay = f.q ? 400 : 0;
    debounceRef.current = setTimeout(() => fetchListings(f), delay);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [f, fetchListings]);

  const districts = ["All", ...Array.from(new Set(listings.map(l => l.district)))].filter(Boolean);

  const shown = listings.filter(l => l.rating >= f.minRating);

  return (
    <>
      <Head eyebrow="Marketplace" title="Buy straight from the farm"
        lede="Everything listed here comes from a farmer whose ID and phone we have checked. This week's market reference sits beside every price."
        reqs={["REQ-013", "REQ-020", "REQ-021", "REQ-022", "REQ-034"]} />

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="grid g5">
          <Field label="Search"><input value={f.q} placeholder="Tomatoes, maize..." onChange={e => setF({ ...f, q: e.target.value })} /></Field>
          <Field label="Category"><select value={f.cat} onChange={e => setF({ ...f, cat: e.target.value })}>{["All", ...CATEGORIES].map(c => <option key={c}>{c}</option>)}</select></Field>
          <Field label="District"><select value={f.district} onChange={e => setF({ ...f, district: e.target.value })}>{districts.map((x: any) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Max price per unit"><input type="number" value={f.max} placeholder="Any" onChange={e => setF({ ...f, max: e.target.value })} /></Field>
          <Field label="Sort by">
            <select value={f.sort} onChange={e => setF({ ...f, sort: e.target.value })}>
              <option value="relevance">Most relevant</option>
              <option value="price">Lowest price</option>
              <option value="rating">Best rated seller</option>
              <option value="newest">Newest first</option>
            </select>
          </Field>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <span className="hint" style={{ fontWeight: 700 }}>Seller rating at least</span>
          {[0, 3, 4, 4.5].map(r => (
            <button key={r} className="btn-sm" onClick={() => setF({ ...f, minRating: r })}
              style={f.minRating === r ? { borderColor: "var(--ink)", background: "var(--leaf2)" } : null}>
              {r === 0 ? "Any" : r + " stars"}
            </button>
          ))}
          <span className="hint" style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6 }}>
            {loading && <Loader2 size="1em" className="spin" />}
            {shown.length} of {total} listings
          </span>
          {cart.length > 0 && (
            <button className="btn cartbtn" onClick={onCheckout}>Basket · {ugx(cartTotal)}<i>{cart.length}</i></button>
          )}
        </div>
      </div>

      {shown.length === 0 && !loading ? (
        <div className="card" style={{ textAlign: "center", padding: 44 }}>
          <h3>Nothing matches that yet</h3>
          <p className="lede" style={{ margin: "8px auto 14px" }}>Widen the district or raise your price ceiling. New produce is listed every morning.</p>
          <button className="btn-alt" onClick={() => setF({ q: "", cat: "All", district: "All", max: "", minRating: 0, sort: "relevance" })}>Clear filters</button>
        </div>
      ) : (
        <div className="grid g4">
          {shown.map(l => (
            <button className="listing" key={l.id} onClick={() => onOpen(l.id)}>
              <div className="photo" style={{ background: `linear-gradient(to bottom right, #FFF, ${TINT[l.cat]}40)` }}>
                <span>{EMOJI[l.cat]}</span>
                <span className="mono" style={{ fontSize: 10, color: "var(--mute)", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
                  {l.photos} photos{l.voice ? <> · {l.voice}s <Mic size="1em" /></> : ""}
                </span>
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
                <div className="hint">
                  {l.rating > 0 ? `${l.rating} stars (${l.ratings})` : "No ratings yet"} · {l.qty > 0 ? `${l.qty} ${l.unit} available` : "Sold out"}
                </div>
                <span className="btn-sm" style={{ marginTop: "auto", textAlign: "center" }}>View listing</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
