import React, { useState, useEffect } from "react";
import { Camera, Mic, Square, MapPin } from "lucide-react";
import { CATEGORIES } from "../data/categories";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";

export default function ListingForm({ onClose, onSave }) {
  const [d, setD] = useState({ name: "", cat: "Vegetables", qty: 100, unit: "kg", price: 2000, photos: 0, voice: 0, note: "" });
  const [rec, setRec] = useState(false);
  const [gps, setGps] = useState(null);
  useEffect(() => { if (!rec) return; const i = setInterval(() => setD(x => ({ ...x, voice: x.voice + 1 })), 1000); return () => clearInterval(i); }, [rec]);
  return (
    <Modal title="List produce" onClose={onClose}>
      <Field label="What are you selling"><input value={d.name} placeholder="Fresh tomatoes" onChange={e => setD({ ...d, name: e.target.value })} /></Field>
      <Field label="Category"><select value={d.cat} onChange={e => setD({ ...d, cat: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></Field>
      <div className="grid g3">
        <Field label="Quantity"><input type="number" value={d.qty} onChange={e => setD({ ...d, qty: Number(e.target.value) })} /></Field>
        <Field label="Unit"><select value={d.unit} onChange={e => setD({ ...d, unit: e.target.value })}>{["kg", "bunch", "bag", "head", "tray"].map(u => <option key={u}>{u}</option>)}</select></Field>
        <Field label="Price per unit"><input type="number" value={d.price} onChange={e => setD({ ...d, price: Number(e.target.value) })} /></Field>
      </div>
      <Field label="Description (optional)"><textarea rows="2" value={d.note} placeholder="Picked this morning, sorted by size…" onChange={e => setD({ ...d, note: e.target.value })} /></Field>
      <Field label="Photos" hint="Photos are compressed on your phone before sending, to save data.">
        <button className="btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setD({ ...d, photos: d.photos + 1 })}><Camera size="1em" /> Take a photo ({d.photos} added)</button>
      </Field>
      <Field label="Voice description" hint="Instead of typing. Buyers play it on your listing.">
        <button className="btn-sm" onClick={() => setRec(r => !r)} style={rec ? { borderColor: "#B4451F", color: "#B4451F", display: 'inline-flex', alignItems: 'center', gap: 6 } : { display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {rec ? <><Square size="1em" fill="currentColor" /> Stop recording · {d.voice}s</> : d.voice ? <><Mic size="1em" /> Record again ({d.voice}s saved)</> : <><Mic size="1em" /> Describe your produce out loud</>}
        </button>
      </Field>
      <Field label="Farm location" hint="Buyers only see your district, never your exact coordinates.">
        <div className="row"><button className="btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setGps("0.4044°N, 32.4594°E")}><MapPin size="1em" /> Use my location</button>
          <span className="hint mono">{gps || "Not pinned — you can also type your village"}</span></div>
      </Field>
      <button className="btn-maize" disabled={!d.name} onClick={() => onSave(d)}>Put it on the market</button>
    </Modal>
  );
}
