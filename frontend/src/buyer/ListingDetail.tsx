import React, { useState, useEffect } from "react";
import { Play, Pause, MapPin, Mic } from "lucide-react";
import { EMOJI, TINT } from "../data/categories";
import { ugx, typeLabel } from "../utils/helpers";
import { Badge } from "../components/Badge";
import { Req } from "../components/Req";
import { Field } from "../components/Field";

export default function ListingDetail({ l, other, onBack, onAdd, onOpen }) {
  const [qty, setQty] = useState(10);
  const [playing, setPlaying] = useState(false);
  const [shot, setShot] = useState(0);
  useEffect(() => { if (!playing) return; const x = setTimeout(() => setPlaying(false), 2200); return () => clearTimeout(x); }, [playing]);

  return (
    <>
      <button className="link" style={{ marginTop: 18 }} onClick={onBack}>← Back to the marketplace</button>
      <div className="grid" style={{ gridTemplateColumns: "1.3fr .7fr", marginTop: 14, alignItems: "start" }}>
        <div className="stack">
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ height: 320, background: `linear-gradient(to bottom right, #FFF, ${TINT[l.cat]}50)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 96 }}>{EMOJI[l.cat]}</div>
            <div className="row" style={{ padding: 16, gap: 10, background: "rgba(255,255,255,0.8)", borderTop: "1px solid var(--line)" }}>
              {Array.from({ length: l.photos }).map((_, i) => (
                <button key={i} onClick={() => setShot(i)} style={{ width: 64, height: 54, background: `linear-gradient(to bottom right, #FFF, ${TINT[l.cat]}50)`,
                  border: i === shot ? "2px solid var(--grow)" : "1px solid var(--line)", borderRadius: 8, fontSize: 24 }}>{EMOJI[l.cat]}</button>
              ))}
              <span className="hint" style={{ marginLeft: "auto", fontWeight: 600 }}>{l.photos} photos from the farm</span>
            </div>
          </div>

          <div className="card">
            <div className="row" style={{ gap: 6 }}>
              {l.verified ? <Badge tone="b-green">Verified farmer</Badge> : <Badge tone="b-maize">Verification pending</Badge>}
              {l.top && <Badge tone="b-maize">Top seller</Badge>}
              <Badge tone="b-grey">{l.cat}</Badge>
            </div>
            <h1 style={{ marginTop: 12, fontSize: 27 }}>{l.name}</h1>
            <p className="lede">{l.note}</p>

            {l.voice > 0 && (
              <div className="card" style={{ marginTop: 16, background: "var(--leaf2)", border: 0 }}>
                <div className="row">
                  <button className="btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: "#FFF", borderColor: "var(--grow)", color: "var(--grow)" }} onClick={() => setPlaying(p => !p)}>{playing ? <><Pause size="1em" fill="currentColor" /> Playing…</> : <><Play size="1em" fill="currentColor" /> Play voice note</>}</button>
                  <div style={{ flex: 1, display: "flex", gap: 3, alignItems: "flex-end", height: 32 }}>
                    {Array.from({ length: 40 }).map((_, i) => (
                      <span key={i} style={{ flex: 1, height: (12 + ((i * 37) % 20)) + "px", background: playing ? "var(--grow)" : "var(--line)", borderRadius: 2, transition: "background 0.2s" }} />
                    ))}
                  </div>
                  <span className="hint mono" style={{ fontWeight: 700 }}>{l.voice}s</span>
                </div>
                <p className="hint" style={{ marginTop: 10 }}>The farmer described this listing out loud instead of typing it.</p>
              </div>
            )}

            <div className="grid g2" style={{ marginTop: 14 }}>
              <div><div className="hint">Available</div><div className="mono" style={{ fontSize: 16 }}>{l.qty} {l.unit}</div></div>
              <div><div className="hint">This week's market reference</div><div className="mono" style={{ fontSize: 16 }}>{ugx(l.ref)} / {l.unit}</div></div>
            </div>
          </div>

          <div className="card">
            <h3>Where it comes from</h3>
            <div className="map" style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><MapPin size="1em" /> {l.district} district — approximate area only</div>
            <p className="hint" style={{ marginTop: 8 }}>Exact farm coordinates are never shown publicly. The precise pin is shared with you once an order is accepted.</p>
          </div>

          {other.length > 0 && (
            <div className="card">
              <h3>Also from {l.seller}</h3>
              <div className="grid g3" style={{ marginTop: 12 }}>
                {other.map(o => (
                  <button key={o.id} className="listing" onClick={() => onOpen(o.id)}>
                    <div className="photo" style={{ background: TINT[o.cat], height: 70, fontSize: 24 }}><span>{EMOJI[o.cat]}</span></div>
                    <div style={{ padding: 10 }}>
                      <h4>{o.name}</h4><div className="mono" style={{ fontSize: 13, marginTop: 4 }}>{ugx(o.price)}/{o.unit}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="stack" style={{ position: "sticky", top: 90 }}>
          <div className="card">
            <div className="price" style={{ fontSize: 26 }}>{ugx(l.price)}</div>
            <div className="ref">per {l.unit} · market reference {ugx(l.ref)}</div>
            <div className="rule" style={{ margin: "14px 0" }} />
            <Field label={`How much (${l.unit})`}>
              <div className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
                <button className="btn-sm" onClick={() => setQty(q => Math.max(1, q - 5))}>−</button>
                <input type="number" value={qty} min="1" max={l.qty} style={{ textAlign: "center" }}
                  onChange={e => setQty(Math.max(1, Math.min(l.qty, Number(e.target.value) || 1)))} />
                <button className="btn-sm" onClick={() => setQty(q => Math.min(l.qty, q + 5))}>+</button>
              </div>
            </Field>
            <div className="between" style={{ marginTop: 12 }}><span className="hint">Total</span><strong className="mono">{ugx(qty * l.price)}</strong></div>
            <button className="btn-maize" style={{ width: "100%", marginTop: 12 }} disabled={l.qty === 0} onClick={() => onAdd(l, qty)}>
              {l.qty === 0 ? "Sold out" : "Add to basket"}
            </button>
            <p className="hint" style={{ marginTop: 9 }}>Pay by MTN or Airtel Mobile Money at checkout. Your money is released to the farmer only after you confirm delivery.</p>
          </div>

          <div className="card">
            <h3>{l.seller}</h3>
            <p className="hint" style={{ marginTop: 4 }}>{typeLabel(l.sellerType)} · {l.district}</p>
            <div className="row" style={{ marginTop: 10 }}>
              <span style={{ color: "var(--maize)", fontSize: 16 }}>{"★".repeat(Math.round(l.rating))}</span>
              <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>{l.rating}</span><span className="hint">({l.ratings} ratings)</span>
            </div>
            <div className="rule" style={{ margin: "16px 0" }} />
            <div className="stack">
              {[["Nakato Catering", 5, "Firm, clean, and delivered when he said."],
                ["Kampala Fresh Mart", 4, "Good quality, arrived two hours late."]].map(([w, s, txt]) => (
                <div key={w as string}><div className="row" style={{ gap: 7 }}><strong style={{ fontSize: 13 }}>{w}</strong>
                  <span style={{ color: "var(--maize)", fontSize: 12 }}>{"★".repeat(Number(s))}</span></div>
                  <p className="hint" style={{ marginTop: 4 }}>{txt}</p></div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="row" style={{ marginTop: 16, gap: 5 }}>{["REQ-014", "REQ-015", "REQ-017", "REQ-022", "REQ-050", "REQ-034"].map(r => <Req key={r} id={r} />)}</div>
    </>
  );
}
