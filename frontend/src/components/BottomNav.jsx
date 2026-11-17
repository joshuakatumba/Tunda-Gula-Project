import React, { useState } from "react";
import { MoreSheet } from "./MoreSheet";
import { useI18n } from "../context/I18nContext";

export const BottomNav = ({ tabs, moreTabs, activeId, onChange }) => {
  const { t } = useI18n();
  const [showMore, setShowMore] = useState(false);
  const isMoreActive = moreTabs?.some((tab) => tab.id === activeId);

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
            aria-label={t("nav.more")}
          >
            <i className={`bx ${isMoreActive ? "bxs-grid-alt" : "bx-grid-alt"}`} />
            <span>{t("nav.more")}</span>
          </button>
        )}
      </nav>
      {showMore && (
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
