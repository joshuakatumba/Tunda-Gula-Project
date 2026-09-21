import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, MapPin, Mic, Loader2, ArrowLeft } from "lucide-react";
import { EMOJI, TINT } from "../data/categories";
import { ugx, typeLabel } from "../utils/helpers";
import { Badge } from "../components/Badge";
import { Field } from "../components/Field";
import { Button } from "../components/ui/Button";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";

export default function ListingDetail({ l: initial, other, onBack, onAdd, onOpen }) {
  const [l, setL] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState(10);
  const [shot, setShot] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const rawId = String(initial.id).replace("L-", "");
    if (!rawId || isNaN(Number(rawId))) return;
    setLoading(true);
    api.get(ENDPOINTS.listing(rawId))
      .then((data: any) => {
        setL({
          id: `L-${data.id}`,
          seller: data.seller_name,
          sellerId: `S-${data.seller}`,
          sellerType: "",
          district: data.district,
          cat: data.category,
          name: data.name,
          qty: data.quantity,
          unit: data.unit,
          price: data.price,
          rating: 0,
          ratings: 0,
          verified: data.seller_verified,
          top: false,
          voice: data.voice_duration || 0,
          voice_file: data.voice_file || null,
          photos: data.photo_count || 0,
          photos_data: data.photos || [],
          ref: Math.round(data.price * 1.06),
          note: data.description || "",
        });
      })
      .catch(() => { /* keep initial */ })
      .finally(() => setLoading(false));
  }, [initial.id]);

  const toggleVoice = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const hasRealPhotos = l.photos_data && l.photos_data.length > 0;

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={onBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            color: "var(--color-forest-ink)",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            padding: 0,
            textDecoration: "underline",
          }}
        >
          <ArrowLeft size={16} /> Back to marketplace
        </button>
      </div>

      {loading && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--color-slate)", marginBottom: "12px" }}>
          <Loader2 size={14} className="spin" /> Loading details...
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: "1.3fr .7fr", gap: "24px", alignItems: "start" }}>
        <div className="stack" style={{ gap: "20px" }}>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ height: 320, background: "var(--color-fog)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 96 }}>
              {hasRealPhotos ? (
                <img src={l.photos_data[shot]?.image} alt={l.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span>{EMOJI[l.cat]}</span>
              )}
            </div>
            {(hasRealPhotos || l.photos > 0) && (
              <div className="row" style={{ padding: "16px", gap: "10px", background: "var(--color-paper)", borderTop: "1px solid var(--color-fog)" }}>
                {hasRealPhotos ? (
                  l.photos_data.map((p: any, i: number) => (
                    <button
                      key={p.id}
                      onClick={() => setShot(i)}
                      style={{
                        width: 64,
                        height: 54,
                        overflow: "hidden",
                        border: i === shot ? "2px solid var(--color-forest-ink)" : "1px solid var(--color-fog)",
                        borderRadius: "8px",
                        padding: 0,
                        cursor: "pointer",
                      }}
                    >
                      <img src={p.image} alt={`Photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </button>
                  ))
                ) : (
                  Array.from({ length: l.photos }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setShot(i)}
                      style={{
                        width: 64,
                        height: 54,
                        background: "var(--color-fog)",
                        border: i === shot ? "2px solid var(--color-forest-ink)" : "1px solid var(--color-fog)",
                        borderRadius: "8px",
                        fontSize: 24,
                        cursor: "pointer",
                      }}
                    >
                      {EMOJI[l.cat]}
                    </button>
                  ))
                )}
                <span style={{ marginLeft: "auto", fontSize: "12px", fontWeight: 600, color: "var(--color-slate)" }}>
                  {l.photos} photos
                </span>
              </div>
            )}
          </div>

          <div className="card">
            <div className="row" style={{ gap: "6px" }}>
              {l.verified && <Badge tone="b-green">Verified</Badge>}
              {l.top && <Badge tone="b-maize">Top seller</Badge>}
              <Badge>{l.cat}</Badge>
            </div>
            <h1 style={{ marginTop: "12px", fontSize: "28px", fontWeight: 700, color: "var(--color-obsidian)" }}>{l.name}</h1>
            {l.note && <p style={{ fontSize: "16px", color: "var(--color-charcoal)", lineHeight: 1.5, margin: "8px 0 0" }}>{l.note}</p>}

            {l.voice > 0 && (
              <div style={{ marginTop: "16px", background: "var(--color-linen-mist)", padding: "16px", borderRadius: "var(--radius-cards)" }}>
                {l.voice_file ? (
                  <>
                    <audio ref={audioRef} src={l.voice_file} onEnded={() => setPlaying(false)} style={{ display: "none" }} />
                    <div className="row" style={{ gap: "12px" }}>
                      <button
                        className="btn-sm"
                        style={{
                          background: "var(--color-paper)",
                          borderColor: "var(--color-forest-ink)",
                          color: "var(--color-forest-ink)",
                          fontWeight: 600,
                        }}
                        onClick={toggleVoice}
                      >
                        {playing ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play voice note</>}
                      </button>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-forest-ink)" }}>
                        {l.voice}s recording
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="row" style={{ gap: "8px", color: "var(--color-forest-ink)", fontSize: "14px" }}>
                    <Mic size={16} />
                    <span>Voice description: {l.voice}s</span>
                  </div>
                )}
              </div>
            )}

            <div className="grid g2" style={{ marginTop: "20px" }}>
              <div>
                <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: "var(--color-slate)" }}>Available</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-obsidian)", marginTop: "4px" }}>{l.qty} {l.unit}</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: "var(--color-slate)" }}>Market reference</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-obsidian)", marginTop: "4px" }}>{ugx(l.ref)} / {l.unit}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 12px", color: "var(--color-obsidian)" }}>Location</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-forest-ink)", fontSize: "15px", fontWeight: 500 }}>
              <MapPin size={18} /> {l.district} district
            </div>
          </div>

          {other.length > 0 && (
            <div className="card">
              <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 16px", color: "var(--color-obsidian)" }}>More from this seller</h2>
              <div className="grid g3">
                {other.map(o => (
                  <button
                    key={o.id}
                    className="listing"
                    onClick={() => onOpen(o.id)}
                    style={{ textAlign: "left", cursor: "pointer", padding: 0 }}
                  >
                    <div style={{ background: "var(--color-fog)", height: 70, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                      <span>{EMOJI[o.cat]}</span>
                    </div>
                    <div style={{ padding: "10px" }}>
                      <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>{o.name}</h4>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-forest-ink)", marginTop: "4px" }}>
                        {ugx(o.price)} / {o.unit}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="stack" style={{ position: "sticky", top: 90, gap: "16px" }}>
          <div className="card">
            <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-forest-ink)" }}>{ugx(l.price)}</div>
            <div style={{ fontSize: "13px", color: "var(--color-slate)", marginTop: "2px" }}>per {l.unit} · ref {ugx(l.ref)}</div>
            <div className="rule" style={{ margin: "16px 0" }} />
            <Field label={`Quantity (${l.unit})`}>
              <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
                <button className="btn-sm" onClick={() => setQty(q => Math.max(1, q - 5))}>-</button>
                <input
                  type="number"
                  value={qty}
                  min="1"
                  max={l.qty}
                  style={{ textAlign: "center", fontWeight: 600 }}
                  onChange={e => setQty(Math.max(1, Math.min(l.qty, Number(e.target.value) || 1)))}
                />
                <button className="btn-sm" onClick={() => setQty(q => Math.min(l.qty, q + 5))}>+</button>
              </div>
            </Field>
            <div className="between" style={{ marginTop: "16px", alignItems: "center" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-slate)" }}>Total</span>
              <strong style={{ fontSize: "20px", color: "var(--color-obsidian)" }}>{ugx(qty * l.price)}</strong>
            </div>
            <div style={{ marginTop: "16px" }}>
              <Button
                variant="primary"
                style={{ width: "100%" }}
                disabled={l.qty === 0}
                onClick={() => onAdd(l, qty)}
              >
                {l.qty === 0 ? "Sold out" : "Add to basket"}
              </Button>
            </div>
          </div>

          <div className="card">
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--color-obsidian)" }}>{l.seller}</h3>
            <div style={{ fontSize: "13px", color: "var(--color-slate)", marginTop: "4px" }}>
              {typeLabel(l.sellerType)} · {l.district}
            </div>
            <div className="row" style={{ marginTop: "10px", gap: "6px" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-forest-ink)" }}>
                {l.rating ? `${l.rating} ★` : "New seller"}
              </span>
              {l.ratings > 0 && <span style={{ fontSize: "12px", color: "var(--color-pebble)" }}>({l.ratings} reviews)</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
