// Storage layer.
// • Deployed on Vercel: talks to the /api routes (Vercel Blob storage). Changes are permanent and every visitor sees them.
// • Plain `npm run dev` (no /api available): falls back to this browser's localStorage, handy for local design work.
//   Use `vercel dev` to run the real backend locally.
import {uploadPresigned} from "@vercel/blob/client";

// ---------- mode detection ----------
let probe;
const detect = () => probe ||= fetch("/api/content", {cache: "no-store"})
  .then(async r => (r.headers.get("content-type") || "").includes("application/json")
    ? {mode: "api", first: await r.json()} : {mode: "local"})
  .catch(() => ({mode: "local"}));

// ---------- localStorage fallback ----------
const KEY = "vd:";
const listeners = new Set();
const lread = p => { try { const v = localStorage.getItem(KEY + p); return v ? JSON.parse(v) : null } catch { return null } };
const lwrite = (p, v) => { localStorage.setItem(KEY + p, JSON.stringify(v)); listeners.forEach(f => f(p, v)) };

// ---------- session token ----------
const TOKEN = "vd:token";
const token = () => { try { return sessionStorage.getItem(TOKEN) || "" } catch { return "" } };
const setToken = t => { try { t ? sessionStorage.setItem(TOKEN, t) : sessionStorage.removeItem(TOKEN) } catch {} };

async function api(path, {method = "GET", body, auth} = {}) {
  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (auth) headers.authorization = "Bearer " + token();
  const r = await fetch(path, {method, headers, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store"});
  const data = await r.json().catch(() => ({}));
  if (r.status === 401 && auth) setToken("");
  if (!r.ok) throw Object.assign(new Error(data.error || `Request failed (${r.status})`), {status: r.status});
  return data;
}

// ---------- public API ----------
export const db = {
  // Calls fn with the saved content (or null), and again whenever it's saved from this tab.
  subscribe: (p, fn) => {
    let alive = true;
    const f = (q, v) => q === p && fn(v); listeners.add(f);
    detect().then(async ({mode, first}) => {
      if (!alive) return;
      if (mode === "local") return fn(lread(p));
      fn(first?.content ?? null);
      // pick up edits made on another device when the visitor comes back to the tab
      const refresh = () => document.visibilityState === "visible" && api("/api/content").then(d => alive && fn(d.content ?? null)).catch(() => {});
      document.addEventListener("visibilitychange", refresh);
      const stop = () => document.removeEventListener("visibilitychange", refresh);
      if (!alive) stop(); else cleanup = stop;
    });
    let cleanup = () => {};
    return () => { alive = false; listeners.delete(f); cleanup() };
  },
  set: async (p, v) => {
    const {mode} = await detect();
    if (mode === "local") return lwrite(p, v);
    const {auth, ...content} = v;
    await api("/api/content", {method: "PUT", body: {content}, auth: true});
    listeners.forEach(f => f(p, content));
  }
};

export const enquiries = {
  add: async item => {
    const {mode} = await detect();
    if (mode === "api") return api("/api/enquiries", {method: "POST", body: item});
    const all = lread("enquiries") || []; lwrite("enquiries", [...all, {...item, at: new Date().toISOString()}].slice(-200));
  },
  list: async () => {
    const {mode} = await detect();
    if (mode === "api") return (await api("/api/enquiries", {auth: true})).items;
    return (lread("enquiries") || []).map(e => ({...e, id: e.at})).sort((a, b) => b.at.localeCompare(a.at));
  },
  remove: async id => {
    const {mode} = await detect();
    if (mode === "api") return api("/api/enquiries?id=" + encodeURIComponent(id), {method: "DELETE", auth: true});
    lwrite("enquiries", (lread("enquiries") || []).filter(e => e.at !== id));
  }
};

export const assets = {
  upload: async file => {
    const {mode} = await detect();
    if (mode === "api") {
      const name = file.name.replace(/[^\w.-]/g, "_").slice(-80) || "file";
      const b = await uploadPresigned(`uploads/${name}`, file, {access: "public", handleUploadUrl: "/api/upload", clientPayload: token()});
      return {id: b.pathname, url: b.url};
    }
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res({id: r.result, url: r.result}); r.onerror = rej; r.readAsDataURL(file) });
  },
  maxBytes: async () => (await detect()).mode === "api" ? 50 * 1024 * 1024 : 4 * 1024 * 1024
};

// Admin auth. API mode: checked on the server, which hands back a 12-hour session token.
// Local mode: compares against the SHA-256 hashes in content.js.
export const adminAuth = {
  signedIn: () => Boolean(token()),
  checkPassword: async (password, localCheck) => {
    if ((await detect()).mode === "local") return localCheck();
    try { await api("/api/login", {method: "POST", body: {password}}); return true }
    catch (e) { if (e.status === 401) return false; throw e }
  },
  checkPin: async (password, pin, localCheck) => {
    if ((await detect()).mode === "local") return localCheck();
    try { setToken((await api("/api/login", {method: "POST", body: {password, pin}})).token); return true }
    catch (e) { if (e.status === 401) return false; throw e }
  },
  // Returns true if handled on the server (API mode); false means the caller stores local hashes.
  change: async ({password, pin}) => {
    if ((await detect()).mode === "local") return false;
    const body = {}; if (password) body.password = password; if (pin) body.pin = pin;
    setToken((await api("/api/credentials", {method: "POST", body, auth: true})).token);
    return true;
  },
  signOut: () => setToken("")
};
