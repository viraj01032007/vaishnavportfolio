import React from 'react';
import {Reveal, SHead, Strip} from '../lib.jsx';
export default function Pipeline({c}) {
  return <><Strip text={c.strips[2] || c.strips[0] || ""} ink/>
    <section id="pipeline"><div className="wrap"><SHead n="05" title="What I handle" right="Full pipeline"/>
      <div className="pipe">{c.pipeline.map((p, i) => <Reveal className="ph" delay={i * .12} key={i}><span className="mono">{p.phase}</span><h3>{p.title}</h3><ul>{p.items.map((x, k) => <li key={k}>{x}</li>)}</ul></Reveal>)}</div></div></section></>;
}
