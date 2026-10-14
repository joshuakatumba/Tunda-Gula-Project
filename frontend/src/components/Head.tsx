import React from "react";

interface HeadProps {
  title: string;
  eyebrow?: any;
  lede?: any;
  reqs?: any;
  action?: React.ReactNode;
}

export const Head: React.FC<HeadProps> = ({ title, lede, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
    <div>
      <h1 style={{
        fontFamily: "var(--font-inter)",
        fontSize: "var(--fs-display)",
        fontWeight: 700,
        letterSpacing: "-0.396px",
        lineHeight: 1.25,
        color: "var(--color-obsidian)",
        margin: 0,
      }}>
        {title}
      </h1>
      {lede && <p style={{ marginTop: "8px", margin: 0, color: "var(--color-slate)", fontSize: "var(--fs-body)" }}>{lede}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);
