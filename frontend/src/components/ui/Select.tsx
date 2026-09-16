import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | SelectOption)[];
  placeholder?: string;
  grid?: boolean;
  style?: React.CSSProperties;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  grid = true,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions: SelectOption[] = options.map(opt =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find(o => o.value === value);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", ...style }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          height: "48px",
          padding: "12px 16px",
          borderRadius: "var(--radius-inputs)",
          border: "1px solid",
          borderColor: isOpen ? "var(--color-forest-ink)" : "var(--color-pebble)",
          backgroundColor: "var(--color-paper)",
          color: selectedOption ? "var(--color-obsidian)" : "var(--color-pebble)",
          fontFamily: "var(--font-inter)",
          fontSize: "16px",
          lineHeight: "1.5",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: isOpen ? "0 0 0 1px var(--color-forest-ink) inset" : "none",
        }}
      >
        <span style={{ fontWeight: selectedOption ? 500 : 400 }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={18}
          style={{
            color: "var(--color-slate)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            flexShrink: 0,
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 100,
            background: "var(--color-paper)",
            border: "1px solid var(--color-fog)",
            borderRadius: "var(--radius-cards)",
            boxShadow: "var(--shadow-xl)",
            padding: "12px",
            animation: "slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            maxHeight: "260px",
            overflowY: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: grid ? "repeat(2, 1fr)" : "1fr",
              gap: "8px",
            }}
          >
            {normalizedOptions.map(opt => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: grid ? "9px 12px" : "10px 14px",
                    borderRadius: grid ? "var(--radius-buttons)" : "var(--radius-cards)",
                    border: "1px solid",
                    borderColor: isSelected ? "var(--color-forest-ink)" : "transparent",
                    background: isSelected
                      ? "var(--color-forest-ink)"
                      : "var(--color-fog)",
                    color: isSelected
                      ? "var(--color-paper)"
                      : "var(--color-charcoal)",
                    fontFamily: "var(--font-inter)",
                    fontSize: "13px",
                    fontWeight: isSelected ? 600 : 500,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: grid ? "center" : "space-between",
                    gap: "6px",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "var(--color-linen-mist)";
                      e.currentTarget.style.color = "var(--color-forest-ink)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "var(--color-fog)";
                      e.currentTarget.style.color = "var(--color-charcoal)";
                    }
                  }}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check size={14} style={{ color: "var(--color-lime-voltage)" }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
