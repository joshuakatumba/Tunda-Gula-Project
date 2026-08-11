import React from "react";

export const Stat = ({ label, value, sub }) => (
  <div className="card stat"><div className="s-label">{label}</div><div className="s-val">{value}</div>{sub && <div className="s-sub">{sub}</div>}</div>
);
