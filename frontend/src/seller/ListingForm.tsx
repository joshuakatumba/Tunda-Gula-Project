import React, { useState, useEffect, useRef } from "react";
import { Camera, Mic, Square, MapPin, Loader2, X } from "lucide-react";
import { CATEGORIES } from "../data/categories";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";

// Use raw fetch for multipart/form-data — the api client sets Content-Type: application/json
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001/api/v1";

export default function ListingForm({ onClose, onSave }) {
  const [d, setD] = useState({ name: "", cat: "Vegetables", qty: 100, unit: "kg", price: 2000, note: "" });
  const [photos, setPhotos] = useState<File[]>([]);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [rec, setRec] = useState(false);
  const [gps, setGps] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  // Recording timer
  useEffect(() => {
    if (rec) {
      timerRef.current = setInterval(() => setVoiceDuration(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [rec]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setVoiceBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRec(true);
      setVoiceDuration(0);
    } catch {
      setError("Microphone access denied. Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRec(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files).slice(0, 5 - photos.length);
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setBusy(true);
    setError("");
    try {
      const token = localStorage.getItem("tg_token");
      const form = new FormData();
      form.append("name", d.name);
      form.append("category", d.cat);
      form.append("quantity", String(d.qty));
      form.append("unit", d.unit);
      form.append("price", String(d.price));
      form.append("description", d.note);
      form.append("voice_duration", String(voiceDuration));

      photos.forEach(photo => form.append("photo_files", photo));
      if (voiceBlob) form.append("voice_file", voiceBlob, "voice_note.webm");

      const res = await fetch(`${API_URL}/listings/`, {
        method: "POST",
        headers: token ? { Authorization: `Token ${token}` } : {},
        body: form,
      });

      const data = await res.json();
      if (!res.ok) {
        const firstKey = Object.keys(data)[0];
        throw new Error(`${firstKey}: ${Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey]}`);
      }
      onSave(data);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save listing. Make sure your account is verified.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="List produce" onClose={onClose}>
      {error && <div className="sms" style={{ color: "#A3320B", background: "#FFF0EC" }}>{error}</div>}
      <Field label="What are you selling"><input value={d.name} placeholder="Fresh tomatoes" onChange={e => setD({ ...d, name: e.target.value })} /></Field>
      <Field label="Category"><select value={d.cat} onChange={e => setD({ ...d, cat: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></Field>
      <div className="grid g3">
        <Field label="Quantity"><input type="number" value={d.qty} onChange={e => setD({ ...d, qty: Number(e.target.value) })} /></Field>
        <Field label="Unit"><select value={d.unit} onChange={e => setD({ ...d, unit: e.target.value })}>{["kg", "bunch", "bag", "head", "tray"].map(u => <option key={u}>{u}</option>)}</select></Field>
        <Field label="Price per unit (UGX)"><input type="number" value={d.price} onChange={e => setD({ ...d, price: Number(e.target.value) })} /></Field>
      </div>
      <Field label="Description (optional)"><textarea rows={2} value={d.note} placeholder="Picked this morning, sorted by size…" onChange={e => setD({ ...d, note: e.target.value })} /></Field>

      {/* Photos */}
      <Field label="Photos" hint={`${photos.length}/5 photos added. Compressed before sending to save data.`}>
        <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
          {photos.map((f, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img src={URL.createObjectURL(f)} alt={f.name} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 6, border: "1px solid #DDE6D2" }} />
              <button onClick={() => removePhoto(i)} style={{ position: "absolute", top: -6, right: -6, background: "#A3320B", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><X size={10} /></button>
            </div>
          ))}
          {photos.length < 5 && (
            <button className="btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => photoInputRef.current?.click()}>
              <Camera size="1em" /> Add photo
            </button>
          )}
        </div>
        <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePhotoChange} />
      </Field>

      {/* Voice note */}
      <Field label="Voice description" hint="Record yourself describing the produce. Buyers play it on your listing.">
        {rec ? (
          <button className="btn-sm" onClick={stopRecording} style={{ borderColor: "#B4451F", color: "#B4451F", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Square size="1em" fill="currentColor" /> Stop recording · {voiceDuration}s
          </button>
        ) : voiceBlob ? (
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <audio controls src={URL.createObjectURL(voiceBlob)} style={{ height: 32 }} />
            <button className="btn-sm" onClick={startRecording} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Mic size="1em" /> Record again</button>
          </div>
        ) : (
          <button className="btn-sm" onClick={startRecording} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Mic size="1em" /> Describe your produce out loud
          </button>
        )}
      </Field>

      {/* GPS */}
      <Field label="Farm location" hint="Buyers only see your district, never your exact coordinates.">
        <div className="row">
          <button className="btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => {
            navigator.geolocation?.getCurrentPosition(
              pos => setGps(`${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`),
              () => setGps("Location unavailable — district will be used")
            );
          }}><MapPin size="1em" /> Use my location</button>
          <span className="hint mono">{gps || "Not pinned"}</span>
        </div>
      </Field>

      <button className="btn-maize" disabled={!d.name || busy} onClick={handleSave}>
        {busy ? <Loader2 size="1em" className="spin" /> : "Put it on the market"}
      </button>
    </Modal>
  );
}
