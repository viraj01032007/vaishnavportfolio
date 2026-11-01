import React from 'react';
import {Reveal, SHead} from '../lib.jsx';
export default function About({c}) {
  return <>
    <section id="about"><div className="wrap"><SHead n="01" title="About" right="Producer / EA"/>
      <div className="about"><Reveal><h3>{c.about.heading}</h3><p>{c.about.p1}</p><p>{c.about.p2}</p><p>{c.about.p3}</p></Reveal>
        <Reveal delay={.15}><div className="fc"><div className="im"><img src={c.about.img} alt="" loading="lazy"/></div><p className="mono" style={{marginTop: 10}}>{c.about.caption}</p></div></Reveal></div></div></section>
    <section id="field" className="dark"><div className="wrap"><SHead n="02" title="Field & documentary" right="On location" dark/>
      <div className="field">{c.field.map((f, i) => <Reveal className="fc" delay={i * .12} key={i}><div className="im"><img src={f.img} alt={f.title} loading="lazy"/></div><h3>{f.title}</h3><div className="mono" style={{color: "var(--accent)"}}>{f.role}</div><p>{f.text}</p></Reveal>)}</div></div></section>
  </>;
}
