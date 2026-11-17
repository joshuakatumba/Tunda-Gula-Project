import React, { useState, useCallback } from "react";
import { Sprout, ShoppingBasket, MapPin, Loader2 } from "lucide-react";
import { SELLER_TYPES, BUYER_TYPES } from "../data/userTypes";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";
import { Pick } from "../components/Pick";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { formatApiError } from "../utils/errorHandler";

function formatPhone(phone) {
  const digits = phone.replace(/\s+/g, "");
  if (digits.startsWith("+256")) return digits;
  if (digits.startsWith("256")) return "+" + digits;
  if (digits.startsWith("0")) return "+256" + digits.slice(1);
  return "+256" + digits;
}

const DISTRICTS = ["Wakiso", "Kampala", "Mukono", "Mpigi", "Luweero", "Nakaseke", "Buikwe", "Mityana"];

export default function Auth({ init, onClose, onDone, say }) {
  const { login, googleLogin, requestOtp, verifyOtp, register } = useAuth();
  const { t } = useI18n();

  const [mode, setMode] = useState(init.mode || "login");
  const [role, setRole] = useState(init.role || null);
  const [step, setStep] = useState(init.role ? (init.role === "admin" ? "details" : "type") : "role");
  const [type, setType] = useState(null);
  const [d, setD] = useState({ name: "", nin: "", phone: "", district: "Wakiso", email: "", password: "" });
  const [loginWithOtp, setLoginWithOtp] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [gps, setGps] = useState(null);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [manual, setManual] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const otpOk = otp.join("").length === 6;

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!d.email.trim() || !d.password) {
      setError(`${t("auth.email_or_phone")} & ${t("auth.password")}`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const loggedInUser = await login(d.email.trim(), d.password);
      say(loggedInUser.name);
      onDone(loggedInUser);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleCredential = useCallback(async (credential) => {
    setBusy(true);
    setError("");
    try {
      const loggedInUser = await googleLogin(credential, {
        buyer_type: type || "household",
        district: d.district || "Kampala",
      });
      say(loggedInUser.name);
      onDone(loggedInUser);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }, [googleLogin, type, d.district, say, onDone]);

  const handleRequestOtp = async () => {
    if (!d.phone.trim()) return;
    setBusy(true);
    setError("");
    try {
      await requestOtp(formatPhone(d.phone));
      setStep("otp");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await verifyOtp(formatPhone(d.phone), otp.join(""));
      if (res.token && res.user) {
        onDone(res.user);
      } else if (res.verified) {
        if (res.verification_token) setVerificationToken(res.verification_token);
        if (mode === "login") {
          setMode("join");
          setRole("seller");
          setStep("type");
        } else {
          setStep("gps");
        }
      }
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (tokenOverride) => {
    setBusy(true);
    setError("");
    const token = tokenOverride || verificationToken;
    try {
      await register({
        ...(d.phone ? { phone: formatPhone(d.phone) } : {}),
        name: d.name,
        email: d.email,
        password: d.password,
        role,
        ...(token ? { verification_token: token } : {}),
        ...(role === "seller" ? {
          seller_type: type,
          nin: d.nin,
          district: d.district,
          gps_lat: gpsCoords ? gpsCoords.lat : undefined,
          gps_lng: gpsCoords ? gpsCoords.lng : undefined,
          manual_location: manual,
        } : {}),
        ...(role === "buyer" ? { buyer_type: type, district: d.district } : {}),
      });
      onDone();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const pinGps = () => {
    if (!navigator.geolocation) {
      setGps("GPS unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setGpsCoords({ lat, lng });
        setGps(`${lat}, ${lng}`);
      },
      () => setError("GPS unavailable")
    );
  };

  if (mode === "login") {
    return (
      <Modal title={t("auth.login_title")} onClose={onClose}>
        {error && <div className="sms" style={{ color: "#A3320B", background: "#FFF0EC" }}>{error}</div>}

        {loginWithOtp ? (
          <>
            <Field label={t("auth.phone")}>
              <input placeholder="0772 000 000" value={d.phone} onChange={e => setD({ ...d, phone: e.target.value })} />
            </Field>
            {step === "otp" ? (
              <>
                <Field label={t("auth.sms_code")}>
                  <div className="otp">
                    {otp.map((v, i) => (
                      <input
                        key={i}
                        maxLength={1}
                        value={v}
                        inputMode="numeric"
                        onChange={e => {
                          const n = [...otp];
                          n[i] = e.target.value.replace(/\D/, "");
                          setOtp(n);
                          if (e.target.value && e.target.nextSibling) e.target.nextSibling.focus();
                        }}
                      />
                    ))}
                  </div>
                </Field>
                <Button variant="primary" disabled={!otpOk || busy} onClick={handleVerifyOtp}>
                  {busy ? <Loader2 size="1em" className="spin" /> : t("auth.verify_login")}
                </Button>
              </>
            ) : (
              <Button variant="primary" disabled={!d.phone || busy} onClick={handleRequestOtp}>
                {busy ? <Loader2 size="1em" className="spin" /> : t("auth.send_code")}
              </Button>
            )}
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <Button variant="text" onClick={() => { setLoginWithOtp(false); setStep("role"); setError(""); }}>
                {t("auth.use_password")}
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={handleLogin} className="stack" style={{ gap: 12 }}>
            <Field label={t("auth.email_or_phone")}>
              <input type="text" placeholder="you@example.com / 0772..." value={d.email} onChange={e => setD({ ...d, email: e.target.value })} />
            </Field>
            <Field label={t("auth.password")}>
              <input type="password" placeholder="••••••••" value={d.password} onChange={e => setD({ ...d, password: e.target.value })} />
            </Field>
            <Button type="submit" variant="primary" disabled={!d.email || !d.password || busy}>
              {busy ? <Loader2 size="1em" className="spin" /> : t("auth.login_title")}
            </Button>

            <div style={{ textAlign: "center", fontSize: 12, color: "var(--color-slate)" }}>{t("auth.or_customers")}</div>
            <GoogleSignInButton onCredential={handleGoogleCredential} onError={setError} disabled={busy} />

            <div style={{ textAlign: "center" }}>
              <Button type="button" variant="text" onClick={() => { setLoginWithOtp(true); setStep("phone"); setError(""); }}>
                {t("auth.farmer_otp_btn")}
              </Button>
            </div>
          </form>
        )}

        <div className="rule" />
        <div className="row">
          <span className="hint">{t("auth.no_account")}</span>
          <Button variant="text" onClick={() => { setMode("join"); setStep("role"); setError(""); }}>{t("auth.register")}</Button>
        </div>
      </Modal>
    );
  }

  const TYPES = role === "seller" ? SELLER_TYPES : BUYER_TYPES;
  const roleTitle = role === "seller" ? t("auth.role.seller") : t("auth.role.buyer");

  return (
    <Modal title={role ? t("auth.join_as", { role: roleTitle }) : t("auth.join_title")} onClose={onClose}>
      {error && <div className="sms" style={{ color: "#A3320B", background: "#FFF0EC" }}>{error}</div>}

      {step === "role" && (
        <>
          <div className="stack">
            <Pick on={false} ic={<Sprout size="1em" />} t={t("auth.role.seller")} d={t("auth.role.seller_desc")} onClick={() => { setRole("seller"); setStep("type"); }} />
            <Pick on={false} ic={<ShoppingBasket size="1em" />} t={t("auth.role.buyer")} d={t("auth.role.buyer_desc")} onClick={() => { setRole("buyer"); setStep("type"); }} />
          </div>
          <div className="row">
            <span className="hint">{t("auth.have_account")}</span>
            <Button variant="text" onClick={() => { setMode("login"); setError(""); }}>{t("auth.login_title")}</Button>
          </div>
        </>
      )}

      {step === "type" && (
        <>
          <div className="stack">
            {TYPES.map(x => <Pick key={x.id} on={type === x.id} ic={x.ic} t={x.t} d={x.d} onClick={() => setType(x.id)} />)}
          </div>
          <Button variant="primary" disabled={!type} onClick={() => setStep("details")}>{t("common.continue")}</Button>
        </>
      )}

      {step === "details" && role === "buyer" && (
        <div className="stack" style={{ gap: 12 }}>
          <GoogleSignInButton onCredential={handleGoogleCredential} onError={setError} disabled={busy} />
          <div style={{ textAlign: "center", fontSize: 12, color: "var(--color-slate)" }}>{t("auth.or_email")}</div>

          <Field label={t("auth.name")}>
            <input value={d.name} placeholder="Nakato Catering" onChange={e => setD({ ...d, name: e.target.value })} />
          </Field>
          <Field label={t("auth.email")}>
            <input type="email" value={d.email} placeholder="you@example.com" onChange={e => setD({ ...d, email: e.target.value })} />
          </Field>
          <Field label={t("auth.password")}>
            <input type="password" placeholder="••••••••" value={d.password} onChange={e => setD({ ...d, password: e.target.value })} />
          </Field>
          <Field label={t("auth.phone_opt")}>
            <input value={d.phone} placeholder="0772 000 000" onChange={e => setD({ ...d, phone: e.target.value })} />
          </Field>
          <Field label={t("auth.district")}>
            <Select value={d.district} onChange={val => setD({ ...d, district: val })} options={DISTRICTS} grid={true} />
          </Field>
          <Button variant="primary" disabled={!d.name || !d.email || !d.password || busy} onClick={() => handleRegister()}>
            {busy ? <Loader2 size="1em" className="spin" /> : t("auth.create_account")}
          </Button>
        </div>
      )}

      {step === "details" && role === "seller" && (
        <div className="stack" style={{ gap: 12 }}>
          <Field label={t("auth.name")}>
            <input value={d.name} placeholder="David Ssemakula" onChange={e => setD({ ...d, name: e.target.value })} />
          </Field>
          <Field label={t("auth.nin")}>
            <input value={d.nin} placeholder="CF9204119XKJ2E" onChange={e => setD({ ...d, nin: e.target.value.toUpperCase() })} />
          </Field>
          <Field label={t("auth.phone")}>
            <input value={d.phone} placeholder="0772 000 000" onChange={e => setD({ ...d, phone: e.target.value })} />
          </Field>
          <Field label={t("auth.district")}>
            <Select value={d.district} onChange={val => setD({ ...d, district: val })} options={DISTRICTS} grid={true} />
          </Field>
          <Button
            variant="primary"
            disabled={!d.name || !d.phone || !d.nin || busy}
            onClick={() => (verificationToken ? setStep("gps") : handleRequestOtp())}
          >
            {busy ? <Loader2 size="1em" className="spin" /> : (verificationToken ? t("common.continue") : t("auth.send_code"))}
          </Button>
        </div>
      )}

      {step === "otp" && role === "seller" && (
        <div className="stack" style={{ gap: 12 }}>
          <Field label={t("auth.sms_code")}>
            <div className="otp">
              {otp.map((v, i) => (
                <input
                  key={i}
                  maxLength={1}
                  value={v}
                  inputMode="numeric"
                  onChange={e => {
                    const n = [...otp];
                    n[i] = e.target.value.replace(/\D/, "");
                    setOtp(n);
                    if (e.target.value && e.target.nextSibling) e.target.nextSibling.focus();
                  }}
                />
              ))}
            </div>
          </Field>
          <Button variant="primary" disabled={!otpOk || busy} onClick={handleVerifyOtp}>
            {busy ? <Loader2 size="1em" className="spin" /> : t("auth.verify_phone")}
          </Button>
        </div>
      )}

      {step === "gps" && role === "seller" && (
        <div className="stack" style={{ gap: 12 }}>
          <Button variant="outline" onClick={pinGps}>
            <MapPin size={16} /> {gps || t("auth.pin_gps")}
          </Button>
          <Field label={t("auth.landmark")}>
            <input value={manual} placeholder="Kira Town, Wakiso" onChange={e => setManual(e.target.value)} />
          </Field>
          <Button variant="primary" disabled={busy || (!gps && !manual)} onClick={() => handleRegister()}>
            {busy ? <Loader2 size="1em" className="spin" /> : t("auth.submit_verify")}
          </Button>
        </div>
      )}
    </Modal>
  );
}
