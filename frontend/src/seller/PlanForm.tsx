import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { CATEGORIES } from "../data/categories";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
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
      onSave(result);
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
    <Modal title="New harvest plan" onClose={onClose}>
      {error && (
        <div style={{ color: "var(--color-alarm-red)", background: "#FCE8E8", padding: "12px 16px", borderRadius: "var(--radius-cards)", fontSize: "13px" }}>
          {error}
        </div>
      )}
      <Field label="Crop name">
        <input value={d.name} placeholder="e.g. Green peppers" onChange={e => setD({ ...d, name: e.target.value })} />
      </Field>
      <Field label="Category">
        <Select
          value={d.cat}
          onChange={val => setD({ ...d, cat: val })}
          options={CATEGORIES}
          grid={true}
        />
      </Field>
      <div className="grid g2">
        <Field label="Date planted">
          <input type="date" value={d.planted} onChange={e => setD({ ...d, planted: e.target.value })} />
        </Field>
        <Field label="Expected harvest">
          <input type="date" value={d.harvest} onChange={e => setD({ ...d, harvest: e.target.value })} />
        </Field>
      </div>
      <div className="grid g3">
        <Field label="Expected quantity">
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
      <Field label="Required deposit percentage">
        <Select
          value={String(d.deposit)}
          onChange={val => setD({ ...d, deposit: Number(val) })}
          options={[
            { value: "20", label: "20%" },
            { value: "25", label: "25%" },
            { value: "30", label: "30%" },
            { value: "40", label: "40%" },
            { value: "50", label: "50%" },
          ]}
          grid={true}
        />
      </Field>
      <Button
        variant="primary"
        style={{ width: "100%", marginTop: "8px" }}
        disabled={!d.name || busy}
        onClick={handleSave}
      >
        {busy ? <Loader2 size={16} className="spin" /> : "Save harvest plan"}
      </Button>
    </Modal>
  );
}
