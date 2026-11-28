import { useState, useEffect } from "react";
import { ugx } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { EMOJI } from "../data/categories";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { formatApiError } from "../utils/errorHandler";
import { ResponsiveTable } from "../components/ResponsiveTable";
import { Thumb } from "../components/Thumb";
import { useI18n } from "../context/I18nContext";
export default function AdminAccounts({ listings, setListings, say }) {
  const { t, tp, tu } = useI18n();
  const handleRemove = async (id) => {
    if (!window.confirm(t("admin.confirm_remove", { id }))) return;
    try {
      await api.delete(ENDPOINTS.listing(id.replace("L-", "")));
      setListings((ls) => ls.filter((x) => x.id !== id));
      say(t("toast.removed", { id }));
    } catch (err) {
      say(formatApiError(err));
    }
  };
  const [accountData, setAccountData] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const loadAccounts = async () => {
    try {
      const data = await api.get(ENDPOINTS.reportUsers);
      setAccountData(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      say(formatApiError(err));
    } finally {
      setLoadingAccounts(false);
    }
  };
  useEffect(() => {
    loadAccounts();
  }, []);
  const handleToggle = async (r) => {
    const action = r.is_active ? t("admin.suspend") : t("admin.reactivate");
    if (!window.confirm(t("admin.confirm_toggle", { action, name: r.name }))) return;
    try {
      await api.post(ENDPOINTS.toggleActive(r.id));
      say(r.is_active ? t("toast.suspended", { name: r.name }) : t("toast.reactivated", { name: r.name }));
      loadAccounts();
    } catch (err) {
      say(formatApiError(err));
    }
  };
  const statusText = (s) => s === "Verified" ? t("admin.status_verified") : s === "Suspended" ? t("admin.status_suspended") : t("admin.status_unverified");
  const accountColumns = [
    { key: "name", label: t("admin.col_account"), render: (r) => <strong>{r.name}</strong> },
    { key: "type", label: t("admin.col_type") },
    { key: "joined", label: t("admin.col_joined"), render: (r) => <span style={{ fontFamily: "var(--font-monospace)" }}>{r.joined}</span> },
    { key: "status", label: t("admin.col_status"), render: (r) => <Badge tone={r.status === "Verified" ? "b-green" : r.status === "Suspended" ? "b-red" : "default"}>{statusText(r.status)}</Badge> },
    { key: "orders", label: t("admin.col_orders"), render: (r) => <span style={{ fontFamily: "var(--font-monospace)" }}>{r.orders}</span> },
    { key: "action", label: t("admin.col_action"), render: (r) => <button className="btn-sm" onClick={() => handleToggle(r)}>{r.is_active ? t("admin.suspend") : t("admin.reactivate")}</button> }
  ];
  const listingColumns = [
    { key: "id", label: "ID", render: (r) => <span style={{ fontFamily: "var(--font-monospace)" }}>{r.id}</span> },
    { key: "produce", label: t("admin.col_produce"), render: (r) => <div className="row" style={{ gap: 10, alignItems: "center" }}><Thumb src={r.thumbnail} alt={tp(r.name)} fallback={EMOJI[r.cat]} size={36} /><strong>{tp(r.name)}</strong></div> },
    { key: "seller", label: t("admin.col_seller") },
    { key: "cat", label: t("admin.col_category"), render: (r) => t(`cat.${r.cat}`) },
    { key: "price", label: t("admin.col_price"), render: (r) => <span style={{ fontFamily: "var(--font-monospace)" }}>{ugx(r.price)}</span> },
    { key: "qty", label: t("admin.col_stock"), render: (r) => <span style={{ fontFamily: "var(--font-monospace)" }}>{r.qty} {tu(r.unit)}</span> },
    { key: "action", label: t("admin.col_action"), render: (r) => <button className="btn-sm" onClick={() => handleRemove(r.id)}>
        {t("admin.remove")}
      </button> }
  ];
  return <><Head title={t("admin.accounts_title")} /><div className="card" style={{ padding: 0 }}>{loadingAccounts ? <div style={{ textAlign: "center", color: "var(--color-slate)", padding: "24px" }}>{t("admin.loading_accounts")}</div> : accountData.length === 0 ? <div style={{ textAlign: "center", color: "var(--color-slate)", padding: "24px" }}>{t("admin.no_accounts")}</div> : <ResponsiveTable columns={accountColumns} data={accountData} keyField="id" />}</div><h2 style={{ marginTop: "32px", marginBottom: "16px", fontSize: "20px", fontWeight: 700, color: "var(--color-obsidian)" }}>
        {t("admin.active_listings")}
      </h2><div className="card" style={{ padding: 0 }}>{listings.length === 0 ? <div style={{ textAlign: "center", color: "var(--color-slate)", padding: "24px" }}>
            {t("admin.no_active_listings")}
          </div> : <ResponsiveTable columns={listingColumns} data={listings} keyField="id" />}</div></>;
}
