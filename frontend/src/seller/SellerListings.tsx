import React from "react";
import { EMOJI } from "../data/categories";
import { ugx } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { Button } from "../components/ui/Button";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";

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

      <div className="stack" style={{ gap: "16px" }}>
        {mine.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 12px", color: "var(--color-obsidian)" }}>No active listings</h2>
            <Button variant="primary" onClick={onCreateListing}>
              Create your first listing
            </Button>
          </div>
        ) : (
          mine.map(l => (
            <div className="card" key={l.id}>
              <div className="between" style={{ alignItems: "center" }}>
                <div className="row" style={{ gap: "16px", alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 54,
                      height: 54,
                      background: "var(--color-fog)",
                      borderRadius: "var(--radius-cards)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 26,
                    }}
                  >
                    {EMOJI[l.cat]}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--color-obsidian)" }}>{l.name}</h3>
                    <div style={{ fontSize: "13px", color: "var(--color-slate)", marginTop: "2px" }}>
                      {l.cat} · {l.photos} photos{l.voice ? ` · ${l.voice}s voice` : ""}
                    </div>
                    <div className="row" style={{ marginTop: "8px", gap: "8px" }}>
                      {l.qty > 0 ? <Badge tone="b-green">Active</Badge> : <Badge tone="b-red">Sold out</Badge>}
                      <span style={{ fontFamily: "var(--font-monospace)", fontSize: "13px", fontWeight: 600, color: "var(--color-forest-ink)" }}>
                        {ugx(l.price)} / {l.unit}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--color-slate)", marginBottom: "4px" }}>
                    Quantity ({l.unit})
                  </label>
                  <div className="row" style={{ gap: "8px", alignItems: "center" }}>
                    <button 
                      className="btn-sm" 
                      style={{ color: "var(--color-alarm-red)", borderColor: "var(--color-alarm-red)" }}
                      onClick={() => handleDelete(l.id)}
                    >
                      Delete
                    </button>
                    <input
                      type="number"
                      value={l.qty}
                      style={{ width: "90px", textAlign: "right", fontWeight: 600 }}
                      onChange={e => setListings(ls => ls.map(x => x.id === l.id ? { ...x, qty: Math.max(0, Number(e.target.value) || 0) } : x))}
                      onBlur={(e) => handleUpdateQuantity(l.id, Number(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
