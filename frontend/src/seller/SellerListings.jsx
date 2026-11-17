import React from "react";
import { EMOJI } from "../data/categories";
import { ugx } from "../utils/helpers";
import { Head } from "../components/Head";
import { Button } from "../components/ui/Button";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { Thumb } from "../components/Thumb";
import { useI18n } from "../context/I18nContext";

export default function SellerListings({ mine, setListings, onCreateListing }) {
  const { t, tp, tu } = useI18n();

  const handleDelete = async (id) => {
    if (!window.confirm(`${t("common.delete")}?`)) return;
    const realId = id.replace("L-", "");
    try {
      await api.delete(ENDPOINTS.listing(realId));
    } catch {}
    setListings((ls) => ls.filter((x) => x.id !== id));
  };

  const handleUpdateQuantity = async (id, qty) => {
    const realId = id.replace("L-", "");
    try {
      await api.patch(ENDPOINTS.listing(realId), { quantity: qty });
    } catch {}
  };

  return (
    <>
      <Head
        title={t("seller.listings")}
        action={<Button variant="primary" onClick={onCreateListing}>{t("seller.add_short")}</Button>}
      />
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(145px, 1fr))" }}>
        {mine.length === 0 ? (
          <div className="card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 20px" }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 12px" }}>{t("seller.no_listings")}</h2>
            <Button variant="primary" onClick={onCreateListing}>{t("seller.add_listing")}</Button>
          </div>
        ) : (
          mine.map((l) => (
            <div className="card" key={l.id} style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ width: "100%", aspectRatio: "1/1" }}>
                <Thumb src={l.thumbnail} alt={l.name} fallback={EMOJI[l.cat]} size="100%" className="listing-thumb" />
              </div>
              <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {tp(l.name)}
                </h3>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-forest-ink)" }}>
                  {ugx(l.price)} <span style={{ fontSize: 11, fontWeight: 400, color: "var(--color-pebble)" }}>/{tu(l.unit)}</span>
                </div>
                <div style={{ marginTop: "auto", paddingTop: 6, borderTop: "1px solid var(--color-fog)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <input
                    type="number"
                    value={l.qty}
                    aria-label="Stock quantity"
                    style={{ width: 54, padding: 4, fontSize: 12, textAlign: "center", borderRadius: "var(--radius-buttons)", border: "1px solid var(--color-fog)" }}
                    onChange={(e) => setListings((ls) => ls.map((x) => x.id === l.id ? { ...x, qty: Math.max(0, Number(e.target.value) || 0) } : x))}
                    onBlur={(e) => handleUpdateQuantity(l.id, Number(e.target.value) || 0)}
                  />
                  <button
                    style={{ background: "none", border: "none", color: "var(--color-alarm-red)", cursor: "pointer", padding: 4 }}
                    onClick={() => handleDelete(l.id)}
                    title={t("common.delete")}
                  >
                    <i className="bx bx-trash" style={{ fontSize: 17 }} />
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
