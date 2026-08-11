import React from "react";
import { EMOJI, TINT } from "../data/categories";
import { ugx } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";

export default function SellerListings({ mine, setListings, onCreateListing }) {
  return (
    <>
      <Head eyebrow="Listings" title="What you are selling today"
        lede="Add produce with photos and a voice note. If writing is hard, say it out loud — buyers hear your description."
        reqs={["REQ-013", "REQ-014", "REQ-015", "REQ-016", "REQ-018", "REQ-019"]} />
      <div className="row" style={{ marginBottom: 14 }}><button className="btn-maize" onClick={onCreateListing}>+ List produce</button></div>
      <div className="stack">
        {mine.map(l => (
          <div className="card" key={l.id}>
            <div className="between">
              <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 54, height: 54, background: TINT[l.cat], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{EMOJI[l.cat]}</div>
                <div>
                  <h3>{l.name}</h3>
                  <p className="hint" style={{ marginTop: 3 }}>{l.cat} · {l.photos} photos{l.voice ? ` · ${l.voice}s voice note` : " · no voice note"}</p>
                  <div className="row" style={{ marginTop: 7, gap: 6 }}>
                    {l.qty > 0 ? <Badge tone="b-green">Live</Badge> : <Badge tone="b-red">Sold out — hidden</Badge>}
                    <span className="mono" style={{ fontSize: 12 }}>{ugx(l.price)}/{l.unit}</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <label className="hint" style={{ display: "block", marginBottom: 4 }}>Quantity left ({l.unit})</label>
                <input type="number" value={l.qty} style={{ width: 110, textAlign: "right" }}
                  onChange={e => setListings(ls => ls.map(x => x.id === l.id ? { ...x, qty: Math.max(0, Number(e.target.value) || 0) } : x))} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
