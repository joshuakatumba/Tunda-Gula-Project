import React from "react";

interface StatProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
}

export const Stat: React.FC<StatProps> = ({ label, value, sub }) => (
  <div
    style={{
      background: "var(--color-paper)",
      border: "1px solid var(--color-fog)",
      borderRadius: "var(--radius-cards)",
      padding: "24px",
      boxShadow: "var(--shadow-subtle)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    }}
  >
    <div style={{
      fontFamily: "var(--font-inter)",
      fontSize: "14px",
      fontWeight: 500,
      color: "var(--color-slate)",
    }}>
      {label}
    </div>
    <div style={{
      fontFamily: "var(--font-inter)",
      fontSize: "28px",
      fontWeight: 700,
      color: "var(--color-obsidian)",
      letterSpacing: "-0.3px",
      margin: "8px 0 4px",
    }}>
      {value}
    </div>
    {sub && (
      <div style={{
        fontFamily: "var(--font-inter)",
        fontSize: "12px",
        color: "var(--color-pebble)",
      }}>
        {sub}
      </div>
    )}
  </div>
);
