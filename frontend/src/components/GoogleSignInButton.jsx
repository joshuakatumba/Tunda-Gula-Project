import React, { useEffect, useRef, useState } from "react";
import { useI18n } from "../context/I18nContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export function GoogleSignInButton({ onCredential, onError, disabled = false }) {
  const { t } = useI18n();
  const btnRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !btnRef.current) return;

    let cancelled = false;
    const initGsi = () => {
      if (cancelled || !window.google?.accounts?.id || !btnRef.current) return false;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (res) => {
          if (res?.credential) onCredential(res.credential);
          else onError?.("Google sign-in did not return a credential.");
        },
      });
      btnRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: "outline",
        size: "large",
        width: btnRef.current.offsetWidth || 320,
        text: "continue_with",
        shape: "rectangular",
      });
      setReady(true);
      return true;
    };

    if (!initGsi()) {
      const id = setInterval(() => {
        if (initGsi()) clearInterval(id);
      }, 250);
      return () => {
        cancelled = true;
        clearInterval(id);
      };
    }
    return () => { cancelled = true; };
  }, [onCredential, onError]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <button
        type="button"
        className="btn-alt"
        disabled
        title="Set VITE_GOOGLE_CLIENT_ID to enable Google Sign-In"
        style={{ width: "100%", opacity: 0.65, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        <i className="bx bxl-google" style={{ fontSize: 18 }} />
        <span>{t("auth.google_btn")}</span>
      </button>
    );
  }

  return (
    <div style={{ width: "100%", opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? "none" : "auto" }}>
      <div ref={btnRef} style={{ width: "100%", minHeight: ready ? 40 : 0 }} />
    </div>
  );
}

