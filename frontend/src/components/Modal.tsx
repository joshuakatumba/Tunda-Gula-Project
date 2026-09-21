import React from "react";
import { X } from "lucide-react";

export const Modal = ({
  title,
  onClose,
  children,
  wide
}: {
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) => (
  <div className="veil" onClick={onClose}>
    <div
      className="modal"
      style={{
        maxWidth: wide ? 640 : 500,
        borderRadius: "var(--radius-largecards)",
        background: "var(--color-paper)",
        boxShadow: "var(--shadow-xl)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
      onClick={e => e.stopPropagation()}
    >
      <div
        style={{
          background: "var(--color-paper)",
          color: "var(--color-obsidian)",
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--color-fog)",
        }}
      >
        <h2 style={{
          margin: 0,
          fontFamily: "var(--font-inter)",
          fontSize: "20px",
          fontWeight: 600,
          letterSpacing: "-0.15px",
          color: "var(--color-obsidian)"
        }}>
          {title}
        </h2>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            borderRadius: "var(--radius-buttons)",
            color: "var(--color-slate)",
            background: "var(--color-fog)",
            cursor: "pointer",
            border: "none",
            padding: 0,
          }}
        >
          <X size={18} />
        </button>
      </div>
      <div
        className="modal-b"
        style={{
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          maxHeight: "calc(85vh - 73px)",
          overflowY: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {children}
      </div>
    </div>
  </div>
);
