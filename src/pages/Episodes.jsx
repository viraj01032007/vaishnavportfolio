import React, {useRef, useState} from 'react';
import {Reveal, SHead, hover} from '../lib.jsx';
function Ep({e, i, playing, setPlaying}) {
  const v = useRef(null); const on = playing === i;
  const play = () => { setPlaying(i); const el = v.current; if (e.video && !el.getAttribute("src")) el.src = e.video; if (el.getAttribute("src")) el.play().catch(() => {}) };
  const stop = () => { setPlaying(p => p === i ? null : p); v.current.pause() };
  const h = hover();
  return <Reveal className={"ep" + (on ? " play" : "")} delay={i * .1} tabIndex={0} role="button" aria-pressed={on}
    onMouseEnter={h ? play : undefined} onMouseLeave={h ? stop : undefined} onClick={ev => { if (ev.target.tagName === "A") return; on ? stop() : play() }}
    onKeyDown={ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); on ? stop() : play() } }}>
    <img src={e.img} alt="" loading="lazy"/><video ref={v} muted loop playsInline preload="none"/><div className="ov"/><div className="pb">▶</div>
    <div className="t"><span className="k">{e.k}</span><b>{e.title}</b><small>{e.sub}</small>{e.link && <a href={e.link} target="_blank" rel="noopener">Watch ↗</a>}</div>
    <div className="bar"><i/></div></Reveal>;
}
export default function Episodes({c}) {
  const [playing, setPlaying] = useState(null);
  return <section id="episodes"><div className="wrap"><SHead n="04" title="Selected episodes" right="Hover or tap to preview"/>
    <div className="eps">{c.episodes.map((e, i) => <Ep key={i} e={e} i={i} playing={playing} setPlaying={setPlaying}/>)}</div></div></section>;
}
