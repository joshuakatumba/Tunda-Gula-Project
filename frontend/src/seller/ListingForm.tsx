import React, { useState, useEffect, useRef } from "react";
import { Camera, Mic, Square, MapPin, Loader2, X } from "lucide-react";
import { CATEGORIES } from "../data/categories";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";

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
      setError("Microphone access denied.");
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
      setError(err.message || "Failed to save listing.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="List produce" onClose={onClose}>
      {error && (
        <div style={{ color: "var(--color-alarm-red)", background: "#FCE8E8", padding: "12px 16px", borderRadius: "var(--radius-cards)", fontSize: "13px" }}>
          {error}
        </div>
      )}
      <Field label="Produce name">
        <input value={d.name} placeholder="e.g. Fresh tomatoes" onChange={e => setD({ ...d, name: e.target.value })} />
      </Field>
      <Field label="Category">
        <Select
          value={d.cat}
          onChange={val => setD({ ...d, cat: val })}
          options={CATEGORIES}
          grid={true}
        />
      </Field>
      <div className="grid g3">
        <Field label="Quantity">
          <input type="number" value={d.qty} onChange={e => setD({ ...d, qty: Number(e.target.value) })} />
        </Field>
        <Field label="Unit">
          <Select
            value={d.unit}
            onChange={val => setD({ ...d, unit: val })}
            options={["kg", "bunch", "bag", "head", "tray"]}
            grid={false}
          />
        </Field>
        <Field label="Price per unit (UGX)">
          <input type="number" value={d.price} onChange={e => setD({ ...d, price: Number(e.target.value) })} />
        </Field>
      </div>
      <Field label="Description">
        <textarea rows={2} value={d.note} placeholder="Add details..." onChange={e => setD({ ...d, note: e.target.value })} />
      </Field>

      {/* Photos */}
      <Field label="Photos">
        <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
          {photos.map((f, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img
                src={URL.createObjectURL(f)}
                alt={f.name}
                style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: "1px solid var(--color-fog)" }}
              />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  background: "var(--color-alarm-red)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: 18,
                  height: 18,
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={10} />
              </button>
            </div>
          ))}
          {photos.length < 5 && (
            <button
              type="button"
              className="btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={() => photoInputRef.current?.click()}
            >
              <Camera size={14} /> Add photo
            </button>
          )}
        </div>
        <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePhotoChange} />
      </Field>

      {/* Voice note */}
      <Field label="Voice description">
        {rec ? (
          <button
            type="button"
            className="btn-sm"
            onClick={stopRecording}
            style={{ borderColor: "var(--color-alarm-red)", color: "var(--color-alarm-red)", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Square size={14} fill="currentColor" /> Stop recording ({voiceDuration}s)
          </button>
        ) : voiceBlob ? (
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <audio controls src={URL.createObjectURL(voiceBlob)} style={{ height: 32 }} />
            <button
              type="button"
              className="btn-sm"
              onClick={startRecording}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Mic size={14} /> Record again
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn-sm"
            onClick={startRecording}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Mic size={14} /> Record voice note
          </button>
        )}
      </Field>

      {/* GPS */}
      <Field label="Farm location">
        <div className="row" style={{ gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            className="btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => {
              navigator.geolocation?.getCurrentPosition(
                pos => setGps(`${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`),
                () => setGps("Location pinned to district")
              );
            }}
          >
            <MapPin size={14} /> Use GPS
          </button>
          <span style={{ fontSize: "13px", fontFamily: "var(--font-monospace)", color: "var(--color-slate)" }}>
            {gps || "Not pinned"}
          </span>
        </div>
      </Field>

      <Button
        variant="primary"
        style={{ width: "100%", marginTop: "8px" }}
        disabled={!d.name || busy}
        onClick={handleSave}
      >
        {busy ? <Loader2 size={16} className="spin" /> : "Publish listing"}
      </Button>
    </Modal>
  );
}
