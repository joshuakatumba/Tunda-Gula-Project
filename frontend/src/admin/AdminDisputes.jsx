import React from "react";
import { ugx } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";
import { Button } from "../components/ui/Button";
import { useI18n } from "../context/I18nContext";

export default function AdminDisputes({ disputes, onResolve }) {
  const { t } = useI18n();
  return (
    <>
      <Head title={t("admin.disputes")} />
      <div className="stack" style={{ gap: 12 }}>
        {disputes.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{t("admin.no_disputes")}</h2>
          </div>
        ) : (
          disputes.map((d) => (
            <div className="card" key={d.id} style={{ padding: 14 }}>
              <div className="between" style={{ alignItems: "center", gap: 12 }}>
                <div>
                  <div className="row" style={{ gap: 8, alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--font-monospace)", fontSize: 12 }}>{d.id}</span>
                    <Badge tone={d.status === "open" ? "b-red" : "b-green"}>{d.status === "open" ? t("common.open") : t("common.resolved")}</Badge>
                    <span style={{ fontSize: 12, color: "var(--color-slate)" }}>{ugx(d.value)}</span>
                  </div>
                  <h3 style={{ margin: "6px 0 0", fontSize: 15, fontWeight: 700 }}>{d.reason}</h3>
                </div>
                <div>
                  {d.status === "open" ? (
                    <Button variant="primary" size="sm" onClick={() => onResolve(d)}>{t("common.resolve")}</Button>
                  ) : (
                    <Badge tone="b-green">{t("common.resolved")}</Badge>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
