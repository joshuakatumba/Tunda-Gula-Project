import React from "react";

interface MoreSheetProps {
  tabs: { id: string; label: string; icon: string }[];
  activeId: string;
  onChange: (id: string) => void;
  onClose: () => void;
}

export const MoreSheet: React.FC<MoreSheetProps> = ({ tabs, activeId, onChange, onClose }) => {
  return (
    <div className="veil" onClick={onClose} style={{ zIndex: 60 }}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ alignSelf: "flex-end", margin: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
        <div className="modal-h">
          <h2 style={{ fontSize: 20, margin: 0 }}>More</h2>
          <button onClick={onClose} style={{ background: "var(--color-fog)", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="bx bx-x" style={{ fontSize: 20 }} />
          </button>
        </div>
        <div className="modal-b" style={{ padding: "8px 24px 24px" }}>
          <div className="sidebar-nav">
            {tabs.map((tab) => {
              const isActive = activeId === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                  onClick={() => {
                    onChange(tab.id);
                    onClose();
                  }}
                >
                  <i className={`bx ${tab.icon} ${isActive ? "bxs" : "bx"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
