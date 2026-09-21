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
      <Head title="Delivery Operations" />
      <div className="grid g4">
        <Stat label="Average Transit Time" value="6.4 h" sub="Target: < 8 h" />
        <Stat label="Completion Rate" value="94%" sub="111 of 118 fulfilled" />
        <Stat label="Active Disputes" value="2" sub="1.7% incident rate" />
        <Stat label="SMS Delivery Rate" value="97.2%" sub="Carrier delivery" />
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <h2 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: 700, color: "var(--color-obsidian)" }}>
          Farmer Geographic Distribution
        </h2>
        {mapError ? (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--color-slate)", background: "var(--color-fog)", borderRadius: "var(--radius-cards)" }}>
            Map coordinates currently unavailable.
          </div>
        ) : (
          <FarmMap pins={pins} height={380} />
        )}
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>District</th>
              <th>Orders</th>
              <th>Avg Time</th>
              <th>Primary Transport</th>
              <th>Late Rate</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Wakiso", 48, "4.1 h", "Motorcycle", "6%"],
              ["Mukono", 27, "6.8 h", "Motor truck", "11%"],
              ["Luweero", 22, "9.2 h", "Motor truck", "19%"],
              ["Mpigi", 14, "5.5 h", "Motorcycle", "7%"],
              ["Buikwe", 7, "11.4 h", "Bicycle", "28%"]
            ].map(r => (
              <tr key={r[0] as string}>
                <td><strong>{r[0]}</strong></td>
                <td style={{ fontFamily: "var(--font-monospace)" }}>{r[1]}</td>
                <td style={{ fontFamily: "var(--font-monospace)" }}>{r[2]}</td>
                <td>{r[3]}</td>
                <td
                  style={{
                    fontFamily: "var(--font-monospace)",
                    fontWeight: 600,
                    color: parseInt(String(r[4])) > 15 ? "var(--color-alarm-red)" : "var(--color-forest-ink)",
                  }}
                >
                  {r[4]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
