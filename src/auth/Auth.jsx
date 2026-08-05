import React, { useState } from "react";
import { Sprout, ShoppingBasket, Shield, Smartphone, MapPin } from "lucide-react";
import { SELLER_TYPES, BUYER_TYPES } from "../data/userTypes";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";
import { Pick } from "../components/Pick";

export default function Auth({ init, onClose, onDone, say }) {
  const [mode, setMode] = useState(init.mode);
  const [role, setRole] = useState(init.role || null);
  const [step, setStep] = useState(init.role ? "type" : "role");
  const [type, setType] = useState(null);
  const [d, setD] = useState({ name: "", nin: "", phone: "", district: "Wakiso", email: "" });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [gps, setGps] = useState(null);
  const [manual, setManual] = useState("");

  const otpOk = otp.join("").length === 6;
  const DISTRICTS = ["Wakiso", "Kampala", "Mukono", "Mpigi", "Luweero", "Nakaseke", "Buikwe", "Mityana"];

  /* ---- log in ---- */
  if (mode === "login") {
    return (
      <Modal title="Log in" onClose={onClose}>
        <p className="hint">Your phone number is your account. We send a one-time code to it — there is no password to forget.</p>
        <Field label="Phone number"><input placeholder="0772 000 000" value={d.phone} onChange={e => setD({ ...d, phone: e.target.value })} /></Field>
        {step === "otp" ? (
          <>
            <Field label="Enter the 6-digit code" hint="Demo: type any six digits. Real codes expire after 10 minutes.">
              <div className="otp">
                {otp.map((v, i) => (
                  <input key={i} maxLength="1" value={v} inputMode="numeric"
                    onChange={e => { const n = [...otp]; n[i] = e.target.value.replace(/\D/, ""); setOtp(n);
                      if (e.target.value && e.target.nextSibling) e.target.nextSibling.focus(); }} />
                ))}
              </div>
            </Field>
            <div className="row">
              {[["seller", "David Ssemakula", "smallholder"], ["buyer", "Nakato Catering", "restaurant"], ["admin", "A. Kirabo", null]].map(([r, n, ty]) => (
                <button key={r} className="btn-sm" disabled={!otpOk} onClick={() => onDone({ role: r, name: n, type: ty, id: r === "seller" ? "S-01" : "B-01" })}>
                  Continue as {r}
                </button>
              ))}
            </div>
            <p className="hint">In production the code identifies one account. Here you choose which dashboard to open.</p>
          </>
        ) : (
          <button className="btn-maize" disabled={!d.phone} onClick={() => setStep("otp")}>Send me a code</button>
        )}
        <div className="rule" />
        <div className="row"><span className="hint">No account yet?</span>
          <button className="link" onClick={() => { setMode("join"); setStep("role"); }}>Register instead</button></div>
      </Modal>
    );
  }

  /* ---- register ---- */
  const TYPES = role === "seller" ? SELLER_TYPES : BUYER_TYPES;
  const stepNo = { role: 1, type: 2, details: 3, otp: 4, gps: 5 }[step];
  const total = role === "seller" ? 5 : 4;

  const finish = () => {
    onDone({ role, type, name: d.name || (role === "seller" ? "New farmer" : "New buyer"), id: role === "seller" ? "S-01" : "B-01" });
    say(role === "seller"
      ? "Account created. Your verification is with an administrator — you will get an SMS within 24 hours."
      : "Account created. You can start ordering now.");
  };

  return (
    <Modal title={role ? `Register as a ${role}` : "Join TundaGula"} onClose={onClose}>
      {role && <div className="hint mono">Step {stepNo - 1} of {total - 1}</div>}

      {step === "role" && (
        <>
          <p className="hint">What brings you here?</p>
          <div className="stack">
            <Pick ic={<Sprout size="1em" />} t="I am selling produce" d="Farmers, cooperatives, aggregators." onClick={() => { setRole("seller"); setStep("type"); }} />
            <Pick ic={<ShoppingBasket size="1em" />} t="I am buying produce" d="Households, restaurants, retailers, institutions." onClick={() => { setRole("buyer"); setStep("type"); }} />
            <Pick ic={<Shield size="1em" />} t="I am TundaGula staff" d="Administrator access." onClick={() => { setRole("admin"); setStep("details"); }} />
          </div>
          <div className="row"><span className="hint">Already registered?</span><button className="link" onClick={() => setMode("login")}>Log in</button></div>
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
          <Field label="Access code" hint="Issued by the platform owner. Admin accounts are never self-registered."><input type="password" placeholder="••••••" /></Field>
          <button className="btn-maize" disabled={!d.email} onClick={() => onDone({ role: "admin", name: d.email.split("@")[0], type: null })}>Enter admin dashboard</button>
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
          <button className="btn-maize" disabled={!d.name || !d.phone || (role === "seller" && !d.nin)} onClick={() => setStep("otp")}>Send verification code</button>
        </>
      )}

      {step === "otp" && (
        <>
          <div style={{ textAlign: "center", fontSize: 30 }}><Smartphone size="1em" /></div>
          <p className="hint" style={{ textAlign: "center" }}>We sent a 6-digit code to {d.phone || "your phone"}. It expires in 10 minutes.</p>
          <div className="otp" style={{ justifyContent: "center" }}>
            {otp.map((v, i) => (
              <input key={i} maxLength="1" value={v} inputMode="numeric"
                onChange={e => { const n = [...otp]; n[i] = e.target.value.replace(/\D/, ""); setOtp(n);
                  if (e.target.value && e.target.nextSibling) e.target.nextSibling.focus(); }} />
            ))}
          </div>
          <button className="link" style={{ alignSelf: "center" }} onClick={() => say("New code sent. You can request 3 codes per hour.")}>Send the code again</button>
          <button className="btn-maize" disabled={!otpOk} onClick={() => role === "seller" ? setStep("gps") : finish()}>Verify my number</button>
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
          <button className="btn-maize" disabled={!gps && !manual} onClick={finish}>Finish registration</button>
        </>
      )}
    </Modal>
  );
}
