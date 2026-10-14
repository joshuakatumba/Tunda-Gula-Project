import React, { useState } from "react";
import { MoreSheet } from "./MoreSheet";

interface BottomNavProps {
  tabs: { id: string; label: string; icon: string }[];
  moreTabs?: { id: string; label: string; icon: string }[];
  activeId: string;
  onChange: (id: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ tabs, moreTabs, activeId, onChange }) => {
  const [showMore, setShowMore] = useState(false);
  const isMoreActive = moreTabs?.some(t => t.id === activeId);

  return (
    <>
      <nav className="bottom-nav" aria-label="Bottom Navigation">
        {tabs.map((tab) => {
          const isActive = activeId === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`bottom-nav-item ${isActive ? "active" : ""}`}
              onClick={() => onChange(tab.id)}
              aria-label={tab.label}
            >
              <i className={`bx ${isActive ? tab.icon.replace("bx-", "bxs-") : tab.icon}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
        
        {moreTabs && moreTabs.length > 0 && (
          <button
            type="button"
            className={`bottom-nav-item ${isMoreActive ? "active" : ""}`}
            onClick={() => setShowMore(true)}
            aria-label="More options"
          >
            <i className={`bx ${isMoreActive ? "bxs-grid-alt" : "bx-grid-alt"}`} />
            <span>More</span>
          </button>
        )}
      </nav>

      {showMore && moreTabs && (
        <MoreSheet 
          tabs={moreTabs} 
          activeId={activeId} 
          onChange={onChange} 
          onClose={() => setShowMore(false)} 
        />
      )}
    </>
  );
};
