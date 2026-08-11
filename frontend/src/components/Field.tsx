import React from "react";

export const Field = ({ label, hint, children }: { label: React.ReactNode, hint?: React.ReactNode, children: React.ReactNode }) => (
  <div className="field"><label>{label}</label>{children}{hint && <span className="hint">{hint}</span>}</div>
);
