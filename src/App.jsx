import React, {useEffect, useState} from 'react';
import {DEFAULT} from './content.js';
import {merge, nav, reduced} from './lib.jsx';
import {db, adminAuth} from './store.js';
import Home from './pages/Home.jsx'; import About from './pages/About.jsx'; import Journey from './pages/Journey.jsx';
import Episodes from './pages/Episodes.jsx'; import Pipeline from './pages/Pipeline.jsx'; import Contact from './pages/Contact.jsx';
import {Login, Admin} from './Admin.jsx';

const ROUTES = [["", "Home", Home], ["about", "About", About], ["journey", "Journey", Journey], ["episodes", "Episodes", Episodes], ["pipeline", "Pipeline", Pipeline], ["contact", "Contact", Contact]];
const route = () => location.hash.replace(/^#\/?/, "").replace(/\/+$/, "");

export default function App() {
  const [content, setContent] = useState(DEFAULT); const [view, setView] = useState(route()); const [authed, setAuthed] = useState(adminAuth.signedIn);
  const [open, setOpen] = useState(false); const [top, setTop] = useState(false); const [prog, setProg] = useState(0);
  useEffect(() => db.subscribe("content/site", d => setContent(d ? merge(DEFAULT, d) : DEFAULT)), []);
  useEffect(() => { const f = () => setView(route()); addEventListener("hashchange", f); return () => removeEventListener("hashchange", f) }, []);
  useEffect(() => { scrollTo(0, 0); setOpen(false) }, [view]);
  useEffect(() => { const f = () => { const d = document.documentElement; setProg(d.scrollHeight > innerHeight ? scrollY / (d.scrollHeight - innerHeight) : 0); setTop(scrollY > 600) }; f(); addEventListener("scroll", f, {passive: true}); return () => removeEventListener("scroll", f) }, [view]);
  useEffect(() => { document.body.classList.toggle("noscroll", open); const k = e => e.key === "Escape" && setOpen(false); addEventListener("keydown", k); return () => { document.body.classList.remove("noscroll"); removeEventListener("keydown", k) } }, [open]);

  if (view === "admin") return <main className="page" key="admin">{authed ? <Admin content={content} onSaved={setContent} onSignOut={() => setAuthed(false)}/> : <Login auth={content.auth} onOk={() => setAuthed(true)}/>}</main>;
  const hit = ROUTES.find(r => r[0] === view) || ROUTES[0]; const Page = hit[2]; const c = content;
  const links = ROUTES.map(([r, t]) => <button key={r} className={view === r ? "on" : ""} aria-current={view === r ? "page" : undefined} onClick={() => nav(r)}>{t}</button>);
  return <>
    <div className="progress" style={{transform: `scaleX(${prog})`}} aria-hidden="true"/>
    <header><div className="wrap"><button className="logo" onClick={() => nav("")}>{c.hero.name1.toUpperCase()} {c.hero.name2.toUpperCase()}<span className="dot">.</span></button>
      <nav className="desk" aria-label="Main">{links}<button className="btn acc" onClick={() => nav("contact")}>Enquire</button></nav>
      <button className="burger" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="drawer" onClick={() => setOpen(o => !o)}><span className={open ? "x" : ""}/></button></div></header>
    <div className={"scrim" + (open ? " on" : "")} onClick={() => setOpen(false)} aria-hidden="true"/>
    <nav id="drawer" className={"drawer" + (open ? " on" : "")} aria-label="Main menu" aria-hidden={!open}>
      <div className="dhead"><span className="mono">Menu</span><button className="close" aria-label="Close menu" onClick={() => setOpen(false)}>✕</button></div>
      {links}<button className="btn acc" style={{marginTop: 16}} onClick={() => nav("contact")}>Enquire</button>
      <div className="dfoot"><code>{c.contact.phone}</code></div></nav>
    <main className="page" key={view}><Page c={c}/></main>
    <footer><div className="wrap"><span>{c.contact.footer}</span><span>{c.contact.year}</span><button onClick={() => nav("admin")}>Admin</button></div></footer>
    <button className={"totop" + (top ? " on" : "")} aria-label="Back to top" onClick={() => scrollTo({top: 0, behavior: reduced() ? "auto" : "smooth"})}>↑</button>
  </>;
}
