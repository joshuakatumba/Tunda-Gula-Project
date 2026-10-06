import React from "react";

interface BottomNavProps {
  tabs: { id: string; label: string; icon: string }[];
  activeId: string;
  onChange: (id: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ tabs, activeId, onChange }) => {
  return (
    <div className="bottom-nav">
      {tabs.map((tab) => {
        const isActive = activeId === tab.id;
        return (
          <button
            key={tab.id}
            className={`bottom-nav-item ${isActive ? "active" : ""}`}
            onClick={() => onChange(tab.id)}
          >
            <i className={`bx ${tab.icon} ${isActive ? "bxs" : "bx"}`} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
