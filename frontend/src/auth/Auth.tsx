import React, { useState } from "react";
import { Sprout, ShoppingBasket, Shield, Smartphone, MapPin, Loader2 } from "lucide-react";
import { SELLER_TYPES, BUYER_TYPES } from "../data/userTypes";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";
import { Pick } from "../components/Pick";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Typography } from "../components/ui/Typography";
import { Select } from "../components/ui/Select";

/** Normalise a Ugandan phone number to +256XXXXXXXXX format */
function formatPhone(phone: string): string {
  const digits = phone.replace(/\s+/g, "");
  if (digits.startsWith("+256")) return digits;
  if (digits.startsWith("256")) return "+" + digits;
  if (digits.startsWith("0")) return "+256" + digits.slice(1);
  return "+256" + digits;
}

export default function Auth({ init, onClose, onDone, say }) {
  const { requestOtp, verifyOtp, register } = useAuth();

  const [mode, setMode] = useState(init.mode);
  const [role, setRole] = useState(init.role || null);
  const [step, setStep] = useState(init.role ? "type" : "role");
  const [type, setType] = useState(null);
  const [d, setD] = useState({ name: "", nin: "", phone: "", district: "Wakiso", email: "" });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [gps, setGps] = useState(null);
  const [manual, setManual] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const otpOk = otp.join("").length === 6;
  const DISTRICTS = ["Wakiso", "Kampala", "Mukono", "Mpigi", "Luweero", "Nakaseke", "Buikwe", "Mityana"];

  const handleRequestOtp = async () => {
    setBusy(true);
    setError("");
    try {
      await requestOtp(formatPhone(d.phone));
      setStep("otp");
      say("Code sent! Check your phone.");
    } catch (err: any) {
      setError(err.data?.error || err.message || "Failed to send code");
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
        // Existing user — logged in
        onDone(res.user);
      } else if (res.verified) {
        // Phone verified but no account — proceed to registration
        if (res.verification_token) {
          setVerificationToken(res.verification_token);
        }
        if (mode === "login") {
          setError("No account found with this number. Complete registration below.");
          setMode("join");
          setStep("role");
        }
      }
    } catch (err: any) {
      setError(err.data?.error || err.message || "Invalid code");
    } finally {
      setBusy(false);
    }
  };

  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const handleRegister = async (tokenOverride?: string) => {
    setBusy(true);
    setError("");
    const token = tokenOverride || verificationToken;
    try {
      await register({
        phone: formatPhone(d.phone),
        name: d.name,
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
        ...(role === "admin" ? { email: d.email } : {}),
      });
      say(role === "seller"
        ? "Account created. Your verification is with an administrator — you will get an SMS within 24 hours."
        : "Account created. You can start ordering now.");
      onDone();
    } catch (err: any) {
      const data = err.data;
      if (data && typeof data === "object") {
        const firstField = Object.keys(data)[0];
        const msg = Array.isArray(data[firstField]) ? data[firstField][0] : data[firstField];
        setError(`${firstField}: ${msg}`);
      } else {
        setError(err.message || "Registration failed");
      }
    } finally {
      setBusy(false);
    }
  };

  /* ---- log in ---- */
  if (mode === "login") {
    return (
      <Modal title="Log in" onClose={onClose}>
        {error && <div className="sms" style={{ color: "#A3320B", background: "#FFF0EC" }}>{error}</div>}
        <Field label="Phone number"><input placeholder="0772 000 000" value={d.phone} onChange={e => setD({ ...d, phone: e.target.value })} /></Field>
        {step === "otp" ? (
          <>
            <Field label="Enter the 6-digit code">
              <div className="otp">
                {otp.map((v, i) => (
                  <input key={i} maxLength={1} value={v} inputMode="numeric"
                    onChange={e => { const n = [...otp]; n[i] = e.target.value.replace(/\D/, ""); setOtp(n);
                      if (e.target.value && e.target.nextSibling) (e.target.nextSibling as HTMLElement).focus(); }} />
                ))}
              </div>
            </Field>
            <Button variant="primary" disabled={!otpOk || busy} onClick={handleVerifyOtp}>
              {busy ? <Loader2 size="1em" className="spin" /> : "Verify and log in"}
            </Button>
          </>
        ) : (
          <Button variant="primary" disabled={!d.phone || busy} onClick={handleRequestOtp}>
            {busy ? <Loader2 size="1em" className="spin" /> : "Send me a code"}
          </Button>
        )}
        <div className="rule" />
        <div className="row"><span className="hint">No account yet?</span>
          <Button variant="text" onClick={() => { setMode("join"); setStep("role"); setError(""); }}>Register instead</Button></div>
      </Modal>
    );
  }

  /* ---- register ---- */
  const TYPES = role === "seller" ? SELLER_TYPES : BUYER_TYPES;
  const stepNo = { role: 1, type: 2, details: 3, otp: 4, gps: 5 }[step];
  const total = role === "seller" ? 5 : 4;

  return (
    <Modal title={role ? `Register as a ${role}` : "Join TundaGula"} onClose={onClose}>

      {error && <div className="sms" style={{ color: "#A3320B", background: "#FFF0EC" }}>{error}</div>}

      {step === "role" && (
        <>

          <div className="stack">
            <Pick on={false} ic={<Sprout size="1em" />} t="I am selling produce" d="Farmers, cooperatives, aggregators." onClick={() => { setRole("seller"); setStep("type"); }} />
            <Pick on={false} ic={<ShoppingBasket size="1em" />} t="I am buying produce" d="Households, restaurants, retailers, institutions." onClick={() => { setRole("buyer"); setStep("type"); }} />
            <Pick on={false} ic={<Shield size="1em" />} t="I am TundaGula staff" d="Administrator access." onClick={() => { setRole("admin"); setStep("details"); }} />
          </div>
          <div className="row"><span className="hint">Already registered?</span><Button variant="text" onClick={() => { setMode("login"); setError(""); }}>Log in</Button></div>
        </>
      )}

      {step === "type" && (
        <>

          <div className="stack">
            {TYPES.map(x => <Pick key={x.id} on={type === x.id} ic={x.ic} t={x.t} d={x.d} onClick={() => setType(x.id)} />)}
          </div>
          <Button variant="primary" disabled={!type} onClick={() => setStep("details")}>Continue</Button>
        </>
      )}

      {step === "details" && role === "admin" && (
        <>
          <Field label="Staff email"><input value={d.email} placeholder="name@tundagula.ug" onChange={e => setD({ ...d, email: e.target.value })} /></Field>
          <Field label="Phone number"><input value={d.phone} placeholder="0772 000 000" onChange={e => setD({ ...d, phone: e.target.value })} /></Field>
          <Field label="Access code"><input type="password" placeholder="••••••" /></Field>
          <Button variant="primary" disabled={!d.email || !d.phone || busy} onClick={() => {
            setD({ ...d, name: d.email.split("@")[0] });
            handleRequestOtp();
          }}>{busy ? <Loader2 size="1em" className="spin" /> : "Send verification code"}</Button>
        </>
      )}

      {step === "details" && role !== "admin" && (
        <>
          <Field label={role === "seller" ? "Full name, as on your national ID" : "Name or business name"}>
            <input value={d.name} placeholder={role === "seller" ? "David Ssemakula" : "Nakato Catering"} onChange={e => setD({ ...d, name: e.target.value })} />
          </Field>
          {role === "seller" && (
            <Field label="National ID number (NIN)">
              <input value={d.nin} placeholder="CF9204119XKJ2E" onChange={e => setD({ ...d, nin: e.target.value.toUpperCase() })} />
            </Field>
          )}
          <Field label="Mobile money number">
            <input value={d.phone} placeholder="0772 000 000" onChange={e => setD({ ...d, phone: e.target.value })} />
          </Field>
          <Field label="District">
            <Select
              value={d.district}
              onChange={val => setD({ ...d, district: val })}
              options={DISTRICTS}
              grid={true}
            />
          </Field>
          <Button variant="primary" disabled={!d.name || !d.phone || (role === "seller" && !d.nin) || busy} onClick={() => {
            if (verificationToken) {
              if (role === "seller") {
                setStep("gps");
              } else {
                handleRegister();
              }
            } else {
              handleRequestOtp();
            }
          }}>
            {busy ? <Loader2 size="1em" className="spin" /> : (verificationToken ? "Continue" : "Send verification code")}
          </Button>
        </>
      )}

      {step === "otp" && (
        <>
          <div style={{ textAlign: "center", fontSize: 30 }}><Smartphone size="1em" /></div>

          <div className="otp" style={{ justifyContent: "center" }}>
            {otp.map((v, i) => (
              <input key={i} maxLength={1} value={v} inputMode="numeric"
                onChange={e => { const n = [...otp]; n[i] = e.target.value.replace(/\D/, ""); setOtp(n);
                  if (e.target.value && e.target.nextSibling) (e.target.nextSibling as HTMLElement).focus(); }} />
            ))}
          </div>
          <Button variant="text" style={{ alignSelf: "center" }} onClick={async () => {
            setError("");
            try {
              await requestOtp(formatPhone(d.phone));
              say("New code sent.");
            } catch (err: any) {
              setError(err.data?.error || err.message || "Failed to resend code");
            }
          }}>Send the code again</Button>
          <Button variant="primary" disabled={!otpOk || busy} onClick={async () => {
            setBusy(true);
            setError("");
            try {
              const res = await verifyOtp(formatPhone(d.phone), otp.join(""));
              if (res.token && res.user) {
                // Existing user logging in during registration flow
                onDone(res.user);
              } else if (res.verified) {
                if (res.verification_token) {
                  setVerificationToken(res.verification_token);
                }
                // Phone verified, now proceed to registration or GPS step
                if (role === "seller") {
                  setStep("gps");
                } else {
                  await handleRegister(res.verification_token);
                }
              }
            } catch (err: any) {
              setError(err.data?.error || err.message || "Invalid code");
            } finally {
              setBusy(false);
            }
          }}>
            {busy ? <Loader2 size="1em" className="spin" /> : "Verify my number"}
          </Button>
        </>
      )}

      {step === "gps" && (
        <>

          <div className="map">{gps ? <span className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><MapPin size="1em" /> {gps}</span> : "Map view · tap below to pin"}</div>
          <Button variant="outline" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => {
            navigator.geolocation?.getCurrentPosition(
              pos => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setGpsCoords({ lat, lng });
                setGps(`${lat.toFixed(4)}N, ${lng.toFixed(4)}E`);
              },
              () => {
                setError("Location access denied. Please enter your location manually below.");
              },
              { enableHighAccuracy: true, timeout: 10000 }
            );
          }}><MapPin size="1em" /> Use my current location</Button>
          <Field label="Or describe where the farm is" hint="Use this if location services are off or the signal is weak.">
            <input value={manual} placeholder="Kasangati, Gayaza road, 2 km past the trading centre" onChange={e => setManual(e.target.value)} />
          </Field>
          <div className="sms">Next: an administrator checks your ID against your phone registration. You will get an SMS with the result within 24 hours. You can look around the platform while you wait.</div>
          <Button variant="primary" disabled={(!gps && !manual) || busy} onClick={() => handleRegister()}>
            {busy ? <Loader2 size="1em" className="spin" /> : "Finish registration"}
          </Button>
        </>
      )}
    </Modal>
  );
}
