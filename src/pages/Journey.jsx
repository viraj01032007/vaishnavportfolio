import React, {useEffect, useRef, useState} from 'react';
import {SHead} from '../lib.jsx';
export default function Journey({c}) {
  const tl = useRef(null); const [prog, setProg] = useState(0); const [cur, setCur] = useState(0); const [seen, setSeen] = useState(0);
  useEffect(() => { const f = () => { const el = tl.current; if (!el) return; const r = el.getBoundingClientRect(), vh = innerHeight;
      setProg(Math.min(1, Math.max(0, (vh * .55 - r.top) / r.height)));
      let idx = 0; [...el.querySelectorAll(".ms")].forEach((m, k) => { if (m.getBoundingClientRect().top < vh * .6) idx = k }); setCur(idx); setSeen(s => Math.max(s, idx)) };
    f(); addEventListener("scroll", f, {passive: true}); addEventListener("resize", f); return () => { removeEventListener("scroll", f); removeEventListener("resize", f) } }, [c.journey.length]);
  const j = c.journey;
  return <section className="dark" id="journey"><div className="wrap"><SHead n="03" title="Where I've rolled" right="Experience" dark/>
    <div className="journey"><div><div className="visual">{j.map((x, i) => <img key={i} src={x.img} alt="" className={i === cur ? "on" : ""}/>)}
      <div className="tag"><span>{j[cur]?.tag}</span><b>{j[cur]?.years}</b></div></div></div>
      <div className="tl" ref={tl}><div className="fill" style={{"--h": (prog * 100).toFixed(1) + "%"}}/>
        {j.map((x, i) => <div className={"ms" + (i <= seen ? " in" : "")} key={i}><span className="k">{x.k}</span><h3>{x.title}</h3><div className="role">{x.role}</div>
          <ul>{x.bullets.map((b, k) => <li key={k}>{b}</li>)}</ul><div className="m"><img src={x.img} alt="" loading="lazy"/></div></div>)}</div></div></div></section>;
}
