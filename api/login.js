// POST /api/login  {password}        → {ok:true} if the password is right (step 1)
//                  {password, pin}   → {token}   if both are right (step 2)
import {json, fail, route, body, getAuth, check, issueToken} from "./_lib.js";

const slow = () => new Promise(r => setTimeout(r, 700)); // blunts guessing

export const POST = route(async request => {
  const {password, pin} = await body(request, 10_000);
  const auth = await getAuth();
  if (!check("password", password, auth)) { await slow(); return fail("Wrong password.", 401) }
  if (pin === undefined) return json({ok: true});
  if (!check("pin", pin, auth)) { await slow(); return fail("Wrong PIN.", 401) }
  return json({token: issueToken(auth)});
});
