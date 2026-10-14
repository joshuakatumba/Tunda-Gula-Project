import React from "react";

interface FilterChipsProps {
  options: { id: string; label: string }[];
  activeId: string;
  onChange: (id: string) => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({ options, activeId, onChange }) => {
  return (
    <div className="h-scroll" style={{
      display: "flex",
      gap: "8px",
      overflowX: "auto",
      paddingBottom: "4px",
      paddingTop: "2px",
      scrollSnapType: "x mandatory",
      WebkitOverflowScrolling: "touch",
      scrollbarWidth: "none",
    }}>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          style={{
            flexShrink: 0,
            scrollSnapAlign: "start",
            padding: "8px 16px",
            borderRadius: "9999px",
            fontSize: "13px",
            fontWeight: activeId === opt.id ? 700 : 500,
            border: "1px solid",
            borderColor: activeId === opt.id ? "var(--color-charcoal)" : "var(--color-fog)",
            backgroundColor: activeId === opt.id ? "var(--color-fog)" : "var(--color-paper)",
            color: "var(--color-obsidian)",
            cursor: "pointer",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};
