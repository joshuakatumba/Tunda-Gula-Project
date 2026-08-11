import React, { useState } from "react";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import AdminOverview from "./AdminOverview";
import AdminVerify from "./AdminVerify";
import AdminAccounts from "./AdminAccounts";
import AdminDisputes from "./AdminDisputes";
import AdminDelivery from "./AdminDelivery";
import AdminReports from "./AdminReports";
import RejectModal from "./RejectModal";
import ResolveModal from "./ResolveModal";

export default function AdminApp(props) {
  const { tab, listings, setListings, orders, pending, setPending, disputes, setDisputes,
    commission, setCommission, depositDefault, setDepositDefault, say, pushSms, fetchData } = props;
  const [reviewing, setReviewing] = useState(null);
  const [resolving, setResolving] = useState(null);

  const decide = async (s: any, approve: any, reason?: string) => {
    try {
      const userId = s.id.replace("S-", "");
      if (approve) {
        await api.post(ENDPOINTS.approve(userId));
      } else {
        await api.post(ENDPOINTS.reject(userId), { reason });
      }
      // Refresh pending list
      if (fetchData) fetchData();
    } catch {
      // Fallback to local state
      setPending(p => p.filter(x => x.id !== s.id));
    }
    pushSms("Seller · " + s.name, approve
      ? "Your TundaGula account is verified. You can start listing produce today."
      : `Verification not approved: ${reason}. Reply HELP or visit an agent to fix it.`);
    setReviewing(null);
    say(approve ? `${s.name} verified — SMS sent` : `${s.name} rejected — reason sent by SMS`);
  };

  const handleCommissionChange = async (val: number) => {
    setCommission(val);
    try {
      await api.patch(ENDPOINTS.settings, { commission_rate: val });
    } catch { /* keep local value */ }
  };

  const handleDepositChange = async (val: number) => {
    setDepositDefault(val);
    try {
      await api.patch(ENDPOINTS.settings, { default_deposit_percentage: val });
    } catch { /* keep local value */ }
  };

  return (
    <>
      {tab === "overview" && <AdminOverview orders={orders} commission={commission} setCommission={handleCommissionChange} depositDefault={depositDefault} setDepositDefault={handleDepositChange} pending={pending} />}
      {tab === "verify" && <AdminVerify pending={pending} onApprove={(s) => decide(s, true)} onReview={setReviewing} />}
      {tab === "accounts" && <AdminAccounts listings={listings} setListings={setListings} say={say} />}
      {tab === "disputes" && <AdminDisputes disputes={disputes} onResolve={setResolving} />}
      {tab === "adelivery" && <AdminDelivery />}
      {tab === "areports" && <AdminReports listings={listings} say={say} />}

      {reviewing && <RejectModal seller={reviewing} onClose={() => setReviewing(null)} onReject={(r) => decide(reviewing, false, r)} />}
      {resolving && <ResolveModal dispute={resolving} onClose={() => setResolving(null)} onResolve={async (decision) => {
        try {
          const disputeId = resolving.id.replace("D-", "");
          await api.post(ENDPOINTS.disputeResolve(disputeId), { resolution: decision });
          if (fetchData) fetchData();
        } catch {
          setDisputes(ds => ds.map(x => x.id === resolving.id ? { ...x, status: "resolved", resolution: decision } : x));
        }
        setResolving(null); say("Decision recorded. Both parties notified by SMS.");
      }} />}
    </>
  );
}
