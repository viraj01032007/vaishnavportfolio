// Storage layer — localStorage version. Admin edits, uploads and enquiries live only in this browser.
// Swap these three exports for a backend (Firebase / Supabase / your API) to make them shared.
const KEY = "vd:";
const listeners = new Set();
const read = p => { try { const v = localStorage.getItem(KEY + p); return v ? JSON.parse(v) : null } catch { return null } };
const write = (p, v) => { localStorage.setItem(KEY + p, JSON.stringify(v)); listeners.forEach(f => f(p)) };

export const db = {
  get: p => read(p),
  set: (p, v) => write(p, v),
  subscribe: (p, fn) => { const f = q => q === p && fn(read(p)); listeners.add(f); fn(read(p)); return () => listeners.delete(f) },
  list: prefix => Object.keys(localStorage).filter(k => k.startsWith(KEY + prefix)).map(k => read(k.slice(KEY.length)))
};
export const user = { id: () => { let id = read("uid"); if (!id) { id = "u_" + Math.random().toString(36).slice(2, 12); write("uid", id) } return id }, isOwner: () => true };
// ponytail: uploads become data URLs in localStorage (≈5 MB total). Add when needed: a file host, store its URL instead.
export const assets = { upload: file => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res({ id: r.result, url: r.result }); r.onerror = rej; r.readAsDataURL(file) }) };
