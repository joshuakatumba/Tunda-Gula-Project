import React from "react";
import { EMOJI } from "../data/categories";
import { ugx } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { Button } from "../components/ui/Button";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { Thumb } from "../components/Thumb";

export default function SellerListings({ mine, setListings, onCreateListing }) {
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    const realId = id.replace("L-", "");
    try {
      await api.delete(ENDPOINTS.listing(realId));
      setListings(ls => ls.filter(x => x.id !== id));
    } catch {
      // Fallback if API fails
      setListings(ls => ls.filter(x => x.id !== id));
    }
  };

  const handleUpdateQuantity = async (id: string, qty: number) => {
    const realId = id.replace("L-", "");
    try {
      await api.patch(ENDPOINTS.listing(realId), { quantity: qty });
    } catch {
      // Ignore fallback
    }
  };
  return (
    <>
      <Head
        title="Produce Listings"
        action={
          <Button variant="primary" onClick={onCreateListing}>
            + Add listing
          </Button>
        }
      />

      <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
        {mine.length === 0 ? (
          <div className="card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px 24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 12px", color: "var(--color-obsidian)" }}>No active listings</h2>
            <Button variant="primary" onClick={onCreateListing}>
              Create your first listing
            </Button>
          </div>
        ) : (
          mine.map(l => (
            <div className="card" key={l.id} style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ position: "relative", width: "100%", aspectRatio: "1/1" }}>
                <Thumb 
                  src={l.thumbnail} 
                  alt={l.name} 
                  fallback={EMOJI[l.cat]} 
                  size="100%" 
                  className="listing-thumb"
                />
                <div style={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}>
                  {l.qty > 0 ? <Badge tone="b-green" style={{ background: "var(--color-paper)" }}>Active</Badge> : <Badge tone="b-red" style={{ background: "var(--color-paper)" }}>Sold out</Badge>}
                </div>
              </div>
              <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--color-obsidian)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.name}</h3>
                <div style={{ fontSize: "12px", color: "var(--color-slate)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {l.cat} · {l.photos} photos{l.voice ? ` · ${l.voice}s` : ""}
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-forest-ink)", marginTop: 4 }}>
                  {ugx(l.price)} <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--color-pebble)" }}>/{l.unit}</span>
                </div>
                
                <div style={{ marginTop: "auto", paddingTop: "8px", borderTop: "1px solid var(--color-fog)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-slate)" }}>Qty:</span>
                    <input
                      type="number"
                      value={l.qty}
                      style={{ width: "54px", padding: "4px", fontSize: "13px", textAlign: "center", borderRadius: "var(--radius-buttons)", border: "1px solid var(--color-fog)" }}
                      onChange={e => setListings(ls => ls.map(x => x.id === l.id ? { ...x, qty: Math.max(0, Number(e.target.value) || 0) } : x))}
                      onBlur={(e) => handleUpdateQuantity(l.id, Number(e.target.value) || 0)}
                    />
                  </div>
                  <button 
                    style={{ background: "none", border: "none", color: "var(--color-alarm-red)", cursor: "pointer", padding: "4px" }}
                    onClick={() => handleDelete(l.id)}
                    title="Delete"
                  >
                    <i className="bx bx-trash" style={{ fontSize: 18 }}></i>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
