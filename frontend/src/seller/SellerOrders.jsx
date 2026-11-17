import React, { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { ugx, STATUS_TONE } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { Button } from "../components/ui/Button";
import { FilterChips } from "../components/FilterChips";
import { useI18n } from "../context/I18nContext";

export default function SellerOrders({ myOrders, commission, setOrders, advance }) {
  const { t, tp, tu } = useI18n();
  const [filter, setFilter] = useState("All");
  const [busyId, setBusyId] = useState(null);

  const filtered = useMemo(() => {
    if (filter === "All") return myOrders;
    if (filter === "Active") return myOrders.filter((o) => o.status !== "delivered");
    if (filter === "Delivered") return myOrders.filter((o) => o.status === "delivered");
    return myOrders;
  }, [myOrders, filter]);

  const handleAdvance = async (o) => {
    setBusyId(o.id);
    try {
      await advance(o);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Head title={t("seller.orders")} />
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
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{t("buyer.no_orders")}</h2>
          </div>
        ) : (
          filtered.map((o) => (
            <div className="card" key={o.id} style={{ padding: 14 }}>
              <div className="between" style={{ alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontFamily: "var(--font-monospace)", fontSize: 12, color: "var(--color-slate)" }}>{o.id}</span>
                <Badge tone={STATUS_TONE[o.status]}>{t(`status.${o.status}`)}</Badge>
              </div>
              <div className="between" style={{ alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{o.qty} {tu(o.unit)} · {tp(o.item)}</h3>
                  <div style={{ fontSize: 12, color: "var(--color-slate)" }}>{o.buyer}</div>
                </div>
                <strong style={{ fontSize: 15, color: "var(--color-forest-ink)" }}>
                  {ugx(o.qty * o.price * (1 - commission / 100))}
                </strong>
              </div>

              {o.type === "order" && o.status !== "delivered" && (
                <div className="row" style={{ marginTop: 12, gap: 8, alignItems: "center" }}>
                  <select
                    value={o.mode}
                    style={{ flex: 1, padding: 8, borderRadius: "var(--radius-buttons)" }}
                    onChange={(e) => setOrders((os) => os.map((x) => x.id === o.id ? { ...x, mode: e.target.value } : x))}
                  >
                    {["Motorcycle", "Motor truck", "Pickup"].map((m) => (
                      <option key={m} value={m}>{t(`delivery.${m}`) || m}</option>
                    ))}
                  </select>
                  <Button variant="primary" size="sm" disabled={busyId === o.id} onClick={() => handleAdvance(o)}>
                    {busyId === o.id ? <Loader2 size={14} className="spin" /> : (o.status === "placed" ? t("seller.accept_order") : o.status === "accepted" ? t("seller.start_delivery") : t("seller.confirm_delivered"))}
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
