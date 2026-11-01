import React, {useState} from 'react';
import {Reveal} from '../lib.jsx';
import {enquiries} from '../store.js';
function Copy({id, text}) { const [ok, setOk] = useState(false);
  const go = () => navigator.clipboard.writeText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 1500) }).catch(() => { const r = document.createRange(); r.selectNodeContents(document.getElementById(id)); getSelection().removeAllRanges(); getSelection().addRange(r) });
  return <button className="mini" onClick={go}>{ok ? "Copied" : "Copy"}</button>; }
export default function Contact({c}) {
  const [state, setState] = useState({});
  const submit = async e => { e.preventDefault(); const f = new FormData(e.target);
    const item = {name: f.get("name"), reach: f.get("reach"), message: f.get("msg"), at: new Date().toISOString()};
    setState({busy: true}); try { await enquiries.add(item); setState({sent: item.name}) }
    catch (err) { console.error(err); setState({fail: "Could not send from here. Please email or call the number alongside."}) } };
  return <section className="dark contact" id="contact"><div className="wrap">
    <span className="mono">06 — Get in touch</span>
    <Reveal as="h2" style={{marginTop: 14}}>{c.contact.heading}<span className="dot">.</span></Reveal>
    <div className="cg"><div className="cl">
      <div><span className="mono">Phone</span><div className="v"><code id="ph">{c.contact.phone}</code><Copy id="ph" text={c.contact.phone}/></div></div>
      <div><span className="mono">Email</span><div className="v"><code id="em">{c.contact.email}</code><Copy id="em" text={c.contact.email}/></div></div>
      <div><span className="mono">LinkedIn</span><div className="v"><a className="mini" href={c.contact.linkedin} target="_blank" rel="noopener">LinkedIn ↗</a></div></div>
      <p className="mono">{c.contact.based}</p></div>
      <div>{state.sent ? <div className="ok" role="status">Thanks, {state.sent}. Your enquiry has reached {c.hero.name1}.</div> :
        <form onSubmit={submit}><span className="mono" style={{color: "var(--accent)"}}>Enquiry</span>
          <label htmlFor="n">Your name</label><input id="n" name="name" required autoComplete="name"/>
          <label htmlFor="e">Email or phone</label><input id="e" name="reach" required autoComplete="email"/>
          <label htmlFor="m">What do you need?</label><textarea id="m" name="msg" rows={4} placeholder="Podcast, shoot, channel, dates…"/>
          <button className="btn acc" type="submit" disabled={state.busy}>{state.busy ? "Sending…" : "Send enquiry"}</button>{state.fail && <p className="err" role="alert">{state.fail}</p>}</form>}</div></div>
  </div></section>;
}
