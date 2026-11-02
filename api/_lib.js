// Shared helpers for the API routes (files starting with "_" are not deployed as routes).
// Storage: Vercel Blob. Every save writes a NEW file (random suffix), so there is never a stale CDN copy,
// and the newest file under a prefix is the current value. Old versions are pruned.
import {put, list, del} from "@vercel/blob";
import crypto from "node:crypto";

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {status, headers: {"content-type": "application/json", "cache-control": "no-store"}});

export const fail = (msg, status = 400) => json({error: msg}, status);

export function storageReady() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

// All blobs under a prefix, newest first.
export async function listAll(prefix) {
  const blobs = []; let cursor;
  do {
    const r = await list({prefix, cursor, limit: 1000});
    blobs.push(...r.blobs); cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  return blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

export async function readJSON(blob) {
  const r = await fetch(blob.url, {cache: "no-store"});
  if (!r.ok) throw new Error(`Could not read ${blob.pathname} (${r.status})`);
  return r.json();
}

export async function newest(prefix) {
  const [b] = await listAll(prefix);
  return b ? readJSON(b) : null;
}

export function writeJSON(prefix, data) {
  return put(`${prefix}${Date.now()}.json`, JSON.stringify(data), {
    access: "public", addRandomSuffix: true, contentType: "application/json", cacheControlMaxAge: 31536000
  });
}

// Keep the newest `keep` blobs under a prefix, delete the rest.
export async function prune(prefix, keep) {
  const old = (await listAll(prefix)).slice(keep).map(b => b.url);
  if (old.length) await del(old);
}

export async function body(request, maxBytes = 2_000_000) {
  const text = await request.text();
  if (text.length > maxBytes) throw Object.assign(new Error("Request too large"), {status: 413});
  try { return JSON.parse(text || "{}") } catch { throw Object.assign(new Error("Invalid JSON"), {status: 400}) }
}

// ---------- admin auth ----------
// Credentials live in the newest "auth/" blob as salted scrypt hashes. Until the admin changes them,
// the defaults are ADMIN_PASSWORD / ADMIN_PIN env vars, or the original Vaishnav@2026 / 1234.
const DEFAULTS = () => ({password: process.env.ADMIN_PASSWORD || "Vaishnav@2026", pin: process.env.ADMIN_PIN || "1234"});
const scrypt = (value, salt) => crypto.scryptSync(String(value), salt, 32).toString("hex");
const same = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y) };

export const getAuth = () => newest("auth/");

export function check(kind, value, auth) {
  if (typeof value !== "string" || !value) return false;
  if (auth?.[kind]) return same(scrypt(value, auth[kind].salt), auth[kind].hash);
  return same(value, DEFAULTS()[kind]);
}

export async function saveAuth({password, pin}, current) {
  const make = v => { const salt = crypto.randomBytes(16).toString("hex"); return {salt, hash: scrypt(v, salt)} };
  const d = DEFAULTS();
  const next = {
    v: crypto.randomBytes(8).toString("hex"),
    password: password ? make(password) : current?.password || make(d.password),
    pin: pin ? make(pin) : current?.pin || make(d.pin)
  };
  await writeJSON("auth/", next);
  await prune("auth/", 1);
  return next;
}

// Session tokens: "<expiry>.<authVersion>.<hmac>". Changing the password/PIN invalidates old tokens.
const SECRET = () => process.env.SESSION_SECRET || process.env.BLOB_READ_WRITE_TOKEN || "";
const sign = payload => crypto.createHmac("sha256", SECRET()).update(payload).digest("base64url");
const TTL = 12 * 60 * 60 * 1000;

export function issueToken(auth) {
  const payload = `${Date.now() + TTL}.${auth?.v || "default"}`;
  return `${payload}.${sign(payload)}`;
}

export async function verifyToken(token) {
  if (!SECRET() || typeof token !== "string") return null;
  const i = token.lastIndexOf("."); if (i < 0) return null;
  const payload = token.slice(0, i), sig = token.slice(i + 1);
  if (!same(sig, sign(payload))) return null;
  const [exp, ver] = payload.split(".");
  if (!(Number(exp) > Date.now())) return null;
  const auth = await getAuth();
  return ver === (auth?.v || "default") ? {auth} : null;
}

export async function requireAdmin(request) {
  const h = request.headers.get("authorization") || "";
  return verifyToken(h.startsWith("Bearer ") ? h.slice(7) : "");
}

// Wrap a handler: storage check + error → JSON.
export const route = fn => async request => {
  if (!storageReady()) return fail("Storage is not connected. In Vercel: Storage → Create → Blob → connect it to this project, then redeploy.", 503);
  try { return await fn(request) }
  catch (e) { console.error(e); return fail(e.status ? e.message : "Server error", e.status || 500) }
};
