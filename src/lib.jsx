import React, {useEffect, useRef, useState} from 'react';

export const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export const hover = () => matchMedia("(hover: hover) and (pointer: fine)").matches;
export const nav = p => { location.hash = "#/" + p };
export const deep = o => JSON.parse(JSON.stringify(o));
export function merge(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) return b.map((x, i) => a[i] !== undefined && x && typeof x === "object" ? merge(a[i], x) : x);
  if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a)) { const o = {...a}; for (const k in b) o[k] = k in a ? merge(a[k], b[k]) : b[k]; return o }
  return b === undefined ? a : b;
}
export const getP = (o, p) => p.reduce((c, k) => c[k], o);
export const setP = (o, p, v) => { let c = o; for (let i = 0; i < p.length - 1; i++) c = c[p[i]]; c[p[p.length - 1]] = v };
export async function sha256(s) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("") }
export const initials = n => n.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();

/* scroll reveal */
export function useReveal(opts) {
  const ref = useRef(null); const [on, setOn] = useState(false);
  useEffect(() => { const el = ref.current; if (!el) return; const ob = new IntersectionObserver(es => { if (es[0].isIntersecting) { setOn(true); ob.disconnect() } }, opts || {threshold: .15}); ob.observe(el); return () => ob.disconnect() }, []);
  return [ref, on];
}
export function Reveal({as: Tag = "div", className = "", delay = 0, children, ...rest}) {
  const [ref, on] = useReveal();
  return <Tag ref={ref} className={"rv" + (on ? " in" : "") + (className ? " " + className : "")} style={{transitionDelay: delay + "s"}} {...rest}>{children}</Tag>;
}
export const SHead = ({n, title, right, dark}) => <div className="shead" style={dark ? {borderColor: "var(--dark-line)"} : undefined}><h2><span className="n">{n}</span>{title}</h2>{right && <span className="mono">{right}</span>}</div>;

/* marquee: duplicated set for a seamless loop, CSS transform animation */
export function Marquee({items, className = "", dur, rev, pause = true, id, extra}) {
  const set = <div className="set">{items}</div>;
  return <div id={id} className={"mq " + className + (rev ? " rev" : "") + (pause ? " pause" : "")} style={dur ? {"--dur": dur} : undefined} {...extra}>
    <div className="track">{set}<div className="set" aria-hidden="true">{items}</div></div></div>;
}
export const Strip = ({text, ink}) => <Marquee className={"strip" + (ink ? " ink" : "")} pause={false} extra={{"aria-hidden": true}}
  items={text.split("•").map((t, i) => <span key={i}>{t.trim()}<i>•</i></span>)}/>;
export const Tiles = ({list, sq}) => list.map((x, i) => <div className="tile" key={i}><div className={"av" + (sq ? " sq" : "")}>{x.img ? <img src={x.img} alt="" loading="lazy"/> : initials(x.name)}</div><div><b>{x.name}</b>{x.sub && <small>{x.sub}</small>}</div></div>);

/* count-up */
export function Stat({value, suffix, label, start, delay}) {
  const [n, setN] = useState(0); const [suf, setSuf] = useState(false); const dec = String(value).includes(".") ? 1 : 0;
  useEffect(() => { if (!start) return; if (reduced()) { setN(value); setSuf(true); return } let raf; const t0 = performance.now() + delay, dur = 1600;
    const tick = t => { const p = Math.min(1, Math.max(0, (t - t0) / dur)); setN(value * (1 - Math.pow(1 - p, 4))); if (p < 1) raf = requestAnimationFrame(tick); else setSuf(true) };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf) }, [start, value, delay]);
  return <div className="stat"><b>{n.toFixed(dec)}<span className={"suf" + (suf ? " show" : "")}>{suffix}</span></b><span>{label}</span></div>;
}
export function Stats({items}) {
  const [ref, start] = useReveal({threshold: .5});
  return <div ref={ref} className={"stats" + (start ? " in" : "")}>{items.map((s, k) => <Stat key={k} value={Number(s.value) || 0} suffix={s.suffix || ""} label={s.label} start={start} delay={k * 140}/>)}</div>;
}
