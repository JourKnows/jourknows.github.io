/**
 * JourKnows push worker: replaces the Firebase Cloud Function so Firebase can stay on the free Spark plan.
 * Runs on Cloudflare Workers (free plan). Sends through Firebase Cloud Messaging, which is free.
 *
 *   POST /register  { token }        subscribes this device to the "everyone" topic
 *   POST /notify    { room, id }     editors only: pushes the @everyone message with that id
 *
 * Both calls need the caller's Firebase ID token in "Authorization: Bearer ...".
 * Secret: SERVICE_ACCOUNT (the Firebase service-account JSON). Vars: see wrangler.toml.
 */
const TOPIC = "everyone";
const ROOMS = {
  breaking: "Breaking Updates", lobby: "Welcome Lobby", news: "News Desk", sports: "Sports Desk",
  scitech: "Sci-Tech Desk", opinion: "Opinion Desk", pitch: "Pitch Corner", literacy: "Media Literacy",
  design: "Layout and Design", campus: "Campus Press Hub",
};
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const enc = new TextEncoder();
let cached = { token: "", exp: 0 };

const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64uStr = s => b64u(enc.encode(s));

async function accessToken(env) {
  if (cached.token && Date.now() < cached.exp) return cached.token;
  const sa = JSON.parse(env.SERVICE_ACCOUNT);
  const now = Math.floor(Date.now() / 1000);
  const unsigned = b64uStr(JSON.stringify({ alg: "RS256", typ: "JWT" })) + "." + b64uStr(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
  }));
  const der = Uint8Array.from(atob(sa.private_key.replace(/-----[^-]+-----|\s/g, "")), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(unsigned));
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: unsigned + "." + b64u(sig) }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error("service account auth failed");
  cached = { token: j.access_token, exp: Date.now() + (j.expires_in - 120) * 1000 };
  return cached.token;
}

async function verifyUser(req, env) {
  const m = /^Bearer (.+)$/.exec(req.headers.get("Authorization") || "");
  if (!m) return null;
  const r = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + env.FIREBASE_API_KEY, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: m[1] }),
  });
  if (!r.ok) return null;
  const u = ((await r.json()).users || [])[0];
  return u && u.emailVerified ? { uid: u.localId } : null;
}

function cors(req, env) {
  const origin = req.headers.get("Origin") || "";
  const ok = String(env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).includes(origin);
  return {
    ok,
    headers: {
      "Access-Control-Allow-Origin": ok ? origin : "null",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin",
    },
  };
}

const json = (o, status, h) => new Response(JSON.stringify(o), { status, headers: { ...h, "Content-Type": "application/json" } });

async function register(body, user, env) {
  const token = String(body.token || "");
  if (token.length < 20 || token.length > 4096) return [400, { error: "bad token" }];
  const at = await accessToken(env);
  const r = await fetch("https://iid.googleapis.com/iid/v1:batchAdd", {
    method: "POST",
    headers: { Authorization: "Bearer " + at, access_token_auth: "true", "Content-Type": "application/json" },
    body: JSON.stringify({ to: "/topics/" + TOPIC, registration_tokens: [token] }),
  });
  return r.ok ? [200, { ok: true }] : [502, { error: "subscribe failed" }];
}

async function notify(body, user, env) {
  const room = String(body.room || ""), id = String(body.id || "");
  if (!ROOMS[room] || !ID_RE.test(id)) return [400, { error: "bad request" }];
  const at = await accessToken(env);
  const docUrl = `https://firestore.googleapis.com/v1/projects/${env.PROJECT_ID}/databases/(default)/documents/rooms/${room}/messages/${id}`;
  const r = await fetch(docUrl, { headers: { Authorization: "Bearer " + at } });
  if (!r.ok) return [404, { error: "message not found" }];
  const doc = await r.json(), f = doc.fields || {};
  const text = (f.t && f.t.stringValue) || "";
  // The security rules only let real editors write ed=true, so ed=true plus the caller's own uid proves an editor sent it.
  if (!f.uid || f.uid.stringValue !== user.uid) return [403, { error: "not your message" }];
  if (!f.ed || f.ed.booleanValue !== true) return [403, { error: "editors only" }];
  if (f.sys && f.sys.booleanValue === true) return [400, { error: "system message" }];
  if (f.pushed) return [200, { ok: true, duplicate: true }];
  if (!/(^|[^\w@])@everyone\b/i.test(text)) return [400, { error: "no @everyone" }];
  if (Date.now() - Date.parse(doc.createTime) > 10 * 60 * 1000) return [400, { error: "too old" }];

  // Claim the message first (fails if anyone else already did), so a message is never pushed twice.
  const claim = await fetch(`${docUrl}?updateMask.fieldPaths=pushed&currentDocument.updateTime=${encodeURIComponent(doc.updateTime)}`, {
    method: "PATCH",
    headers: { Authorization: "Bearer " + at, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { pushed: { booleanValue: true } } }),
  });
  if (!claim.ok) return [200, { ok: true, duplicate: true }];

  const clean = text.replace(/\s+/g, " ").trim().slice(0, 140);
  const sender = String((f.u && f.u.stringValue) || "").slice(0, 40);
  const send = await fetch(`https://fcm.googleapis.com/v1/projects/${env.PROJECT_ID}/messages:send`, {
    method: "POST",
    headers: { Authorization: "Bearer " + at, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        topic: TOPIC,
        data: { title: `📣 @everyone · ${ROOMS[room]}`, body: `${sender}: ${clean}`, room, url: env.APP_URL },
        webpush: { headers: { Urgency: "high", TTL: "3600" } },
      },
    }),
  });
  return send.ok ? [200, { ok: true }] : [502, { error: "send failed" }];
}

export default {
  async fetch(req, env) {
    const c = cors(req, env);
    if (req.method === "OPTIONS") return new Response(null, { status: c.ok ? 204 : 403, headers: c.headers });
    if (req.method !== "POST" || !c.ok) return json({ error: "forbidden" }, 403, c.headers);
    const path = new URL(req.url).pathname;
    if (path !== "/register" && path !== "/notify") return json({ error: "not found" }, 404, c.headers);
    try {
      const user = await verifyUser(req, env);
      if (!user) return json({ error: "sign in required" }, 401, c.headers);
      const body = await req.json().catch(() => ({}));
      const [status, out] = path === "/register" ? await register(body, user, env) : await notify(body, user, env);
      return json(out, status, c.headers);
    } catch (e) {
      return json({ error: "server error" }, 500, c.headers);
    }
  },
};
