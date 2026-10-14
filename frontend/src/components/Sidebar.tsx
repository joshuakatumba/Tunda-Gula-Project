import React from "react";

interface SidebarProps {
  tabs: { id: string; label: string; icon: string }[];
  activeId: string;
  onChange: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ tabs, activeId, onChange }) => {
  return (
    <div className="sidebar desktop-only">
      <div className="sidebar-nav">
        {tabs.map((tab) => {
          const isActive = activeId === tab.id;
          return (
            <button
              key={tab.id}
              className={`sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={() => onChange(tab.id)}
            >
              <i className={`bx ${tab.icon}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
