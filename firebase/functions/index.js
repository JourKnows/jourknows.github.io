/**
 * Sends a push notification to everyone when a message contains @everyone.
 *
 * Deploy region: must match your Firestore database location (asia-southeast1 = Singapore).
 * If your database is somewhere else, change REGION below.
 */
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();

const REGION = "asia-southeast1";
// true  = only editors' @everyone sends a push (recommended, prevents spam)
// false = any signed-in member's @everyone sends a push
const EDITORS_ONLY = true;
const APP_URL = "https://jourknowsph.com/community/";

const ROOM_NAMES = {
  breaking: "Breaking Updates", lobby: "Welcome Lobby", news: "News Desk", sports: "Sports Desk",
  scitech: "Sci-Tech Desk", opinion: "Opinion Desk", pitch: "Pitch Corner", literacy: "Media Literacy",
  design: "Layout and Design", campus: "Campus Press Hub",
};
const BAD_TOKEN = ["messaging/registration-token-not-registered", "messaging/invalid-registration-token"];

setGlobalOptions({ region: REGION, maxInstances: 5 });

exports.notifyEveryone = onDocumentCreated("rooms/{room}/messages/{id}", async event => {
  const snap = event.data;
  if (!snap) return;
  const m = snap.data();
  if (m.sys === true) return;
  if (!/(^|[^\w@])@everyone\b/i.test(String(m.t || ""))) return;
  if (EDITORS_ONLY && m.ed !== true) return;

  const room = event.params.room;
  const text = String(m.t).replace(/\s+/g, " ").trim().slice(0, 140);
  const title = `📣 @everyone · ${ROOM_NAMES[room] || room}`;
  const body = `${String(m.u || "").slice(0, 40)}: ${text}`;

  // Every device that turned notifications on (users/{uid}/tokens/{token}), except the sender's.
  const all = await admin.firestore().collectionGroup("tokens").get();
  const targets = [];
  all.forEach(d => {
    if (d.ref.parent.parent && d.ref.parent.parent.id !== m.uid) targets.push({ token: d.id, ref: d.ref });
  });
  if (!targets.length) return;

  const stale = [];
  for (let i = 0; i < targets.length; i += 500) {
    const chunk = targets.slice(i, i + 500);
    const res = await admin.messaging().sendEachForMulticast({
      tokens: chunk.map(t => t.token),
      data: { title, body, room, url: APP_URL },
      webpush: { headers: { Urgency: "high", TTL: "3600" } },
    });
    res.responses.forEach((r, j) => {
      if (!r.success && r.error && BAD_TOKEN.includes(r.error.code)) stale.push(chunk[j].ref);
    });
  }
  // Clean up tokens for devices that uninstalled or revoked permission.
  await Promise.all(stale.map(ref => ref.delete().catch(() => {})));
});
