import React from "react";

export const Modal = ({ title, onClose, children, wide }) => (
  <div className="veil" onClick={onClose}>
    <div className="modal" style={wide ? { maxWidth: 620 } : null} onClick={e => e.stopPropagation()}>
      <div className="modal-h"><h3>{title}</h3><button onClick={onClose} aria-label="Close" style={{ fontSize: 21, lineHeight: 1 }}>×</button></div>
      <div className="modal-b">{children}</div>
    </div>
  </div>
);
