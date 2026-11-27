import React, { useState, useEffect, useCallback } from "react";
import { Loader2, TrendingUp, Download, Trash2, ShieldCheck } from "lucide-react";
import { ugx } from "../utils/helpers";
import { Head } from "../components/Head";
import { Stat } from "../components/Stat";
import { Badge } from "../components/Badge";
import { Field } from "../components/Field";
import { Modal } from "../components/Modal";
import { Button } from "../components/ui/Button";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { useI18n } from "../context/I18nContext";

const EXP_CATS = ["seeds", "fertilizer", "labor", "transport", "other"];
const CREDIT_TYPES = ["seeds", "fertilizer", "pesticides", "transport"];

export default function SellerRecords({ say, session }) {
  const { t, tp } = useI18n();
  const [analytics, setAnalytics] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [requestingCredit, setRequestingCredit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    crop_name: "",
    category: "seeds",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [creditForm, setCreditForm] = useState({ item_type: "seeds", amount: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [anRes, expRes, credRes] = await Promise.all([
        api.get(ENDPOINTS.sellerAnalytics),
        api.get(ENDPOINTS.expenses),
        api.get(ENDPOINTS.credit).catch(() => []),
      ]);
      setAnalytics(anRes);
      setExpenses(Array.isArray(expRes) ? expRes : expRes?.results || []);
      setCredits(Array.isArray(credRes) ? credRes : credRes?.results || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaveExpense = async () => {
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

  const handleRequestCredit = async () => {
    if (!creditForm.amount) return;
    setBusy(true);
    try {
      await api.post(ENDPOINTS.credit, {
        item_type: creditForm.item_type,
        amount: Number(creditForm.amount),
      });
      setRequestingCredit(false);
      setCreditForm({ item_type: "seeds", amount: "" });
      say?.(t("seller.credit_approved"));
      load();
    } catch (err) {
      say?.(err.message || "Credit request failed");
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
      ["TundaGula Verified Farm Statement"],
      ["Farmer", session?.name || ""],
      ["Credit Score", `${analytics?.credit_score ?? 0}/100 (${analytics?.credit_tier ?? "Starter"})`],
      ["Total Revenue (UGX)", analytics?.total_revenue ?? 0],
      ["Total Expenses (UGX)", analytics?.total_expenses ?? 0],
      ["Net Profit (UGX)", analytics?.net_profit ?? 0],
      [],
      ["Date", "Crop", "Category", "Amount (UGX)"],
      ...expenses.map((e) => [e.date, e.crop_name, e.category, e.amount]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tundagula-sacco-statement-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Head
        title={t("seller.records")}
        action={
          <div className="row" style={{ gap: 8 }}>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download size={14} /> {t("seller.export_csv")}
            </Button>
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

      {/* Farm Credit Score & Input Credit Lock-In */}
      <div className="card" style={{ marginTop: 14, padding: 14 }}>
        <div className="between" style={{ alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div className="row" style={{ gap: 8, alignItems: "center" }}>
              <ShieldCheck size={17} color="var(--color-forest-ink)" />
              <strong style={{ fontSize: 15 }}>{t("seller.credit_score")}: {analytics?.credit_score ?? 0}/100</strong>
              <Badge tone="b-green">{analytics?.credit_tier ?? "Starter"}</Badge>
            </div>
            <div style={{ fontSize: 12, color: "var(--color-slate)", marginTop: 4 }}>
              {t("seller.available_credit")}: <strong>{ugx(analytics?.available_credit ?? 0)}</strong>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            disabled={(analytics?.available_credit ?? 0) <= 0}
            onClick={() => setRequestingCredit(true)}
          >
            {t("seller.request_credit")}
          </Button>
        </div>
        {credits.length > 0 && (
          <div className="row" style={{ marginTop: 10, gap: 6, flexWrap: "wrap" }}>
            {credits.slice(0, 3).map((c) => (
              <Badge key={c.id} tone="b-maize">{c.item_type}: {ugx(c.amount)}</Badge>
            ))}
          </div>
        )}
      </div>

      {analytics?.insights?.length > 0 && (
        <div className="card" style={{ marginTop: 14, padding: 14 }}>
          <div className="row" style={{ gap: 8, marginBottom: 8, alignItems: "center" }}>
            <TrendingUp size={16} color="var(--color-forest-ink)" />
            <strong style={{ fontSize: 14 }}>{t("seller.insights")}</strong>
          </div>
          <div className="stack" style={{ gap: 6 }}>
            {analytics.insights.map((ins, i) => (
              <div key={i} style={{ fontSize: 13, color: "var(--color-charcoal)" }}>• {ins.text}</div>
            ))}
          </div>
        </div>
      )}

      {analytics?.crops?.length > 0 && (
        <div className="card" style={{ marginTop: 14, padding: 14 }}>
          <strong style={{ fontSize: 14, display: "block", marginBottom: 10 }}>{t("seller.crop_profit")}</strong>
          <div className="stack" style={{ gap: 8 }}>
            {analytics.crops.map((c) => (
              <div key={c.crop} className="between" style={{ fontSize: 13 }}>
                <span>{tp(c.crop)}</span>
                <strong style={{ color: c.profit >= 0 ? "var(--color-forest-ink)" : "var(--color-alarm-red)" }}>
                  {c.profit >= 0 ? "+" : "−"}{ugx(Math.abs(c.profit))}
                </strong>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 14, padding: 14 }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--color-slate)" }}>{t("common.loading")}</div>
        ) : expenses.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--color-slate)" }}>{t("seller.no_records")}</div>
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
                  <button onClick={() => handleDelete(e.id)} aria-label={t("common.delete")} style={{ background: "none", border: "none", color: "var(--color-slate)", cursor: "pointer", padding: 4 }}>
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
            <Button variant="primary" block disabled={busy || !form.crop_name || !form.amount} onClick={handleSaveExpense}>
              {busy ? <Loader2 size={15} className="spin" /> : t("common.save")}
            </Button>
          }
        >
          <Field label={t("seller.crop")}>
            <input value={form.crop_name} placeholder="Tomatoes" onChange={(e) => setForm({ ...form, crop_name: e.target.value })} />
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
            <input type="number" min="100" value={form.amount} placeholder="50000" onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </Field>
        </Modal>
      )}

      {requestingCredit && (
        <Modal
          title={t("seller.request_credit")}
          onClose={() => setRequestingCredit(false)}
          footer={
            <Button variant="primary" block disabled={busy || !creditForm.amount} onClick={handleRequestCredit}>
              {busy ? <Loader2 size={15} className="spin" /> : t("common.confirm")}
            </Button>
          }
        >
          <div style={{ fontSize: 13, color: "var(--color-slate)" }}>
            {t("seller.available_credit")}: <strong>{ugx(analytics?.available_credit ?? 0)}</strong>
          </div>
          <Field label={t("seller.expenses")}>
            <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
              {CREDIT_TYPES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="btn-sm"
                  onClick={() => setCreditForm({ ...creditForm, item_type: c })}
                  style={creditForm.item_type === c ? { borderColor: "var(--color-forest-ink)", background: "var(--color-linen-mist)", fontWeight: 700 } : undefined}
                >
                  {c}
                </button>
              ))}
            </div>
          </Field>
          <Field label={t("seller.amount")}>
            <input
              type="number"
              min="10000"
              max={analytics?.available_credit ?? 0}
              value={creditForm.amount}
              placeholder="100000"
              onChange={(e) => setCreditForm({ ...creditForm, amount: e.target.value })}
            />
          </Field>
        </Modal>
      )}
    </>
  );
}
