import { useState } from "react";
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
import { useI18n } from "../context/I18nContext";
export default function AdminApp(props) {
  const { t } = useI18n();
  const {
    tab,
    listings,
    setListings,
    orders,
    pending,
    setPending,
    disputes,
    setDisputes,
    commission,
    setCommission,
    depositDefault,
    setDepositDefault,
    say,
    pushSms,
    fetchData
  } = props;
  const [reviewing, setReviewing] = useState(null);
  const [resolving, setResolving] = useState(null);
  const decide = async (s, approve, reason) => {
    try {
      const userId = s.id.replace("S-", "");
      if (approve) {
        await api.post(ENDPOINTS.approve(userId));
      } else {
        await api.post(ENDPOINTS.reject(userId), { reason });
      }
      if (fetchData) fetchData();
    } catch {
      setPending((p) => p.filter((x) => x.id !== s.id));
    }
    pushSms("Seller \xB7 " + s.name, approve ? "Your TundaGula account is verified. You can start listing produce today." : `Verification not approved: ${reason}. Reply HELP or visit an agent to fix it.`);
    setReviewing(null);
    say(approve ? t("toast.seller_approved", { name: s.name }) : t("toast.seller_rejected", { name: s.name }));
  };
  const handleCommissionChange = async (val) => {
    setCommission(val);
    try {
      await api.patch(ENDPOINTS.settings, { commission_rate: val });
    } catch {
    }
  };
  const handleDepositChange = async (val) => {
    setDepositDefault(val);
    try {
      await api.patch(ENDPOINTS.settings, { default_deposit_percentage: val });
    } catch {
    }
  };
  return <>{tab === "overview" && <AdminOverview orders={orders} commission={commission} setCommission={handleCommissionChange} depositDefault={depositDefault} setDepositDefault={handleDepositChange} pending={pending} />}{tab === "verify" && <AdminVerify pending={pending} onApprove={(s) => decide(s, true)} onReview={setReviewing} />}{tab === "accounts" && <AdminAccounts listings={listings} setListings={setListings} say={say} />}{tab === "disputes" && <AdminDisputes disputes={disputes} onResolve={setResolving} />}{tab === "adelivery" && <AdminDelivery />}{tab === "areports" && <AdminReports listings={listings} say={say} />}{reviewing && <RejectModal seller={reviewing} onClose={() => setReviewing(null)} onReject={(r) => decide(reviewing, false, r)} />}{resolving && <ResolveModal dispute={resolving} onClose={() => setResolving(null)} onResolve={async (decision) => {
    const payload = typeof decision === "string" ? { resolution: decision } : decision;
    try {
      const disputeId = resolving.id.replace("D-", "");
      await api.post(ENDPOINTS.disputeResolve(disputeId), payload);
      if (fetchData) fetchData();
    } catch {
      setDisputes((ds) => ds.map((x) => x.id === resolving.id ? { ...x, status: "resolved", resolution: payload.resolution } : x));
    }
    setResolving(null);
    say(t("toast.dispute_resolved"));
  }} />}</>;
}
