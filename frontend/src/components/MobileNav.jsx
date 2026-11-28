import { useState } from "react";
import { createPortal } from "react-dom";
import { X, User, Check, LogOut, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import { typeLabel } from "../utils/helpers";
import { Button } from "./ui/Button";
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "lg", label: "Luganda" },
  { code: "sw", label: "Swahili" }
];
export const MobileNav = ({
  onAuthOpen,
  lang,
  setLang,
  tabs,
  activeTab,
  onTabChange
}) => {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const initials = user?.name ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() : "U";
  return <><button
    className="tb-ctl tb-icon mobile-profile-btn"
    onClick={() => setOpen(true)}
    aria-label={t("nav.profile")}
    title={t("nav.profile")}
  ><User size={20} /></button>{open && createPortal(<div className="drawer-overlay" onClick={() => setOpen(false)}><div className="drawer" onClick={(e) => e.stopPropagation()}><div className="drawer-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderBottom: "1px solid var(--color-fog)" }}><h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "var(--color-obsidian)" }}>
                {t("nav.profile")}
              </h2><button
    onClick={() => setOpen(false)}
    aria-label={t("common.close")}
    style={{
      background: "var(--color-fog)",
      border: "none",
      borderRadius: "50%",
      width: 32,
      height: 32,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      color: "var(--color-charcoal)"
    }}
  ><X size={16} /></button></div><div className="drawer-content">{user ? <div style={{
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "var(--color-fog)",
    padding: "14px",
    borderRadius: "var(--radius-cards)"
  }}><div style={{
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "var(--color-obsidian)",
    color: "var(--color-paper)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "15px",
    flexShrink: 0
  }}>{initials}</div><div style={{ minWidth: 0, flex: 1 }}><strong style={{ fontSize: "15px", display: "block", color: "var(--color-obsidian)" }}>{user.name}</strong><div style={{ fontSize: "12px", color: "var(--color-slate)", marginTop: "2px" }}>{user.role === "admin" ? t("nav.role.admin") : typeLabel(user.seller_type || user.buyer_type)}{user.phone ? ` \xB7 ${user.phone}` : ""}</div></div></div> : <Button
    style={{
      width: "100%",
      backgroundColor: "var(--color-obsidian)",
      color: "var(--color-paper)",
      border: "none"
    }}
    onClick={() => {
      onAuthOpen();
      setOpen(false);
    }}
  ><LogIn size={16} style={{ marginRight: "6px" }} /> {t("nav.sign_in_join")}
                </Button>}{user && tabs && tabs.length > 0 && <><div className="rule" style={{ margin: "4px 0" }} /><div><div style={{
    fontSize: "12px",
    fontWeight: 700,
    color: "var(--color-slate)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "10px"
  }}>
                      {t("nav.navigation")}
                    </div><div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>{tabs.map((tabItem) => {
    const isCurrent = activeTab === tabItem.id;
    return <button
      key={tabItem.id}
      type="button"
      onClick={() => {
        onTabChange?.(tabItem.id);
        setOpen(false);
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 14px",
        borderRadius: "var(--radius-cards)",
        background: isCurrent ? "var(--color-fog)" : "var(--color-paper)",
        border: `1px solid ${isCurrent ? "var(--color-charcoal)" : "var(--color-fog)"}`,
        color: "var(--color-obsidian)",
        fontWeight: isCurrent ? 700 : 500,
        fontSize: "14px",
        cursor: "pointer",
        textAlign: "left"
      }}
    ><i className={`bx ${tabItem.icon}`} style={{ fontSize: "18px", color: isCurrent ? "var(--color-obsidian)" : "var(--color-slate)" }} /><span>{tabItem.label}</span></button>;
  })}</div></div></>}<div className="rule" style={{ margin: "4px 0" }} />{
    /* Language Selection */
  }<div><div style={{
    fontSize: "12px",
    fontWeight: 700,
    color: "var(--color-slate)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "10px"
  }}>
                  {t("nav.language")}
                </div><div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>{LANGUAGES.map((l) => {
    const isSelected = lang === l.code;
    return <button
      key={l.code}
      type="button"
      onClick={() => setLang(l.code)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 14px",
        borderRadius: "var(--radius-cards)",
        border: "1px solid",
        borderColor: isSelected ? "var(--color-charcoal)" : "var(--color-fog)",
        background: isSelected ? "var(--color-fog)" : "var(--color-paper)",
        color: "var(--color-obsidian)",
        cursor: "pointer",
        fontWeight: isSelected ? 700 : 500,
        fontSize: "14px"
      }}
    ><span>{l.label}</span>{isSelected && <Check size={16} color="var(--color-obsidian)" />}</button>;
  })}</div></div>{user && <><div className="rule" style={{ margin: "4px 0" }} /><Button
    variant="outline"
    style={{
      width: "100%",
      justifyContent: "center",
      color: "var(--color-alarm-red)",
      borderColor: "var(--color-fog)",
      marginTop: "auto"
    }}
    onClick={() => {
      logout();
      setOpen(false);
    }}
  ><LogOut size={16} style={{ marginRight: "6px" }} /> {t("nav.logout")}
                  </Button></>}</div></div></div>, document.body)}</>;
};
