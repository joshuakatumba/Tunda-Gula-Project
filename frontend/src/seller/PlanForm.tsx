import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { CATEGORIES } from "../data/categories";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";

export default function PlanForm({ onClose, onSave }) {
  const [d, setD] = useState({ name: "", cat: "Vegetables", planted: "2026-06-01", harvest: "2026-10-15", qty: 500, unit: "kg", price: 2500, deposit: 30 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setBusy(true);
    setError("");
    try {
      const payload = {
        name: d.name,
        category: d.cat,
        date_planted: d.planted,
        expected_harvest: d.harvest,
        quantity: d.qty,
        unit: d.unit,
        price: d.price,
        deposit_percentage: d.deposit,
      };
      const result = await api.post(ENDPOINTS.plans, payload);
      onSave(result); // Instant UI update
      onClose();
    } catch (err: any) {
      const data = err.data;
      if (data && typeof data === "object") {
        const firstKey = Object.keys(data)[0];
        setError(`${firstKey}: ${Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey]}`);
      } else {
        setError(err.message || "Failed to save plan.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Add a harvest plan" onClose={onClose}>
      {error && <div className="sms" style={{ color: "#A3320B", background: "#FFF0EC" }}>{error}</div>}
      <Field label="Crop"><input value={d.name} placeholder="Green peppers" onChange={e => setD({ ...d, name: e.target.value })} /></Field>
      <Field label="Category"><select value={d.cat} onChange={e => setD({ ...d, cat: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></Field>
      <div className="grid g2">
        <Field label="Date planted"><input type="date" value={d.planted} onChange={e => setD({ ...d, planted: e.target.value })} /></Field>
        <Field label="Expected harvest"><input type="date" value={d.harvest} onChange={e => setD({ ...d, harvest: e.target.value })} /></Field>
      </div>
      <div className="grid g3">
        <Field label="Expected quantity"><input type="number" value={d.qty} onChange={e => setD({ ...d, qty: Number(e.target.value) })} /></Field>
        <Field label="Unit"><select value={d.unit} onChange={e => setD({ ...d, unit: e.target.value })}>{["kg", "bunch", "bag"].map(u => <option key={u}>{u}</option>)}</select></Field>
        <Field label="Price per unit (UGX)"><input type="number" value={d.price} onChange={e => setD({ ...d, price: Number(e.target.value) })} /></Field>
      </div>
      <Field label="Deposit buyers must pay">
        <select value={d.deposit} onChange={e => setD({ ...d, deposit: Number(e.target.value) })}>{[20, 25, 30, 40, 50].map(p => <option key={p} value={p}>{p}%</option>)}</select>
      </Field>
      <button className="btn-maize" disabled={!d.name || busy} onClick={handleSave}>
        {busy ? <Loader2 size="1em" className="spin" /> : "Post harvest plan"}
      </button>
    </Modal>
  );
}
