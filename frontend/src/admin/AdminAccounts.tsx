import React, { useState, useEffect } from "react";
import { ugx } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { EMOJI } from "../data/categories";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { formatApiError } from "../utils/errorHandler";
import { ResponsiveTable } from "../components/ResponsiveTable";
import { Thumb } from "../components/Thumb";

export default function AdminAccounts({ listings, setListings, say }) {
  const handleRemove = async (id: string) => {
    if (!window.confirm(`Remove listing ${id}?`)) return;
    try {
      await api.delete(ENDPOINTS.listing(id.replace("L-", "")));
      setListings(ls => ls.filter(x => x.id !== id));
      say(`Removed listing ${id}`);
    } catch (err) {
      say(formatApiError(err));
    }
  };

  const [accountData, setAccountData] = useState<any[]>([]);
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
  useEffect(() => { loadAccounts(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = async (r: any) => {
    const action = r.is_active ? "Suspend" : "Reactivate";
    if (!window.confirm(`${action} ${r.name}?`)) return;
    try {
      await api.post(ENDPOINTS.toggleActive(r.id));
      say(`${r.name} ${r.is_active ? "suspended" : "reactivated"}`);
      loadAccounts();
    } catch (err) {
      say(formatApiError(err));
    }
  };

  const accountColumns = [
    { key: "name", label: "Account", render: r => <strong>{r.name}</strong> },
    { key: "type", label: "Type" },
    { key: "joined", label: "Joined", render: r => <span style={{ fontFamily: "var(--font-monospace)" }}>{r.joined}</span> },
    { key: "status", label: "Status", render: r => <Badge tone={r.status === "Verified" ? "b-green" : r.status === "Suspended" ? "b-red" : "default"}>{r.status}</Badge> },
    { key: "orders", label: "Orders", render: r => <span style={{ fontFamily: "var(--font-monospace)" }}>{r.orders}</span> },
    { key: "action", label: "Action", render: r => (
      <button className="btn-sm" onClick={() => handleToggle(r)}>
        {r.is_active ? "Suspend" : "Reactivate"}
      </button>
    ) }
  ];

  const listingColumns = [
    { key: "id", label: "ID", render: r => <span style={{ fontFamily: "var(--font-monospace)" }}>{r.id}</span> },
    { key: "produce", label: "Produce", render: r => (
      <div className="row" style={{ gap: 10, alignItems: "center" }}>
        <Thumb src={r.thumbnail} alt={r.name} fallback={EMOJI[r.cat]} size={36} />
        <strong>{r.name}</strong>
      </div>
    ) },
    { key: "seller", label: "Seller" },
    { key: "cat", label: "Category" },
    { key: "price", label: "Price", render: r => <span style={{ fontFamily: "var(--font-monospace)" }}>{ugx(r.price)}</span> },
    { key: "qty", label: "Stock", render: r => <span style={{ fontFamily: "var(--font-monospace)" }}>{r.qty} {r.unit}</span> },
    { key: "action", label: "Action", render: r => (
      <button className="btn-sm" onClick={() => handleRemove(r.id)}>
        Remove
      </button>
    ) }
  ];

  return (
    <>
      <Head title="Accounts & Moderation" />
      <div className="card" style={{ padding: 0 }}>
        {loadingAccounts ? (
          <div style={{ textAlign: "center", color: "var(--color-slate)", padding: "24px" }}>Loading accounts…</div>
        ) : accountData.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--color-slate)", padding: "24px" }}>No accounts registered yet.</div>
        ) : (
          <ResponsiveTable columns={accountColumns} data={accountData} keyField="id" />
        )}
      </div>

      <h2 style={{ marginTop: "32px", marginBottom: "16px", fontSize: "20px", fontWeight: 700, color: "var(--color-obsidian)" }}>
        Active Marketplace Listings
      </h2>
      <div className="card" style={{ padding: 0 }}>
        {listings.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--color-slate)", padding: "24px" }}>
            No active listings.
          </div>
        ) : (
          <ResponsiveTable columns={listingColumns} data={listings} keyField="id" />
        )}
      </div>
    </>
  );
}
