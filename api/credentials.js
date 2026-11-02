// POST /api/credentials {password?, pin?} → change the admin password and/or PIN. Admin only.
// Returns a fresh token, since the change signs out every old session.
import {json, fail, route, body, requireAdmin, saveAuth, issueToken} from "./_lib.js";

export const POST = route(async request => {
  const session = await requireAdmin(request);
  if (!session) return fail("Please sign in again.", 401);
  const {password, pin} = await body(request, 10_000);
  if (password !== undefined && (typeof password !== "string" || password.length < 6)) return fail("Password must be at least 6 characters.");
  if (pin !== undefined && (typeof pin !== "string" || !/^\d{4,8}$/.test(pin))) return fail("PIN must be 4–8 digits.");
  if (!password && !pin) return fail("Nothing to change.");
  const auth = await saveAuth({password, pin}, session.auth);
  return json({token: issueToken(auth)});
});
