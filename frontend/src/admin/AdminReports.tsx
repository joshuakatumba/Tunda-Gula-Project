import React, { useState, useMemo, useEffect, useCallback } from "react";
import { EMOJI, CATEGORIES as STATIC_CATEGORIES, CAT_EG } from "../data/categories";
import { Head } from "../components/Head";
import { Button } from "../components/ui/Button";
import { FilterChips } from "../components/FilterChips";
import { ResponsiveTable } from "../components/ResponsiveTable";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { formatApiError } from "../utils/errorHandler";

type Txn = { id: string; date: string; user: string; type: string; amount: number; status: string };
type Cat = { id: number | null; name: string; examples: string };

const fmtUgx = (n: number) => `UGX ${Number(n).toLocaleString()}`;

export default function AdminReports({ listings, say }) {
  const [filter, setFilter] = useState("All");
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [cats, setCats] = useState<Cat[]>(STATIC_CATEGORIES.map(name => ({ id: null, name, examples: CAT_EG[name] || "" })));
  const [editing, setEditing] = useState<Cat | null>(null);

  const loadTxns = useCallback(async () => {
    try {
      const data = await api.get(ENDPOINTS.reportTransactions);
      setTxns(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      say(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCats = useCallback(async () => {
    try {
      const data = await api.get(ENDPOINTS.categories);
      const items = Array.isArray(data) ? data : data.results || [];
      const db: Cat[] = items.map((c: any) => ({ id: c.id, name: c.name, examples: c.examples || CAT_EG[c.name] || "" }));
      const missing = STATIC_CATEGORIES
        .filter(n => !db.some(c => c.name === n))
        .map(name => ({ id: null, name, examples: CAT_EG[name] || "" }));
      setCats([...db, ...missing]);
    } catch { /* keep static fallback */ }
  }, []);

  useEffect(() => { loadTxns(); loadCats(); }, [loadTxns, loadCats]);

  const runExport = async (key: string, path: string, filename: string) => {
    setExporting(key);
    try {
      await api.download(path, filename);
      say("Export downloaded");
    } catch (err: any) {
      say(err?.message || "Export failed");
    } finally {
      setExporting(null);
    }
  };

  const stamp = new Date().toISOString().slice(0, 10);

  const filteredTxns = useMemo(
    () => (filter === "All" ? txns : txns.filter(t => t.status === filter)),
    [filter, txns]
  );

  const txnColumns = [
    { key: "id", label: "ID", render: r => <span style={{ fontFamily: "var(--font-monospace)" }}>{r.id}</span> },
    { key: "date", label: "Date" },
    { key: "user", label: "User / Entity" },
    { key: "type", label: "Type" },
    { key: "amount", label: "Amount", render: r => <span style={{ fontFamily: "var(--font-monospace)", fontWeight: 600 }}>{fmtUgx(r.amount)}</span> },
    { key: "status", label: "Status", render: r => <Badge tone={r.status === "Success" ? "b-green" : "b-red"}>{r.status}</Badge> },
  ];

  const saveCategory = async (c: Cat) => {
    try {
      if (c.id) await api.patch(ENDPOINTS.category(c.id), { name: c.name, examples: c.examples });
      else await api.post(ENDPOINTS.categories, { name: c.name, examples: c.examples });
      say(c.id ? `${c.name} updated` : `${c.name} added`);
      setEditing(null);
      loadCats();
    } catch (err) {
      say(formatApiError(err));
    }
  };

  const deleteCategory = async (c: Cat) => {
    if (!c.id) { say("Built-in category — add it to the database first to manage it"); return; }
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    try {
      await api.delete(ENDPOINTS.category(c.id));
      say(`${c.name} deleted`);
      setEditing(null);
      loadCats();
    } catch (err) {
      say(formatApiError(err));
    }
  };

  const reportCards: [string, string, string, string][] = [
    ["User Registrations", "User directory with account types and verification states.", ENDPOINTS.reportUsersCsv, `user-registrations-${stamp}.csv`],
    ["GMV Summary", "Gross marketplace volume and fee totals.", ENDPOINTS.reportGmvCsv, `gmv-summary-${stamp}.csv`],
  ];

  return (
    <>
      <Head title="Reports & Transactions" />

      <div className="grid g2" style={{ marginBottom: 32 }}>
        {reportCards.map(([n, d, path, file]) => (
          <div className="card" key={n}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--color-obsidian)" }}>{n}</h3>
            <p style={{ margin: "6px 0 16px", fontSize: "13px", color: "var(--color-slate)", minHeight: "36px" }}>{d}</p>
            <Button
              variant="outline"
              style={{ width: "100%" }}
              disabled={exporting === n}
              onClick={() => runExport(n, path, file)}
            >
              {exporting === n ? "Preparing…" : "Export CSV"}
            </Button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-obsidian)", margin: 0 }}>
          Recent Transactions
        </h2>
        <Button
          variant="outline"
          className="btn-sm"
          style={{ minHeight: 40, padding: "8px 20px", fontSize: 14 }}
          disabled={exporting === "txn"}
          onClick={() => runExport("txn", ENDPOINTS.reportTransactionsCsv, `transactions-${stamp}.csv`)}
        >
          {exporting === "txn" ? "Preparing…" : "Export"}
        </Button>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <FilterChips
          options={[{ id: "All", label: "All" }, { id: "Success", label: "Success" }, { id: "Failed", label: "Failed" }]}
          activeId={filter}
          onChange={setFilter}
        />
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "var(--color-slate)", padding: "24px" }}>Loading transactions…</div>
        ) : filteredTxns.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--color-slate)", padding: "24px" }}>
            No {filter === "All" ? "" : filter.toLowerCase() + " "}transactions yet.
          </div>
        ) : (
          <ResponsiveTable columns={txnColumns} data={filteredTxns} keyField="id" />
        )}
      </div>

      <h2 style={{ marginTop: "32px", marginBottom: "16px", fontSize: "20px", fontWeight: 700, color: "var(--color-obsidian)" }}>
        Produce Categories
      </h2>
      <div className="card">
        <div className="stack" style={{ gap: "12px" }}>
          {cats.map(c => (
            <div
              className="between"
              key={c.name}
              style={{ borderBottom: "1px solid var(--color-fog)", paddingBottom: "12px", alignItems: "center" }}
            >
              <div className="row" style={{ gap: "12px" }}>
                <span style={{ fontSize: "22px" }}>{EMOJI[c.name] || "🌱"}</span>
                <div>
                  <strong style={{ fontSize: "15px", color: "var(--color-obsidian)" }}>{c.name}</strong>
                  <div style={{ fontSize: "12px", color: "var(--color-slate)", marginTop: "2px" }}>
                    {listings.filter(l => l.cat === c.name).length} listings{c.examples ? ` · ${c.examples}` : ""}
                  </div>
                </div>
              </div>
              <button className="btn-sm" onClick={() => setEditing(c)}>Manage</button>
            </div>
          ))}
          <div style={{ paddingTop: "8px" }}>
            <Button variant="outline" onClick={() => setEditing({ id: null, name: "", examples: "" })}>
              + Add category
            </Button>
          </div>
        </div>
      </div>

      {editing && (
        <CategoryModal
          cat={editing}
          onClose={() => setEditing(null)}
          onSave={saveCategory}
          onDelete={deleteCategory}
        />
      )}
    </>
  );
}

function CategoryModal({ cat, onClose, onSave, onDelete }: {
  cat: Cat; onClose: () => void; onSave: (c: Cat) => void; onDelete: (c: Cat) => void;
}) {
  const [name, setName] = useState(cat.name);
  const [examples, setExamples] = useState(cat.examples);
  const isNew = !cat.id && !cat.name;
  return (
    <Modal
      title={isNew ? "Add category" : `Manage ${cat.name}`}
      onClose={onClose}
      footer={
        <div className="row" style={{ gap: 12 }}>
          {!isNew && <Button variant="outline" onClick={() => onDelete(cat)}>Delete</Button>}
          <Button variant="primary" block disabled={!name.trim()} onClick={() => onSave({ ...cat, name: name.trim(), examples })}>
            {isNew ? "Add category" : "Save changes"}
          </Button>
        </div>
      }
    >
      <Field label="Category name">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Herbs" />
      </Field>
      <Field label="Examples">
        <input value={examples} onChange={e => setExamples(e.target.value)} placeholder="e.g. Basil, mint, coriander" />
      </Field>
    </Modal>
  );
}
