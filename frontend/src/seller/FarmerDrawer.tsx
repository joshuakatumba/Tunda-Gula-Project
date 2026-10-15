import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface FarmerDrawerProps {
  open: boolean;
  onClose: () => void;
  tabs: { id: string; label: string; icon: string }[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export const FarmerDrawer: React.FC<FarmerDrawerProps> = ({
  open,
  onClose,
  tabs,
  activeTab,
  onTabChange,
}) => {
  const [shouldRender, setShouldRender] = useState(open);
  const [animatingOut, setAnimatingOut] = useState(false);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      setAnimatingOut(false);
    } else if (shouldRender) {
      setAnimatingOut(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setAnimatingOut(false);
      }, 240);
      return () => clearTimeout(timer);
    }
  }, [open, shouldRender]);

  const handleClose = () => {
    setAnimatingOut(true);
    setTimeout(() => {
      onClose();
    }, 240);
  };

  if (!shouldRender) return null;

  return (
    <div
      className="drawer-overlay"
      onClick={handleClose}
      style={{
        opacity: animatingOut ? 0 : 1,
        transition: "opacity 0.24s ease",
      }}
    >
      <div
        className="drawer farmer-drawer-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          left: 0,
          right: "auto",
          transform: animatingOut ? "translateX(-100%)" : "translateX(0)",
          transition: "transform 0.24s cubic-bezier(0.16, 1, 0.3, 1)",
          animation: !animatingOut ? "farmerSlideRight 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards" : undefined,
        }}
      >
        <div className="drawer-header">
          <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-obsidian)" }}>
            Farmer Menu
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            style={{
              background: "var(--color-fog)",
              border: "none",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--color-charcoal)",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="drawer-content">
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {tabs.map((t) => {
              const isCurrent = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onTabChange(t.id);
                    handleClose();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 14px",
                    borderRadius: "var(--radius-cards)",
                    background: isCurrent ? "var(--color-linen-mist)" : "var(--color-paper)",
                    border: `1px solid ${isCurrent ? "var(--color-spruce)" : "var(--color-fog)"}`,
                    color: isCurrent ? "var(--color-forest-ink)" : "var(--color-obsidian)",
                    fontWeight: isCurrent ? 700 : 500,
                    fontSize: "14px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                >
                  <i
                    className={`bx ${t.icon}`}
                    style={{
                      fontSize: "19px",
                      color: isCurrent ? "var(--color-forest-ink)" : "var(--color-slate)",
                    }}
                  />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
