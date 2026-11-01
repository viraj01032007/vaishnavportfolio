import React, {useEffect, useState} from 'react';
import {DEFAULT, LABELS} from './content.js';
import {deep, getP, setP, sha256} from './lib.jsx';
import {db, assets, enquiries, adminAuth, usingFirebase} from './store.js';

const isMedia = k => ["img", "portrait", "video"].includes(k);
const pth = s => s.split(".").map(x => /^\d+$/.test(x) ? +x : x);

export function Login({auth, onOk}) {
  const [stage, setStage] = useState(1); const [err, setErr] = useState("");
  const sub = async e => { e.preventDefault(); const v = String(new FormData(e.target).get("v")).trim(); const h = await sha256(v); setErr("");
    if (stage === 1) { (await adminAuth.signIn(v, () => h === auth.passwordHash)) ? setStage(2) : setErr("Wrong password.") } else { h === auth.pinHash ? onOk() : setErr("Wrong PIN.") } };
  return <div className="wrap admin"><span className="mono">Vaishnav Dhole</span><h1 className="ah">Admin sign-in</h1>
    <form className="login" onSubmit={sub} key={stage}><span className="mono" style={{color: "var(--accent)"}}>Step {stage} of 2</span>
      <label htmlFor="v">{stage === 1 ? "Password" : "Security PIN"}</label>
      <input id="v" name="v" type="password" inputMode={stage === 1 ? "text" : "numeric"} autoComplete={stage === 1 ? "current-password" : "one-time-code"} required autoFocus/>
      <button className="btn acc">{stage === 1 ? "Continue" : "Open admin"}</button>{err && <p className="err" role="alert">{err}</p>}
      <a className="btn ghost" href="#/">Back to site</a></form></div>;
}

function Fields({obj, path, draft, onChange, onUpload, onClear, onDel, onAdd}) {
  return Object.keys(obj).map(k => { const v = obj[k], p = [...path, k], id = "f_" + p.join("_"), label = path.length ? k : (LABELS[k] || k), ps = p.join(".");
    if (isMedia(k)) { const vid = k === "video";
      return <div className="fld" key={id}><label>{label}</label><div className="pv">{v ? (vid ? <video src={v} muted/> : <img src={v} alt=""/>) : <span className="mono">none</span>}
        <input type="file" accept={vid ? "video/mp4,video/webm" : "image/*"} aria-label={"Upload " + label} onChange={e => e.target.files[0] && onUpload(p, e.target.files[0])}/>
        {v && <button type="button" className="mini" onClick={() => onClear(p)}>Remove</button>}</div></div>; }
    if (Array.isArray(v) && v.every(x => typeof x === "string"))
      return <div className="fld" key={id}><label htmlFor={id}>{label} (one per line)</label><textarea id={id} rows={Math.min(10, v.length + 1)} defaultValue={v.join("\n")} onChange={e => onChange(p, e.target.value.split("\n"))}/></div>;
    if (Array.isArray(v))
      return <div className="fgrp" key={id}><span className="mono">{label}</span>
        {v.map((x, i) => <div className="fgrp" key={i}><span className="mono">{x.name || x.title || x.label || "#" + (i + 1)}</span>
          <Fields obj={x} path={[...p, i]} {...{draft, onChange, onUpload, onClear, onDel, onAdd}}/><div className="rowbtns"><button type="button" className="mini" onClick={() => onDel(p, i)}>Remove</button></div></div>)}
        <div className="rowbtns"><button type="button" className="mini" onClick={() => onAdd(p)}>+ Add</button></div></div>;
    if (v && typeof v === "object") return <div className="fgrp" key={id}><span className="mono">{label}</span><Fields obj={v} path={p} {...{draft, onChange, onUpload, onClear, onDel, onAdd}}/></div>;
    if (typeof v === "number") return <div className="fld" key={id}><label htmlFor={id}>{k}</label><input id={id} type="number" step="any" defaultValue={v} onChange={e => onChange(p, Number(e.target.value))}/></div>;
    return <div className="fld" key={id}><label htmlFor={id}>{k}</label>{String(v).length > 70 ? <textarea id={id} rows={3} defaultValue={v} onChange={e => onChange(p, e.target.value)}/> : <input id={id} defaultValue={v} onChange={e => onChange(p, e.target.value)}/>}</div>;
  });
}

export function Admin({content, onSaved}) {
  const [draft, setDraft] = useState(() => deep(content)); const [dirty, setDirty] = useState(false); const [msg, setMsg] = useState(""); const [ver, setVer] = useState(0);
  const [pw, setPw] = useState(""); const [pin, setPin] = useState(""); const [enq, setEnq] = useState([]);
  useEffect(() => { enquiries.list().then(setEnq).catch(e => { console.error(e); setMsg("Could not load enquiries.") }) }, []);
  const mut = fn => { setDraft(d => { const n = deep(d); fn(n); return n }); setDirty(true) };
  const onChange = (p, v) => mut(d => setP(d, p, v));
  const onClear = p => { mut(d => setP(d, p, "")); setVer(v => v + 1) };
  const onDel = (p, i) => { mut(d => getP(d, p).splice(i, 1)); setVer(v => v + 1) };
  const onAdd = p => { mut(d => { const arr = getP(d, p); const tpl = arr[arr.length - 1] || getP(DEFAULT, p)[0] || {}; arr.push(Object.fromEntries(Object.entries(tpl).map(([k, v]) => [k, typeof v === "number" ? 0 : Array.isArray(v) ? [] : ""]))) }); setVer(v => v + 1) };
  const onUpload = async (p, file) => { if (file.size > assets.maxBytes) { setMsg(`File too large (max ${assets.maxBytes / 1048576} MB). Use a smaller file.`); return }
    setMsg("Uploading…"); try { const r = await assets.upload(file); mut(d => setP(d, p, r.url)); setVer(v => v + 1); setMsg("Uploaded. Press Save to publish it.") } catch { setMsg("Upload failed.") } };
  const save = async () => { const d = deep(draft); if (pw) d.auth.passwordHash = await sha256(pw); if (pin) d.auth.pinHash = await sha256(pin);
    try { if (pw) await adminAuth.changePassword(pw); await db.set("content/site", d); setDraft(d); setDirty(false); setPw(""); setPin(""); setMsg("Saved. The site now shows these changes."); onSaved(d) }
    catch (e) { console.error(e); setMsg(usingFirebase ? (e?.code === "auth/requires-recent-login" ? "Sign in again to change the password." : "Save failed: " + (e?.code || e?.message || "unknown error")) : "Save failed — browser storage may be full. Remove a large upload and try again.") } };
  const {auth, ...editable} = draft;
  return <div className="wrap admin"><span className="mono">Vaishnav Dhole</span><h1 className="ah">Admin panel</h1>
    <div className="acols">
      <div className="abox"><h2>Enquiries{enq.length > 0 && <span className="pill">{enq.length}</span>}</h2>
        {enq.length === 0 ? <p className="mono">No enquiries yet.</p> : enq.map((e, k) => <div className="enq" key={k}><b>{e.name}</b><small>{new Date(e.at).toLocaleString("en-IN")} · {e.reach}</small><p>{e.message || "(no message)"}</p></div>)}</div>
      <div><div className="abox"><h2>Words, numbers, photos & videos</h2>
        <form key={ver} onSubmit={e => e.preventDefault()}><Fields obj={editable} path={[]} {...{draft, onChange, onUpload, onClear, onDel, onAdd}}/>
          <div className="fgrp"><span className="mono">Admin login</span>
            <div className="fld"><label htmlFor="npw">New password (blank = keep)</label><input id="npw" type="password" value={pw} onChange={e => { setPw(e.target.value); setDirty(true) }}/></div>
            <div className="fld"><label htmlFor="npin">New security PIN (blank = keep)</label><input id="npin" type="password" inputMode="numeric" value={pin} onChange={e => { setPin(e.target.value); setDirty(true) }}/></div></div></form></div>
        <div className="save"><button className="btn acc" onClick={save} disabled={!dirty}>Save changes</button><button className="btn ghost" onClick={() => { setDraft(deep(content)); setDirty(false); setMsg(""); setVer(v => v + 1) }}>Discard</button><a className="btn ghost" href="#/">View site</a><span style={{fontSize: ".9rem"}} role="status">{msg}</span></div></div></div></div>;
}
