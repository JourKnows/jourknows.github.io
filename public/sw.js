/*
 * JourKnows service worker (scope: whole site).
 *
 * - Pages: network first (news stays fresh), falls back to the last copy you opened, then to /offline.html.
 * - /_astro/* (hashed build files): cache first, they never change under the same name.
 * - Other same-site files (images, fonts, css): show the cached copy now, refresh it in the background.
 * - /community/ is left completely alone. It is live chat, and it has its own push-notification worker.
 *
 * Bump VERSION when this file's behaviour changes so old caches are cleared.
 */
const VERSION = "jk-v1";
const SHELL = VERSION + "-shell";
const PAGES = VERSION + "-pages";
const ASSETS = VERSION + "-assets";
const OFFLINE = "/offline.html";
const NAV_TIMEOUT = 4000; // ms to wait for the network before showing a saved page
const MAX_PAGES = 40;
const MAX_ASSETS = 120;

self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then(c => c.addAll([OFFLINE, "/icons/icon-192.png", "/icons/apple-touch-icon.png"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k.indexOf(VERSION) !== 0).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trim(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function put(name, max, req, res) {
  if (!res || !res.ok || res.type !== "basic") return;
  const cache = await caches.open(name);
  await cache.put(req, res.clone());
  trim(name, max);
}

function networkFirstPage(req) {
  return new Promise(resolve => {
    let settled = false;
    const fallback = async () => {
      const hit = await caches.match(req, { ignoreSearch: true });
      return hit || (await caches.match(OFFLINE)) || Response.error();
    };
    const timer = setTimeout(async () => {
      if (settled) return;
      settled = true;
      resolve(await fallback());
    }, NAV_TIMEOUT);

    fetch(req)
      .then(res => {
        clearTimeout(timer);
        put(PAGES, MAX_PAGES, req, res);
        if (!settled) {
          settled = true;
          resolve(res);
        }
      })
      .catch(async () => {
        clearTimeout(timer);
        if (!settled) {
          settled = true;
          resolve(await fallback());
        }
      });
  });
}

async function cacheFirst(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  put(ASSETS, MAX_ASSETS, req, res);
  return res;
}

async function staleWhileRevalidate(req) {
  const hit = await caches.match(req);
  const refresh = fetch(req)
    .then(res => {
      put(ASSETS, MAX_ASSETS, req, res);
      return res;
    })
    .catch(() => null);
  return hit || (await refresh) || Response.error();
}

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || req.headers.has("range")) return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // fonts, Firebase, analytics: browser handles them
  if (url.pathname.indexOf("/community/") === 0) return; // live chat: never cached here
  if (url.pathname === "/sw.js") return;

  if (req.mode === "navigate") {
    event.respondWith(networkFirstPage(req));
  } else if (url.pathname.indexOf("/_astro/") === 0) {
    event.respondWith(cacheFirst(req));
  } else {
    event.respondWith(staleWhileRevalidate(req));
  }
});
