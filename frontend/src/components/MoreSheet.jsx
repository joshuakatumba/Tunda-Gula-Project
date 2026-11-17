import React from "react";
import { useI18n } from "../context/I18nContext";

export const MoreSheet = ({ tabs, activeId, onChange, onClose }) => {
  const { t } = useI18n();
  return (
    <div className="veil" onClick={onClose} style={{ zIndex: 120, alignItems: "flex-end" }}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          margin: 0,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        <div className="modal-h">
          <h2 style={{ fontSize: 18, margin: 0 }}>{t("nav.more")}</h2>
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            style={{
              background: "var(--color-fog)",
              border: "none",
              width: 32,
              height: 32,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <i className="bx bx-x" style={{ fontSize: 20 }} />
          </button>
        </div>
        <div className="modal-b" style={{ padding: "8px 20px calc(24px + env(safe-area-inset-bottom, 0px))" }}>
          <div className="sidebar-nav">
            {tabs.map((tab) => {
              const isActive = activeId === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                  onClick={() => {
                    onChange(tab.id);
                    onClose();
                  }}
                >
                  <i className={`bx ${isActive ? tab.icon.replace("bx-", "bxs-") : tab.icon}`} />
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
