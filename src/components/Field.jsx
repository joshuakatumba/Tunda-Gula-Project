import React from "react";

export const Field = ({ label, hint, children }) => (
  <div className="field"><label>{label}</label>{children}{hint && <span className="hint">{hint}</span>}</div>
);
