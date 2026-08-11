import React, { useState } from "react";
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
    commission, setCommission, depositDefault, setDepositDefault, say, pushSms } = props;
  const [reviewing, setReviewing] = useState(null);
  const [resolving, setResolving] = useState(null);

  const decide = (s, approve, reason) => {
    setPending(p => p.filter(x => x.id !== s.id));
    pushSms("Seller · " + s.name, approve
      ? "Your TundaGula account is verified. You can start listing produce today."
      : `Verification not approved: ${reason}. Reply HELP or visit an agent to fix it.`);
    setReviewing(null);
    say(approve ? `${s.name} verified — SMS sent` : `${s.name} rejected — reason sent by SMS`);
  };

  return (
    <>
      {tab === "overview" && <AdminOverview orders={orders} commission={commission} setCommission={setCommission} depositDefault={depositDefault} setDepositDefault={setDepositDefault} pending={pending} />}
      {tab === "verify" && <AdminVerify pending={pending} onApprove={(s) => decide(s, true)} onReview={setReviewing} />}
      {tab === "accounts" && <AdminAccounts listings={listings} setListings={setListings} say={say} />}
      {tab === "disputes" && <AdminDisputes disputes={disputes} onResolve={setResolving} />}
      {tab === "adelivery" && <AdminDelivery />}
      {tab === "areports" && <AdminReports listings={listings} say={say} />}

      {reviewing && <RejectModal seller={reviewing} onClose={() => setReviewing(null)} onReject={(r) => decide(reviewing, false, r)} />}
      {resolving && <ResolveModal dispute={resolving} onClose={() => setResolving(null)} onResolve={(decision) => {
        setDisputes(ds => ds.map(x => x.id === resolving.id ? { ...x, status: "resolved", resolution: decision } : x));
        setResolving(null); say("Decision recorded. Both parties notified by SMS.");
      }} />}
    </>
  );
}
