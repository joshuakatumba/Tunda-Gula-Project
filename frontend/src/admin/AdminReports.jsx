import { useState, useMemo, useEffect, useCallback } from "react";
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
import { useI18n } from "../context/I18nContext";
const fmtUgx = (n) => `UGX ${Number(n).toLocaleString()}`;
export default function AdminReports({ listings, say }) {
  const { t } = useI18n();
  const [filter, setFilter] = useState("All");
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  const [cats, setCats] = useState(STATIC_CATEGORIES.map((name) => ({ id: null, name, examples: CAT_EG[name] || "" })));
  const [editing, setEditing] = useState(null);
  const loadTxns = useCallback(async () => {
    try {
      const data = await api.get(ENDPOINTS.reportTransactions);
      setTxns(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      say(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);
  const loadCats = useCallback(async () => {
    try {
      const data = await api.get(ENDPOINTS.categories);
      const items = Array.isArray(data) ? data : data.results || [];
      const db = items.map((c) => ({ id: c.id, name: c.name, examples: c.examples || CAT_EG[c.name] || "" }));
      const missing = STATIC_CATEGORIES.filter((n) => !db.some((c) => c.name === n)).map((name) => ({ id: null, name, examples: CAT_EG[name] || "" }));
      setCats([...db, ...missing]);
    } catch {
    }
  }, []);
  useEffect(() => {
    loadTxns();
    loadCats();
  }, [loadTxns, loadCats]);
  const runExport = async (key, path, filename) => {
    setExporting(key);
    try {
      await api.download(path, filename);
      say(t("toast.export_done"));
    } catch (err) {
      say(err?.message || t("err.export_failed"));
    } finally {
      setExporting(null);
    }
  };
  const stamp = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const filteredTxns = useMemo(
    () => filter === "All" ? txns : txns.filter((tx) => tx.status === filter),
    [filter, txns]
  );
  const txTypeLabel = (type) => type === "Payment" ? t("admin.tx_payment") : type === "Payout" ? t("admin.tx_payout") : type === "Commission" ? t("admin.tx_commission") : type;
  const txnColumns = [
    { key: "id", label: "ID", render: (r) => <span style={{ fontFamily: "var(--font-monospace)" }}>{r.id}</span> },
    { key: "date", label: t("admin.col_date") },
    { key: "user", label: t("admin.col_entity") },
    { key: "type", label: t("admin.col_type"), render: (r) => txTypeLabel(r.type) },
    { key: "amount", label: t("admin.col_amount"), render: (r) => <span style={{ fontFamily: "var(--font-monospace)", fontWeight: 600 }}>{fmtUgx(r.amount)}</span> },
    { key: "status", label: t("admin.col_status"), render: (r) => <Badge tone={r.status === "Success" ? "b-green" : "b-red"}>{r.status === "Success" ? t("admin.status_success") : t("admin.status_failed")}</Badge> }
  ];
  const saveCategory = async (c) => {
    try {
      if (c.id) await api.patch(ENDPOINTS.category(c.id), { name: c.name, examples: c.examples });
      else await api.post(ENDPOINTS.categories, { name: c.name, examples: c.examples });
      say(c.id ? t("toast.cat_updated", { name: c.name }) : t("toast.cat_added", { name: c.name }));
      setEditing(null);
      loadCats();
    } catch (err) {
      say(formatApiError(err));
    }
  };
  const deleteCategory = async (c) => {
    if (!c.id) {
      say(t("toast.cat_builtin"));
      return;
    }
    if (!window.confirm(t("admin.confirm_del_cat", { name: c.name }))) return;
    try {
      await api.delete(ENDPOINTS.category(c.id));
      say(t("toast.cat_deleted", { name: c.name }));
      setEditing(null);
      loadCats();
    } catch (err) {
      say(formatApiError(err));
    }
  };
  const reportCards = [
    ["users", t("admin.user_reg_title"), t("admin.user_reg_desc"), ENDPOINTS.reportUsersCsv, `user-registrations-${stamp}.csv`],
    ["gmv", t("admin.gmv_title"), t("admin.gmv_desc"), ENDPOINTS.reportGmvCsv, `gmv-summary-${stamp}.csv`]
  ];
  return <><Head title={t("admin.reports_title")} /><div className="grid g2" style={{ marginBottom: 32 }}>{reportCards.map(([key, n, d, path, file]) => <div className="card" key={key}><h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--color-obsidian)" }}>{n}</h3><p style={{ margin: "6px 0 16px", fontSize: "13px", color: "var(--color-slate)", minHeight: "36px" }}>{d}</p><Button
    variant="outline"
    style={{ width: "100%" }}
    disabled={exporting === key}
    onClick={() => runExport(key, path, file)}
  >{exporting === key ? t("admin.preparing") : t("admin.export_csv")}</Button></div>)}</div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}><h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-obsidian)", margin: 0 }}>
          {t("admin.recent_txns")}
        </h2><Button
    variant="outline"
    className="btn-sm"
    style={{ minHeight: 40, padding: "8px 20px", fontSize: 14 }}
    disabled={exporting === "txn"}
    onClick={() => runExport("txn", ENDPOINTS.reportTransactionsCsv, `transactions-${stamp}.csv`)}
  >{exporting === "txn" ? t("admin.preparing") : t("admin.export_btn")}</Button></div><div style={{ marginBottom: "16px" }}><FilterChips
    options={[{ id: "All", label: t("common.all") }, { id: "Success", label: t("admin.status_success") }, { id: "Failed", label: t("admin.status_failed") }]}
    activeId={filter}
    onChange={setFilter}
  /></div><div className="card" style={{ padding: 0 }}>{loading ? <div style={{ textAlign: "center", color: "var(--color-slate)", padding: "24px" }}>{t("admin.loading_txns")}</div> : filteredTxns.length === 0 ? <div style={{ textAlign: "center", color: "var(--color-slate)", padding: "24px" }}>
            {t("admin.no_txns")}
          </div> : <ResponsiveTable columns={txnColumns} data={filteredTxns} keyField="id" />}</div><h2 style={{ marginTop: "32px", marginBottom: "16px", fontSize: "20px", fontWeight: 700, color: "var(--color-obsidian)" }}>
        {t("admin.produce_cats")}
      </h2><div className="card"><div className="stack" style={{ gap: "12px" }}>{cats.map((c) => <div
    className="between"
    key={c.name}
    style={{ borderBottom: "1px solid var(--color-fog)", paddingBottom: "12px", alignItems: "center" }}
  ><div className="row" style={{ gap: "12px" }}><span style={{ fontSize: "22px" }}>{EMOJI[c.name] || "\u{1F331}"}</span><div><strong style={{ fontSize: "15px", color: "var(--color-obsidian)" }}>{t(`cat.${c.name}`) !== `cat.${c.name}` ? t(`cat.${c.name}`) : c.name}</strong><div style={{ fontSize: "12px", color: "var(--color-slate)", marginTop: "2px" }}>{t("admin.listings_count", { count: listings.filter((l) => l.cat === c.name).length })}{c.examples ? ` \xB7 ${c.examples}` : ""}</div></div></div><button className="btn-sm" onClick={() => setEditing(c)}>{t("admin.manage")}</button></div>)}<div style={{ paddingTop: "8px" }}><Button variant="outline" onClick={() => setEditing({ id: null, name: "", examples: "" })}>
              {t("admin.add_cat_btn")}
            </Button></div></div></div>{editing && <CategoryModal
    cat={editing}
    onClose={() => setEditing(null)}
    onSave={saveCategory}
    onDelete={deleteCategory}
  />}</>;
}
function CategoryModal({ cat, onClose, onSave, onDelete }) {
  const { t } = useI18n();
  const [name, setName] = useState(cat.name);
  const [examples, setExamples] = useState(cat.examples);
  const isNew = !cat.id && !cat.name;
  return <Modal
    title={isNew ? t("admin.add_cat") : t("admin.manage_cat", { name: cat.name })}
    onClose={onClose}
    footer={<div className="row" style={{ gap: 12 }}>{!isNew && <Button variant="outline" onClick={() => onDelete(cat)}>{t("common.delete")}</Button>}<Button variant="primary" block disabled={!name.trim()} onClick={() => onSave({ ...cat, name: name.trim(), examples })}>{isNew ? t("admin.add_cat") : t("admin.save_changes")}</Button></div>}
  ><Field label={t("admin.cat_name")}><input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("admin.cat_placeholder")} /></Field><Field label={t("admin.examples")}><input value={examples} onChange={(e) => setExamples(e.target.value)} placeholder={t("admin.examples_placeholder")} /></Field></Modal>;
}
