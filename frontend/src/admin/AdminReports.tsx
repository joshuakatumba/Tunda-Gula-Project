import React from "react";
import { CATEGORIES, EMOJI, CAT_EG } from "../data/categories";
import { Head } from "../components/Head";
import { Button } from "../components/ui/Button";

export default function AdminReports({ listings, say }) {
  return (
    <>
      <Head title="Reports & Categories" />
      <div className="grid g3">
        {[
          ["Transactions", "Order histories, commissions, and seller payouts."],
          ["User Registrations", "User directory with account types and verification states."],
          ["GMV Summary", "Gross marketplace volume and fee totals."]
        ].map(([n, d]) => (
          <div className="card" key={n}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--color-obsidian)" }}>{n}</h3>
            <p style={{ margin: "6px 0 16px", fontSize: "13px", color: "var(--color-slate)", minHeight: "36px" }}>{d}</p>
            <Button
              variant="outline"
              style={{ width: "100%" }}
              onClick={() => say(`${n} exported to CSV`)}
            >
              Export CSV
            </Button>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: "32px", marginBottom: "16px", fontSize: "20px", fontWeight: 700, color: "var(--color-obsidian)" }}>
        Produce Categories
      </h2>
      <div className="card">
        <div className="stack" style={{ gap: "12px" }}>
          {CATEGORIES.map(c => (
            <div
              className="between"
              key={c}
              style={{ borderBottom: "1px solid var(--color-fog)", paddingBottom: "12px", alignItems: "center" }}
            >
              <div className="row" style={{ gap: "12px" }}>
                <span style={{ fontSize: "22px" }}>{EMOJI[c]}</span>
                <div>
                  <strong style={{ fontSize: "15px", color: "var(--color-obsidian)" }}>{c}</strong>
                  <div style={{ fontSize: "12px", color: "var(--color-slate)", marginTop: "2px" }}>
                    {listings.filter(l => l.cat === c).length} listings · {CAT_EG[c]}
                  </div>
                </div>
              </div>
              <button
                className="btn-sm"
                onClick={() => say(`${c} status updated`)}
              >
                Manage
              </button>
            </div>
          ))}
          <div style={{ paddingTop: "8px" }}>
            <Button
              variant="outline"
              onClick={() => say("New category form modal")}
            >
              + Add category
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
