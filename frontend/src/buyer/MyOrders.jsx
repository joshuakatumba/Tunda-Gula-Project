import React, { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { ugx, STATUS_TONE } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { DeliveryTrack } from "../components/DeliveryTrack";
import { Button } from "../components/ui/Button";
import { FilterChips } from "../components/FilterChips";
import { Thumb } from "../components/Thumb";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";
import { EMOJI } from "../data/categories";
import { useI18n } from "../context/I18nContext";

export default function MyOrders({ orders, onConfirm, onRate, onDispute }) {
  const { t, tp, tu } = useI18n();
  const [filter, setFilter] = useState("All");
  const [busyId, setBusyId] = useState(null);
  const [disputing, setDisputing] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");

  const filtered = useMemo(() => {
    if (filter === "All") return orders;
    if (filter === "Active") return orders.filter(o => o.status !== "delivered");
    if (filter === "Delivered") return orders.filter(o => o.status === "delivered");
    return orders;
  }, [orders, filter]);

  const handleConfirm = async (o) => {
    setBusyId(o.id);
    try {
      await onConfirm(o);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Head title={t("buyer.my_orders")} />
      <div style={{ marginBottom: 16 }}>
        <FilterChips
          options={[
            { id: "All", label: t("common.all") },
            { id: "Active", label: t("common.active") },
            { id: "Delivered", label: t("common.delivered") },
          ]}
          activeId={filter}
          onChange={setFilter}
        />
      </div>

      <div className="stack" style={{ gap: 12 }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "var(--color-obsidian)" }}>
              {t("buyer.no_orders")}
            </h2>
          </div>
        ) : (
          filtered.map(o => (
            <div className="card" key={o.id} style={{ padding: 14 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Thumb src={o.thumbnail} alt={o.item} fallback={EMOJI[o.cat] || "🥬"} size={52} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="between" style={{ alignItems: "center", marginBottom: 2 }}>
                    <span style={{ fontFamily: "var(--font-monospace)", fontSize: 12, color: "var(--color-slate)" }}>
                      {o.id}
                    </span>
                    <Badge tone={STATUS_TONE[o.status]}>{t(`status.${o.status}`)}</Badge>
                  </div>
                  <h3 style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 700, color: "var(--color-obsidian)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tp(o.item)}
                  </h3>
                  <div className="between" style={{ fontSize: 13, color: "var(--color-slate)" }}>
                    <span>{o.qty} {tu(o.unit)} · {o.seller}</span>
                    <strong style={{ color: "var(--color-forest-ink)" }}>{ugx(o.qty * o.price)}</strong>
                  </div>
                </div>
              </div>

              {o.type === "order" && (
                <div style={{ marginTop: 12 }}>
                  <DeliveryTrack status={o.status} />
                  <div className="row" style={{ marginTop: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--color-slate)" }}>{t(`delivery.${o.mode}`) || o.mode}</span>
                    {o.status !== "delivered" && (
                      <div className="row" style={{ marginLeft: "auto", gap: 6 }}>
                        {onDispute && (
                          <Button variant="text" size="sm" onClick={() => setDisputing(o)}>
                            {t("nav.disputes")}
                          </Button>
                        )}
                        <Button variant="outline" size="sm" disabled={busyId === o.id} onClick={() => handleConfirm(o)}>
                          {busyId === o.id ? <Loader2 size={14} className="spin" /> : t("buyer.confirm_receipt")}
                        </Button>
                      </div>
                    )}
                    {o.status === "delivered" && !o.rated && (
                      <div style={{ marginLeft: "auto" }}>
                        <Button variant="primary" size="sm" onClick={() => onRate(o)}>{t("buyer.rate")}</Button>
                      </div>
                    )}
                    {o.rated && (
                      <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: "var(--color-forest-ink)" }}>
                        {o.stars} ★
                      </span>
                    )}
                  </div>
                </div>
              )}

              {o.type === "preorder" && (
                <div style={{ marginTop: 10, fontSize: 12, color: "var(--color-slate)" }}>
                  {t("buyer.deposit_paid", { pct: o.depositPct, balance: ugx(o.qty * o.price * (1 - o.depositPct / 100)) })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {disputing && (
        <Modal
          title={t("nav.disputes")}
          onClose={() => { setDisputing(null); setDisputeReason(""); }}
          footer={
            <Button
              variant="primary"
              block
              disabled={!disputeReason.trim()}
              onClick={async () => {
                await onDispute(disputing, disputeReason.trim());
                setDisputing(null);
                setDisputeReason("");
              }}
            >
              {t("common.submit")}
            </Button>
          }
        >
          <div style={{ fontSize: 13, color: "var(--color-slate)" }}>
            {disputing.id} · {tp(disputing.item)}
          </div>
          <Field label={t("admin.reject_reason")}>
            <textarea
              rows={3}
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
            />
          </Field>
        </Modal>
      )}
    </>
  );
}
