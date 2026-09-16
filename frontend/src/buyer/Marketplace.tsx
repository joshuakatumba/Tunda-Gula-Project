import React, { useState, useEffect, useCallback, useRef } from "react";
import { CATEGORIES, EMOJI, TINT } from "../data/categories";
import { SEED_LISTINGS } from "../data/seedData";
import { ugx } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { Field } from "../components/Field";
import { Button } from "../components/ui/Button";
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
      <Head
        title="Marketplace"
        action={
          cart.length > 0 ? (
            <Button variant="primary" onClick={onCheckout}>
              Basket · {ugx(cartTotal)} ({cart.length})
            </Button>
          ) : undefined
        }
      />

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="grid g5">
          <Field label="Search">
            <input value={f.q} placeholder="Search produce..." onChange={e => setF({ ...f, q: e.target.value })} />
          </Field>
          <Field label="Category">
            <select value={f.cat} onChange={e => setF({ ...f, cat: e.target.value })}>
              {["All", ...CATEGORIES].map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="District">
            <select value={f.district} onChange={e => setF({ ...f, district: e.target.value })}>
              {districts.map((x: any) => <option key={x}>{x}</option>)}
            </select>
          </Field>
          <Field label="Max price">
            <input type="number" value={f.max} placeholder="Any" onChange={e => setF({ ...f, max: e.target.value })} />
          </Field>
          <Field label="Sort">
            <select value={f.sort} onChange={e => setF({ ...f, sort: e.target.value })}>
              <option value="relevance">Most relevant</option>
              <option value="price">Lowest price</option>
              <option value="rating">Best rated seller</option>
              <option value="newest">Newest first</option>
            </select>
          </Field>
        </div>
        <div className="row" style={{ marginTop: 16, alignItems: "center" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-slate)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Rating
          </span>
          {[0, 3, 4, 4.5].map(r => (
            <button
              key={r}
              className="btn-sm"
              onClick={() => setF({ ...f, minRating: r })}
              style={f.minRating === r ? { borderColor: "var(--color-forest-ink)", background: "var(--color-linen-mist)", fontWeight: 600 } : undefined}
            >
              {r === 0 ? "Any" : `${r}+ stars`}
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: "13px", color: "var(--color-slate)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            {loading && <Loader2 size={14} className="spin" />}
            {shown.length} of {total} listings
          </span>
        </div>
      </div>

      {shown.length === 0 && !loading ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px", color: "var(--color-obsidian)" }}>No listings found</h2>
          <Button variant="outline" onClick={() => setF({ q: "", cat: "All", district: "All", max: "", minRating: 0, sort: "relevance" })}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid g4">
          {shown.map(l => (
            <button
              className="listing"
              key={l.id}
              onClick={() => onOpen(l.id)}
              style={{ textAlign: "left", cursor: "pointer", padding: 0 }}
            >
              <div
                style={{
                  height: "140px",
                  backgroundColor: "var(--color-fog)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  fontSize: "44px",
                }}
              >
                <span>{EMOJI[l.cat]}</span>
                {(l.photos > 0 || l.voice > 0) && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      right: "8px",
                      fontSize: "11px",
                      fontWeight: 600,
                      background: "rgba(255, 255, 255, 0.9)",
                      color: "var(--color-forest-ink)",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-tags)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {l.photos > 0 && `${l.photos} photos`}
                    {l.voice > 0 && <>· {l.voice}s <Mic size={11} /></>}
                  </span>
                )}
              </div>
              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                <div className="row" style={{ gap: "6px" }}>
                  {l.verified && <Badge tone="b-green">Verified</Badge>}
                  {l.top && <Badge tone="b-maize">Top seller</Badge>}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--color-obsidian)" }}>{l.name}</h3>
                  <div style={{ fontSize: "13px", color: "var(--color-slate)", marginTop: "2px" }}>{l.seller} · {l.district}</div>
                </div>
                <div style={{ marginTop: "4px" }}>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-forest-ink)" }}>
                    {ugx(l.price)}
                    <span style={{ fontSize: "13px", fontWeight: 400, color: "var(--color-pebble)" }}> / {l.unit}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: l.price < l.ref ? "var(--color-spruce)" : "var(--color-charcoal)", fontWeight: 500 }}>
                    {l.price < l.ref ? `${Math.round((1 - l.price / l.ref) * 100)}% below` : "above"} market ref
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "var(--color-pebble)", marginTop: "auto" }}>
                  {l.rating > 0 ? `${l.rating} ★ (${l.ratings})` : "New seller"} · {l.qty > 0 ? `${l.qty} ${l.unit} left` : "Sold out"}
                </div>
                <span className="btn-sm" style={{ width: "100%", boxSizing: "border-box", marginTop: "8px" }}>
                  View details
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
