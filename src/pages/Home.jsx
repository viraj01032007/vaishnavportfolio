import React, {useEffect, useRef} from 'react';
import {Marquee, Strip, Tiles, Stats, SHead, nav, hover} from '../lib.jsx';

function Featured({c}) {
  const ref = useRef(null);
  useEffect(() => { const el = ref.current; if (!el) return;
    const takeover = () => { if (el.classList.contains("manual")) return; const tr = el.querySelector(".track"); const x = -new DOMMatrixReadOnly(getComputedStyle(tr).transform).m41; el.classList.add("manual"); el.scrollLeft = x };
    const wheel = e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) takeover() };
    el.addEventListener("touchstart", takeover, {passive: true}); el.addEventListener("wheel", wheel, {passive: true});
    return () => { el.removeEventListener("touchstart", takeover); el.removeEventListener("wheel", wheel) } }, []);
  return <div ref={ref}><Marquee className="feat" dur="46s" items={c.featured.items.map((f, i) => {
    const inner = <><img src={f.img} alt="" loading="lazy"/><span className="k">{f.k}</span><span className="t">{f.title}</span></>;
    return f.link ? <a className="card" key={i} href={f.link} target="_blank" rel="noopener">{inner}</a> : <div className="card" key={i}>{inner}</div>;
  })}/></div>;
}

export default function Home({c}) {
  const st = c.strips, ts = c.testimonials.items;
  return <>
    <section className="hero" id="top"><div className="wrap">
      <div className="top"><span className="mono">{c.hero.tag1}</span><span className="mono">{c.hero.tag2}</span><span className="mono" style={{color: "var(--accent)"}}>{c.hero.tag3}</span></div>
      <div className="grid"><div>
        <h1><span className="line"><span>{c.hero.name1}</span></span><span className="line"><span>{c.hero.name2}<span className="dot">.</span></span></span></h1>
        <p className="lede">{c.hero.lede}</p>
        <div className="cta"><button className="btn acc" onClick={() => nav("contact")}>{c.hero.cta1}</button><button className="btn ghost" onClick={() => nav("journey")}>{c.hero.cta2}</button></div></div>
        <div><div className="portrait"><img src={c.hero.portrait} alt={c.hero.name1 + " " + c.hero.name2} fetchPriority="high"/><div className="cap">{c.hero.portraitCaption}</div></div></div></div>
      <Stats items={c.stats}/>
    </div></section>
    <Strip text={st[0] || ""} ink/>
    <Marquee className="exp" dur="38s" extra={{"aria-label": "Expertise"}} items={c.expertise.map((t, i) => <span key={i}>{t}<i>✦</i></span>)}/>
    <section className="dark logos" style={{paddingBlock: 48}}>
      <div className="wrap"><SHead n="01" title={c.clients.heading} right="Live · hover to pause" dark/></div>
      <div className="row"><Marquee dur="40s" items={<Tiles list={c.clients.brands} sq/>}/></div>
      <div className="row"><Marquee dur="48s" rev items={<Tiles list={c.clients.people}/>}/></div>
    </section>
    <section className="dark" style={{paddingBlock: "0 48px"}}><div className="wrap"><SHead n="02" title={c.featured.heading} right="Auto-scrolls · swipe to browse" dark/></div><Featured c={c}/></section>
    {ts.length > 0 && <section className="testi" style={{paddingBlock: 48}}><div className="wrap"><SHead n="03" title={c.testimonials.heading}/></div>
      {[0, 1].map(r => { const items = ts.filter((_, i) => ts.length < 4 || i % 2 === r); return items.length ? <div className="row" key={r}><Marquee rev={!!r} dur={r ? "52s" : "40s"} items={items.map((t, i) => <div className="tc" key={i}><p>“{t.quote}”</p><small>{t.name} <span>· {t.role}</span></small></div>)}/></div> : null })}</section>}
    <Strip text={st[1] || ""}/>
  </>;
}
