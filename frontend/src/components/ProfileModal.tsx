import React from "react";
import { User, Mail, Phone, MapPin, ShieldCheck, LogOut, X } from "lucide-react";
import { UserSession } from "../context/AuthContext";
import { typeLabel } from "../utils/helpers";
import { Button } from "./ui/Button";

interface ProfileModalProps {
  user: UserSession;
  onClose: () => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onLogout }) => {
  const roleDisplay =
    user.role === "admin"
      ? "Administrator"
      : user.role === "seller"
      ? `Seller · ${typeLabel(user.seller_type) || "Farmer"}`
      : `Buyer · ${typeLabel(user.buyer_type) || "Produce Buyer"}`;

  return (
    <div className="veil" onClick={onClose}>
      <div
        className="modal"
        style={{
          maxWidth: 440,
          width: "92%",
          background: "var(--color-paper)",
          borderRadius: 16,
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
          overflow: "hidden",
          border: "1px solid var(--color-fog)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "18px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--color-fog)",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-obsidian)" }}>
            Account Profile
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--color-slate)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          {/* Header identity */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "var(--color-obsidian)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "var(--color-obsidian)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.name}
              </div>
              <div style={{ fontSize: 13, color: "var(--color-slate)", marginTop: 2 }}>
                {roleDisplay}
              </div>
            </div>
            {user.is_verified && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--color-spruce)",
                  background: "var(--color-linen-mist)",
                  padding: "4px 8px",
                  borderRadius: 6,
                }}
              >
                <ShieldCheck size={14} /> Verified
              </span>
            )}
          </div>

          <div
            style={{
              background: "var(--color-fog)",
              borderRadius: 12,
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {user.email && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
                <Mail size={16} color="var(--color-slate)" />
                <span style={{ color: "var(--color-obsidian)", fontWeight: 500 }}>{user.email}</span>
              </div>
            )}
            {user.phone && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
                <Phone size={16} color="var(--color-slate)" />
                <span style={{ color: "var(--color-obsidian)", fontWeight: 500 }}>{user.phone}</span>
              </div>
            )}
            {user.district && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
                <MapPin size={16} color="var(--color-slate)" />
                <span style={{ color: "var(--color-obsidian)", fontWeight: 500 }}>{user.district} District</span>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            style={{
              width: "100%",
              borderColor: "var(--color-alarm-red)",
              color: "var(--color-alarm-red)",
              justifyContent: "center",
            }}
            onClick={() => {
              onClose();
              onLogout();
            }}
          >
            <LogOut size={16} style={{ marginRight: 8 }} /> Log out
          </Button>
        </div>
      </div>
    </div>
  );
};
