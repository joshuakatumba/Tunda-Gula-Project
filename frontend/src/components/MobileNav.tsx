import React, { useState } from "react";
import { X, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/Button";

export const MobileNav = ({ onAuthOpen }) => {
  const { session, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="btn-sm hamburger-btn"
        onClick={() => setOpen(true)}
        aria-label="Menu"
        style={{
          border: "none",
          background: "transparent",
          padding: "8px",
          color: "var(--color-obsidian)"
        }}
      >
        <Menu size={24} />
      </button>

      {open && (
        <div className="drawer-overlay" onClick={() => setOpen(false)}>
          <div
            className="drawer"
            onClick={e => e.stopPropagation()}
          >
            <div className="drawer-header">
              <h2 style={{ fontSize: "20px", margin: 0, color: "var(--color-obsidian)" }}>Menu</h2>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "var(--color-fog)",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer"
                }}
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="drawer-content">
              {session ? (
                <>
                  <div className="drawer-user-info">
                    <strong>{session.name}</strong>
                    <div style={{ fontSize: "13px", color: "var(--color-slate)" }}>{session.phone}</div>
                  </div>
                  <div className="rule" />
                  <Button variant="outline" style={{ width: "100%", justifyContent: "flex-start", border: "none" }} onClick={() => { logout(); setOpen(false); }}>
                    <i className="bx bx-log-out" style={{ marginRight: 8, fontSize: 20 }}></i> Log out
                  </Button>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <Button variant="primary" style={{ width: "100%" }} onClick={() => { onAuthOpen(); setOpen(false); }}>
                    Log in / Sign up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
