import React from "react";
import { ugx } from "../utils/helpers";
import { Head } from "../components/Head";
import { Badge } from "../components/Badge";

export default function AdminAccounts({ listings, setListings, say }) {
  return (
    <>
      <Head eyebrow="Users" title="Accounts and listings"
        lede="Search, suspend, and remove. Every suspension records who did it, when, and why."
        reqs={["REQ-055", "REQ-056", "REQ-060"]} />
      <div className="card scroll-x">
        <table className="tbl">
          <thead><tr><th>Account</th><th>Type</th><th>Joined</th><th>State</th><th>Orders</th><th /></tr></thead>
          <tbody>
            {[["David Ssemakula", "Seller · Smallholder farmer", "12 Mar 2026", "Verified", 24],
              ["Kato Farms Ltd", "Seller · Commercial farm", "05 Jan 2026", "Verified", 61],
              ["Nakaseke Growers Co-op", "Seller · Farmer group", "22 Feb 2026", "Verified", 33],
              ["Nakato Catering", "Buyer · Restaurant", "02 Apr 2026", "Trusted buyer", 31],
              ["Kampala Fresh Mart", "Buyer · Supermarket", "19 May 2026", "Verified", 14],
              ["Moses Wanyama", "Seller · Aggregator", "28 Jun 2026", "Unverified", 2]].map(r => (
              <tr key={r[0]}>
                <td><strong>{r[0]}</strong></td><td>{r[1]}</td><td className="mono">{r[2]}</td>
                <td><Badge tone={r[3] === "Unverified" ? "b-maize" : "b-green"}>{r[3]}</Badge></td>
                <td className="mono">{r[4]}</td>
                <td style={{ textAlign: "right" }}><button className="btn-sm" onClick={() => say(`Suspension needs a reason — recorded against ${r[0]}`)}>Suspend</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 style={{ marginTop: 24 }}>Listings on the platform</h2>
      <p className="lede" style={{ marginBottom: 12 }}>Remove anything that breaks platform policy, including restricted agricultural inputs.</p>
      <div className="card scroll-x">
        <table className="tbl">
          <thead><tr><th>Listing</th><th>Seller</th><th>Category</th><th>Price</th><th>Stock</th><th /></tr></thead>
          <tbody>
            {listings.map(l => (
              <tr key={l.id}>
                <td className="mono">{l.id}<div style={{ fontFamily: "Public Sans" }}>{l.name}</div></td>
                <td>{l.seller}</td><td>{l.cat}</td><td className="mono">{ugx(l.price)}</td><td className="mono">{l.qty} {l.unit}</td>
                <td style={{ textAlign: "right" }}><button className="btn-sm" onClick={() => { setListings(ls => ls.filter(x => x.id !== l.id)); say(`${l.id} removed from the marketplace`); }}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
