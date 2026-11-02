// GET  /api/content  → the saved site content (or null if nothing saved yet). Public.
// PUT  /api/content  → save site content. Admin only. Keeps the last 20 versions.
import {json, fail, route, newest, writeJSON, prune, body, requireAdmin} from "./_lib.js";

export const GET = route(async () => json({content: await newest("content/")}));

export const PUT = route(async request => {
  if (!(await requireAdmin(request))) return fail("Please sign in again.", 401);
  const {content} = await body(request);
  if (!content || typeof content !== "object" || Array.isArray(content)) return fail("Missing content");
  delete content.auth; // credentials never live in the public content file
  await writeJSON("content/", content);
  await prune("content/", 20);
  return json({ok: true});
});
