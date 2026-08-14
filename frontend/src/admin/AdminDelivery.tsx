import React, { useState, useEffect } from "react";
import { Head } from "../components/Head";
import { Stat } from "../components/Stat";
import { FarmMap } from "../components/FarmMap";
import { api } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";

export default function AdminDelivery() {
  const [pins, setPins] = useState([]);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    // Fetch verified sellers who have GPS coordinates
    api.get(`${ENDPOINTS.pending}?role=seller&is_verified=true`)
      .then((data: any) => {
        const items = Array.isArray(data) ? data : data.results || [];
        const withGps = items
          .filter((s: any) => s.gps_lat && s.gps_lng)
          .map((s: any) => ({
            id: s.id,
            name: s.name,
            district: s.district || "",
            lat: parseFloat(s.gps_lat),
            lng: parseFloat(s.gps_lng),
            is_verified: s.is_verified,
          }));
        setPins(withGps);
      })
      .catch(() => setMapError(true));
  }, []);

  return (
    <>
      <Head eyebrow="Operations" title="Delivery performance"
        lede="How long deliveries take, how many complete, and where things go wrong."
        reqs={["REQ-047", "REQ-061"]} />
      <div className="grid g4">
        <Stat label="Avg delivery time" value="6.4 h" sub="target under 8 h" />
        <Stat label="Completion rate" value="94%" sub="of accepted orders" />
        <Stat label="Disputed deliveries" value="2" sub="of 118 this month" />
        <Stat label="SMS delivered" value="97.2%" sub="3 retries maximum" />
      </div>

      {/* Farm location map */}
      <div className="card" style={{ marginTop: 12 }}>
        <h2 style={{ marginBottom: 12 }}>Verified farmer locations</h2>
        {mapError ? (
          <p className="hint">Map data unavailable. Ensure sellers have been verified and have GPS coordinates.</p>
        ) : (
          <FarmMap pins={pins} height={380} />
        )}
        <p className="hint" style={{ marginTop: 8 }}>
          Showing {pins.length} verified farmers with GPS coordinates. Exact farm locations are only visible to staff.
        </p>
      </div>

      <div className="card scroll-x" style={{ marginTop: 12 }}>
        <table className="tbl">
          <thead><tr><th>District</th><th>Orders</th><th>Avg time</th><th>Common mode</th><th>Late</th></tr></thead>
          <tbody>
            {[["Wakiso", 48, "4.1 h", "Motorcycle", "6%"], ["Mukono", 27, "6.8 h", "Motor truck", "11%"],
              ["Luweero", 22, "9.2 h", "Motor truck", "19%"], ["Mpigi", 14, "5.5 h", "Motorcycle", "7%"],
              ["Buikwe", 7, "11.4 h", "Bicycle", "28%"]].map(r => (
              <tr key={r[0]}><td><strong>{r[0]}</strong></td><td className="mono">{r[1]}</td><td className="mono">{r[2]}</td>
                <td>{r[3]}</td><td className="mono" style={{ color: parseInt(String(r[4])) > 15 ? "#B4451F" : "#16261E" }}>{r[4]}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
