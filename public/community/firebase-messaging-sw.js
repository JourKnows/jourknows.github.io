/* Shows @everyone push notifications when the chat is closed or in the background.
 * Registered by index.html with scope /community/. Needs the same settings as the page. */
importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js",
  "./firebase-config.js"
);

const CFG = self.JK_FIREBASE;
if (CFG && CFG.config && CFG.config.apiKey) {
  firebase.initializeApp(CFG.config);
  const messaging = firebase.messaging();
  // The server sends data-only messages so we control exactly what is shown.
  messaging.onBackgroundMessage(payload => {
    const d = payload.data || {};
    return self.registration.showNotification(d.title || "📣 @everyone", {
      body: d.body || "",
      icon: "icons/icon-192.png",
      badge: "icons/icon-192.png",
      tag: "jk-everyone",
      renotify: true,
      data: { room: d.room || "", url: d.url || CFG.appUrl || "./" },
    });
  });
}

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const data = event.notification.data || {};
  const target = (data.url || "./") + (data.room ? "#" + data.room : "");
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.indexOf(self.registration.scope) === 0 && "focus" in c) {
          c.postMessage({ type: "open-room", room: data.room });
          return c.focus();
        }
      }
      return clients.openWindow(target);
    })
  );
});
