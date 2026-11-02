// POST   /api/enquiries          {name, reach, message} → store an enquiry. Public.
// GET    /api/enquiries          → newest 200 enquiries. Admin only.
// DELETE /api/enquiries?id=...   → delete one enquiry. Admin only.
import {del} from "@vercel/blob";
import {json, fail, route, body, listAll, readJSON, writeJSON, requireAdmin} from "./_lib.js";

const str = (v, max) => typeof v === "string" ? v.trim().slice(0, max) : "";

export const POST = route(async request => {
  const b = await body(request, 20_000);
  if (b.website) return json({ok: true}); // honeypot field: bots fill it, people never see it
  const item = {name: str(b.name, 200), reach: str(b.reach, 300), message: str(b.message, 5000), at: new Date().toISOString()};
  if (!item.name || !item.reach) return fail("Name and email/phone are required.");
  await writeJSON("enquiries/", item);
  return json({ok: true});
});

export const GET = route(async request => {
  if (!(await requireAdmin(request))) return fail("Please sign in again.", 401);
  const blobs = (await listAll("enquiries/")).slice(0, 200);
  const items = await Promise.all(blobs.map(async b => {
    try { return {...(await readJSON(b)), id: b.pathname} } catch { return null }
  }));
  return json({items: items.filter(Boolean)});
});

export const DELETE = route(async request => {
  if (!(await requireAdmin(request))) return fail("Please sign in again.", 401);
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id.startsWith("enquiries/")) return fail("Bad id");
  const hit = (await listAll("enquiries/")).find(b => b.pathname === id);
  if (hit) await del(hit.url);
  return json({ok: true});
});
