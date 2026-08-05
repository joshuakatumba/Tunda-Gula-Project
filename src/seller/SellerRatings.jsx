import React from "react";
import { Head } from "../components/Head";
import { Stat } from "../components/Stat";

export default function SellerRatings() {
  return (
    <>
      <Head eyebrow="Reputation" title="What buyers say about you"
        lede="Your rating decides where you appear in search, and whether you keep the Top seller badge."
        reqs={["REQ-050", "REQ-052", "REQ-011"]} />
      <div className="grid g3">
        <Stat label="Average rating" value="4.7 ★" sub="38 ratings" />
        <Stat label="Repeat buyers" value="9" sub="of 24 buyers" />
        <Stat label="Top seller badge" value="Held" sub="needs 4.5★ and 20 orders" />
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="stack">
          {[["Nakato Catering", 5, "Tomatoes were firm and clean. Delivered on time by boda."],
            ["Kampala Fresh Mart", 4, "Good quality but arrived two hours late."],
            ["Ssebo Grocers", 5, "Best price I have found for this quality. Will buy again."]].map(([who, st, txt]) => (
            <div key={who} style={{ borderBottom: "1px solid #DDE6D2", paddingBottom: 12 }}>
              <div className="row" style={{ gap: 8 }}><strong style={{ fontSize: 14 }}>{who}</strong>
                <span style={{ color: "#E8A317" }}>{"★".repeat(st)}</span></div>
              <p className="hint" style={{ marginTop: 5 }}>{txt}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
