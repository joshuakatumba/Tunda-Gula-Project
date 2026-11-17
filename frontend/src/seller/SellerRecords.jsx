import React, { useState, useEffect, useCallback } from "react";
import { Loader2, TrendingUp, Download, Trash2 } from "lucide-react";
import { ugx } from "../utils/helpers";
import { Head } from "../components/Head";
import { Stat } from "../components/Stat";
import { Field } from "../components/Field";
import { Modal } from "../components/Modal";
import { Button } from "../components/ui/Button";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { useI18n } from "../context/I18nContext";

const EXP_CATS = ["seeds", "fertilizer", "labor", "transport", "other"];

export default function SellerRecords({ say }) {
  const { t, tp } = useI18n();
  const [analytics, setAnalytics] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    crop_name: "",
    category: "seeds",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [anRes, expRes] = await Promise.all([
        api.get(ENDPOINTS.sellerAnalytics),
        api.get(ENDPOINTS.expenses),
      ]);
      setAnalytics(anRes);
      setExpenses(Array.isArray(expRes) ? expRes : expRes?.results || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.crop_name.trim() || !form.amount) return;
    setBusy(true);
    try {
      await api.post(ENDPOINTS.expenses, {
        crop_name: form.crop_name.trim(),
        category: form.category,
        amount: Number(form.amount),
        date: form.date,
      });
      setAdding(false);
      setForm({ crop_name: "", category: "seeds", amount: "", date: new Date().toISOString().split("T")[0] });
      say?.(t("common.save"));
      load();
    } catch {
      say?.("Failed to save");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(ENDPOINTS.expense(id));
      load();
    } catch {}
  };

  const exportCsv = () => {
    const rows = [
      ["Date", "Crop", "Category", "Amount (UGX)"],
      ...expenses.map((e) => [e.date, e.crop_name, e.category, e.amount]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `farm-statement-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Head
        title={t("seller.records")}
        action={
          <div className="row" style={{ gap: 8 }}>
            {expenses.length > 0 && (
              <Button variant="outline" size="sm" onClick={exportCsv}>
                <Download size={14} /> {t("seller.export_csv")}
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={() => setAdding(true)}>
              {t("seller.add_expense")}
            </Button>
          </div>
        }
      />

      <div className="grid g3">
        <Stat label={t("seller.revenue")} value={ugx(analytics?.total_revenue ?? 0)} />
        <Stat label={t("seller.expenses")} value={ugx(analytics?.total_expenses ?? 0)} />
        <Stat
          label={t("seller.net_profit")}
          value={ugx(analytics?.net_profit ?? 0)}
          sub={analytics ? `${analytics.margin_pct}%` : undefined}
        />
      </div>

      {analytics?.insights?.length > 0 && (
        <div className="card" style={{ marginTop: 16, padding: 14 }}>
          <div className="row" style={{ gap: 8, marginBottom: 10, alignItems: "center" }}>
            <TrendingUp size={16} color="var(--color-forest-ink)" />
            <strong style={{ fontSize: 14 }}>{t("seller.insights")}</strong>
          </div>
          <div className="stack" style={{ gap: 6 }}>
            {analytics.insights.map((ins, i) => (
              <div key={i} style={{ fontSize: 13, color: "var(--color-charcoal)" }}>
                • {ins.text}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 16, padding: 14 }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--color-slate)" }}>{t("common.loading")}</div>
        ) : expenses.length === 0 ? (
          <div style={{ padding: 28, textAlign: "center", color: "var(--color-slate)" }}>{t("seller.no_records")}</div>
        ) : (
          <div className="stack" style={{ gap: 10 }}>
            {expenses.map((e) => (
              <div key={e.id} className="between" style={{ borderBottom: "1px solid var(--color-fog)", paddingBottom: 10, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{tp(e.crop_name)}</div>
                  <div style={{ fontSize: 12, color: "var(--color-slate)" }}>
                    {t(`seller.exp_${e.category}`)} · {e.date}
                  </div>
                </div>
                <div className="row" style={{ gap: 10, alignItems: "center" }}>
                  <strong style={{ fontSize: 14, color: "var(--color-alarm-red)" }}>−{ugx(e.amount)}</strong>
                  <button
                    onClick={() => handleDelete(e.id)}
                    aria-label={t("common.delete")}
                    style={{ background: "none", border: "none", color: "var(--color-slate)", cursor: "pointer", padding: 4 }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {adding && (
        <Modal
          title={t("seller.add_expense")}
          onClose={() => setAdding(false)}
          footer={
            <Button variant="primary" block disabled={busy || !form.crop_name || !form.amount} onClick={handleSave}>
              {busy ? <Loader2 size={15} className="spin" /> : t("common.save")}
            </Button>
          }
        >
          <Field label={t("seller.crop")}>
            <input
              value={form.crop_name}
              placeholder="Tomatoes"
              onChange={(e) => setForm({ ...form, crop_name: e.target.value })}
            />
          </Field>
          <Field label={t("seller.expenses")}>
            <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
              {EXP_CATS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="btn-sm"
                  onClick={() => setForm({ ...form, category: c })}
                  style={form.category === c ? { borderColor: "var(--color-forest-ink)", background: "var(--color-linen-mist)", fontWeight: 700 } : undefined}
                >
                  {t(`seller.exp_${c}`)}
                </button>
              ))}
            </div>
          </Field>
          <Field label={t("seller.amount")}>
            <input
              type="number"
              min="100"
              value={form.amount}
              placeholder="50000"
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </Field>
        </Modal>
      )}
    </>
  );
}

