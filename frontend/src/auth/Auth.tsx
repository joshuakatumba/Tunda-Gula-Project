import React, { useState } from "react";
import { Sprout, ShoppingBasket, Shield, Smartphone, MapPin, Loader2 } from "lucide-react";
import { SELLER_TYPES, BUYER_TYPES } from "../data/userTypes";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";
import { Pick } from "../components/Pick";
import { useAuth } from "../context/AuthContext";

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState("");

  const otpOk = otp.join("").length === 6;
  const DISTRICTS = ["Wakiso", "Kampala", "Mukono", "Mpigi", "Luweero", "Nakaseke", "Buikwe", "Mityana"];

  const handleRequestOtp = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await requestOtp(d.phone);
      // In dev mode, the API returns the code so you don't need real SMS
      if (res.code_dev_only) {
        setDevCode(res.code_dev_only);
        say(`Dev mode — your code is: ${res.code_dev_only}`);
      }
      setStep("otp");
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
      const res = await verifyOtp(d.phone, otp.join(""));
      if (res.token && res.user) {
        // Existing user — logged in
        onDone();
      } else if (res.verified) {
        // Phone verified but no account — proceed to registration
        if (mode === "login") {
          setError("No account found with this number. Register instead.");
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

  const handleRegister = async () => {
    setBusy(true);
    setError("");
    try {
      await register({
        phone: d.phone,
        name: d.name,
        role,
        ...(role === "seller" ? {
          seller_type: type,
          nin: d.nin,
          district: d.district,
          gps_lat: gps ? 0.4044 : undefined,
          gps_lng: gps ? 32.4594 : undefined,
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
        // Show first field error
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
        <p className="hint">Your phone number is your account. We send a one-time code to it — there is no password to forget.</p>
        {error && <div className="sms" style={{ color: "#A3320B", background: "#FFF0EC" }}>{error}</div>}
        <Field label="Phone number"><input placeholder="0772 000 000" value={d.phone} onChange={e => setD({ ...d, phone: e.target.value })} /></Field>
        {step === "otp" ? (
          <>
            <Field label="Enter the 6-digit code" hint={devCode ? `Dev code: ${devCode}` : "Check your phone for the code. It expires after 10 minutes."}>
              <div className="otp">
                {otp.map((v, i) => (
                  <input key={i} maxLength={1} value={v} inputMode="numeric"
                    onChange={e => { const n = [...otp]; n[i] = e.target.value.replace(/\D/, ""); setOtp(n);
                      if (e.target.value && e.target.nextSibling) (e.target.nextSibling as HTMLElement).focus(); }} />
                ))}
              </div>
            </Field>
            <button className="btn-maize" disabled={!otpOk || busy} onClick={handleVerifyOtp}>
              {busy ? <Loader2 size="1em" className="spin" /> : "Verify and log in"}
            </button>
          </>
        ) : (
          <button className="btn-maize" disabled={!d.phone || busy} onClick={handleRequestOtp}>
            {busy ? <Loader2 size="1em" className="spin" /> : "Send me a code"}
          </button>
        )}
        <div className="rule" />
        <div className="row"><span className="hint">No account yet?</span>
          <button className="link" onClick={() => { setMode("join"); setStep("role"); setError(""); }}>Register instead</button></div>
      </Modal>
    );
  }

  /* ---- register ---- */
  const TYPES = role === "seller" ? SELLER_TYPES : BUYER_TYPES;
  const stepNo = { role: 1, type: 2, details: 3, otp: 4, gps: 5 }[step];
  const total = role === "seller" ? 5 : 4;

  return (
    <Modal title={role ? `Register as a ${role}` : "Join TundaGula"} onClose={onClose}>
      {role && <div className="hint mono">Step {stepNo - 1} of {total - 1}</div>}
      {error && <div className="sms" style={{ color: "#A3320B", background: "#FFF0EC" }}>{error}</div>}

      {step === "role" && (
        <>
          <p className="hint">What brings you here?</p>
          <div className="stack">
            <Pick on={false} ic={<Sprout size="1em" />} t="I am selling produce" d="Farmers, cooperatives, aggregators." onClick={() => { setRole("seller"); setStep("type"); }} />
            <Pick on={false} ic={<ShoppingBasket size="1em" />} t="I am buying produce" d="Households, restaurants, retailers, institutions." onClick={() => { setRole("buyer"); setStep("type"); }} />
            <Pick on={false} ic={<Shield size="1em" />} t="I am TundaGula staff" d="Administrator access." onClick={() => { setRole("admin"); setStep("details"); }} />
          </div>
          <div className="row"><span className="hint">Already registered?</span><button className="link" onClick={() => { setMode("login"); setError(""); }}>Log in</button></div>
        </>
      )}

      {step === "type" && (
        <>
          <p className="hint">{role === "seller" ? "What kind of seller are you? This sets up your dashboard." : "What are you buying for? This tunes what we show you first."}</p>
          <div className="stack">
            {TYPES.map(x => <Pick key={x.id} on={type === x.id} ic={x.ic} t={x.t} d={x.d} onClick={() => setType(x.id)} />)}
          </div>
          <button className="btn-maize" disabled={!type} onClick={() => setStep("details")}>Continue</button>
        </>
      )}

      {step === "details" && role === "admin" && (
        <>
          <Field label="Staff email"><input value={d.email} placeholder="name@tundagula.ug" onChange={e => setD({ ...d, email: e.target.value })} /></Field>
          <Field label="Phone number"><input value={d.phone} placeholder="0772 000 000" onChange={e => setD({ ...d, phone: e.target.value })} /></Field>
          <Field label="Access code" hint="Issued by the platform owner. Admin accounts are never self-registered."><input type="password" placeholder="••••••" /></Field>
          <button className="btn-maize" disabled={!d.email || !d.phone || busy} onClick={() => {
            setD({ ...d, name: d.email.split("@")[0] });
            handleRequestOtp();
          }}>{busy ? <Loader2 size="1em" className="spin" /> : "Send verification code"}</button>
        </>
      )}

      {step === "details" && role !== "admin" && (
        <>
          <Field label={role === "seller" ? "Full name, as on your national ID" : "Name or business name"}>
            <input value={d.name} placeholder={role === "seller" ? "David Ssemakula" : "Nakato Catering"} onChange={e => setD({ ...d, name: e.target.value })} />
          </Field>
          {role === "seller" && (
            <Field label="National ID number (NIN)" hint="We check this name against the name your phone number is registered under.">
              <input value={d.nin} placeholder="CF9204119XKJ2E" onChange={e => setD({ ...d, nin: e.target.value.toUpperCase() })} />
            </Field>
          )}
          <Field label="Mobile money number" hint="This is the number you will be paid on, and the number you log in with.">
            <input value={d.phone} placeholder="0772 000 000" onChange={e => setD({ ...d, phone: e.target.value })} />
          </Field>
          <Field label="District">
            <select value={d.district} onChange={e => setD({ ...d, district: e.target.value })}>{DISTRICTS.map(x => <option key={x}>{x}</option>)}</select>
          </Field>
          <button className="btn-maize" disabled={!d.name || !d.phone || (role === "seller" && !d.nin) || busy} onClick={handleRequestOtp}>
            {busy ? <Loader2 size="1em" className="spin" /> : "Send verification code"}
          </button>
        </>
      )}

      {step === "otp" && (
        <>
          <div style={{ textAlign: "center", fontSize: 30 }}><Smartphone size="1em" /></div>
          <p className="hint" style={{ textAlign: "center" }}>We sent a 6-digit code to {d.phone || "your phone"}. It expires in 10 minutes.</p>
          {devCode && <p className="hint mono" style={{ textAlign: "center", color: "#3C5347" }}>Dev code: {devCode}</p>}
          <div className="otp" style={{ justifyContent: "center" }}>
            {otp.map((v, i) => (
              <input key={i} maxLength={1} value={v} inputMode="numeric"
                onChange={e => { const n = [...otp]; n[i] = e.target.value.replace(/\D/, ""); setOtp(n);
                  if (e.target.value && e.target.nextSibling) (e.target.nextSibling as HTMLElement).focus(); }} />
            ))}
          </div>
          <button className="link" style={{ alignSelf: "center" }} onClick={async () => {
            const res = await requestOtp(d.phone);
            if (res.code_dev_only) { setDevCode(res.code_dev_only); say(`New code: ${res.code_dev_only}`); }
            else say("New code sent. You can request 3 codes per hour.");
          }}>Send the code again</button>
          <button className="btn-maize" disabled={!otpOk || busy} onClick={async () => {
            setBusy(true);
            setError("");
            try {
              const res = await verifyOtp(d.phone, otp.join(""));
              if (res.token && res.user) {
                // Existing user logging in during registration flow
                onDone();
              } else if (res.verified) {
                // Phone verified, now proceed to registration or GPS step
                if (role === "seller") {
                  setStep("gps");
                } else {
                  await handleRegister();
                }
              }
            } catch (err: any) {
              setError(err.data?.error || "Invalid code");
            } finally {
              setBusy(false);
            }
          }}>
            {busy ? <Loader2 size="1em" className="spin" /> : "Verify my number"}
          </button>
        </>
      )}

      {step === "gps" && (
        <>
          <p className="hint">Pin your farm. Buyers only ever see your district — never your exact coordinates.</p>
          <div className="map">{gps ? <span className="mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MapPin size="1em" /> {gps}</span> : "Map view · tap below to pin"}</div>
          <button className="btn-alt" style={{ borderColor: "#16261E", display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setGps("0.4044°N, 32.4594°E")}><MapPin size="1em" /> Use my current location</button>
          <Field label="Or describe where the farm is" hint="Use this if location services are off or the signal is weak.">
            <input value={manual} placeholder="Kasangati, Gayaza road, 2 km past the trading centre" onChange={e => setManual(e.target.value)} />
          </Field>
          <div className="sms">Next: an administrator checks your ID against your phone registration. You will get an SMS with the result within 24 hours. You can look around the platform while you wait.</div>
          <button className="btn-maize" disabled={(!gps && !manual) || busy} onClick={handleRegister}>
            {busy ? <Loader2 size="1em" className="spin" /> : "Finish registration"}
          </button>
        </>
      )}
    </Modal>
  );
}
