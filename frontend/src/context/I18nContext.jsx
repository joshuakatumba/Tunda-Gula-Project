import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import en from "../i18n/en.json";
import lg from "../i18n/lg.json";
import sw from "../i18n/sw.json";

const DICTS = { en, lg, sw };

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("tg-lang") : null;
    return saved && DICTS[saved] ? saved : "en";
  });

  const setLang = useCallback((next) => {
    if (!DICTS[next]) return;
    setLangState(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("tg-lang", next);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const t = useCallback(
    (key, vars) => {
      const dict = DICTS[lang] || en;
      let str = dict[key] ?? en[key] ?? key;
      if (vars && typeof str === "string") {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replaceAll(`{{${k}}}`, String(v));
        }
      }
      return str;
    },
    [lang]
  );

  const tu = useCallback(
    (unit) => {
      if (!unit) return "";
      const key = `unit.${String(unit).toLowerCase()}`;
      const dict = DICTS[lang] || en;
      return dict[key] ?? en[key] ?? unit;
    },
    [lang]
  );

  const tp = useCallback(
    (name) => {
      if (!name) return "";
      const key = `produce.${String(name).toLowerCase()}`;
      const dict = DICTS[lang] || en;
      return dict[key] ?? en[key] ?? name;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t, tu, tp }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within <I18nProvider>");
  return ctx;
}
