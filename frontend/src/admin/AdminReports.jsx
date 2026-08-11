import React from "react";
import { CATEGORIES, EMOJI, CAT_EG } from "../data/categories";
import { Head } from "../components/Head";

export default function AdminReports({ listings, say }) {
  return (
    <>
      <Head eyebrow="Reporting" title="Reports and categories"
        lede="Export platform data as CSV, and manage the categories farmers can list under."
        reqs={["REQ-059", "REQ-062"]} />
      <div className="grid g3">
        {[["Transactions", "Every order, commission and payout for a date range"],
          ["User registrations", "New sellers and buyers, with type and verification state"],
          ["GMV summary", "Weekly gross value, commission and order counts"]].map(([n, d]) => (
          <div className="card" key={n}>
            <h3>{n}</h3><p className="hint" style={{ marginTop: 6, minHeight: 34 }}>{d}</p>
            <button className="btn-alt" style={{ borderColor: "#16261E", marginTop: 10, width: "100%" }} onClick={() => say(`${n} report exported as CSV`)}>Export CSV</button>
          </div>
        ))}
      </div>
      <h2 style={{ marginTop: 24 }}>Produce categories</h2>
      <p className="lede" style={{ marginBottom: 12 }}>Add or retire categories without a code release.</p>
      <div className="card">
        <div className="stack">
          {CATEGORIES.map(c => (
            <div className="between" key={c} style={{ borderBottom: "1px solid #DDE6D2", paddingBottom: 10 }}>
              <div className="row">
                <span style={{ fontSize: 20 }}>{EMOJI[c]}</span>
                <div><strong style={{ fontSize: 14 }}>{c}</strong><div className="hint">{listings.filter(l => l.cat === c).length} live listings · {CAT_EG[c]}</div></div>
              </div>
              <button className="btn-sm" onClick={() => say(`${c} deactivated — existing listings kept`)}>Deactivate</button>
            </div>
          ))}
          <button className="btn-alt" style={{ borderColor: "#16261E" }} onClick={() => say("New category added and available to sellers immediately")}>+ Add category</button>
        </div>
      </div>
    </>
  );
}
