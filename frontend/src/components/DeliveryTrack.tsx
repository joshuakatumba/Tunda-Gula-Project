import React from "react";

export const DeliveryTrack = ({ status }) => {
  const idx = ["accepted", "out_for_delivery", "delivered"].indexOf(status);
  return (
    <div>
      <div className="bar"><i style={{ width: ((idx + 1) / 3) * 100 + "%" }} /></div>
      <div className="track" style={{ marginTop: 6 }}>
        {["Accepted", "On the way", "Delivered"].map((s, i) => <div key={s} className={"node" + (i <= idx ? " done" : "")}>{s}</div>)}
      </div>
    </div>
  );
};
