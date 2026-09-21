import React from "react";
import { ugx } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";

export default function AdminAccounts({ listings, setListings, say }) {
  return (
    <>
      <Head title="Accounts & Moderation" />
      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Account</th>
              <th>Type</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Orders</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {[
              ["David Ssemakula", "Seller · Smallholder", "12 Mar 2026", "Verified", 24],
              ["Kato Farms Ltd", "Seller · Commercial", "05 Jan 2026", "Verified", 61],
              ["Nakaseke Growers Co-op", "Seller · Group", "22 Feb 2026", "Verified", 33],
              ["Nakato Catering", "Buyer · Restaurant", "02 Apr 2026", "Verified", 31],
              ["Kampala Fresh Mart", "Buyer · Supermarket", "19 May 2026", "Verified", 14],
              ["Moses Wanyama", "Seller · Aggregator", "28 Jun 2026", "Unverified", 2]
            ].map(r => (
              <tr key={r[0] as string}>
                <td><strong>{r[0]}</strong></td>
                <td>{r[1]}</td>
                <td style={{ fontFamily: "var(--font-monospace)" }}>{r[2]}</td>
                <td>
                  <Badge tone={r[3] === "Unverified" ? "default" : "b-green"}>
                    {r[3]}
                  </Badge>
                </td>
                <td style={{ fontFamily: "var(--font-monospace)" }}>{r[4]}</td>
                <td style={{ textAlign: "right" }}>
                  <button
                    className="btn-sm"
                    onClick={() => say(`Account suspended: ${r[0]}`)}
                  >
                    Suspend
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: "32px", marginBottom: "16px", fontSize: "20px", fontWeight: 700, color: "var(--color-obsidian)" }}>
        Active Marketplace Listings
      </h2>
      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>ID</th>
              <th>Produce</th>
              <th>Seller</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {listings.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--color-slate)", padding: "24px" }}>
                  No active listings.
                </td>
              </tr>
            ) : (
              listings.map(l => (
                <tr key={l.id}>
                  <td style={{ fontFamily: "var(--font-monospace)" }}>{l.id}</td>
                  <td><strong>{l.name}</strong></td>
                  <td>{l.seller}</td>
                  <td>{l.cat}</td>
                  <td style={{ fontFamily: "var(--font-monospace)" }}>{ugx(l.price)}</td>
                  <td style={{ fontFamily: "var(--font-monospace)" }}>{l.qty} {l.unit}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn-sm"
                      onClick={() => {
                        setListings(ls => ls.filter(x => x.id !== l.id));
                        say(`Removed listing ${l.id}`);
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
