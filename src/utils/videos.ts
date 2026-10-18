import { getCollection } from "astro:content";
import fs from "node:fs";
import path from "node:path";

// Works at a domain root ("/") and under a sub-folder
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const withBase = (u: string) =>
  u.startsWith("/") && !u.startsWith("//") ? `${BASE}${u}` : u;

export type Kind = "youtube" | "facebook" | "file";

export type VideoItem = {
  id: string;
  show: string;
  showSlug: string;
  color: string;
  live: boolean;
  featured: boolean;
  title: string;
  description: string;
  author: string;
  date: string;
  kind: Kind;
  embed: string;
  thumb: string | null;
  source: string; // the original link
  thumbId: string; // file name of the saved Facebook thumbnail
  thumbFromFacebook: boolean;
};

const YT =
  /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/;

const describe = (raw: string) => {
  const url = raw.trim();
  const yt = url.match(YT);
  if (yt) {
    return {
      kind: "youtube" as Kind,
      embed: `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0`,
      thumb: `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg`,
    };
  }
  if (/facebook\.com|fb\.watch/i.test(url)) {
    return {
      kind: "facebook" as Kind,
      embed: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=true`,
      thumb: null,
    };
  }
  return { kind: "file" as Kind, embed: withBase(url), thumb: null };
};

/* ── Facebook thumbnails ─────────────────────────────────────────────────────
   For a Facebook link, we ask Facebook for the page the way its own crawler does and
   take the thumbnail Facebook selected (og:image). The picture is saved into the build
   as /video-thumbs/<id>.jpg, so it never expires and loads from our own site.
   If Facebook does not hand one over (private video, blocked), the card simply shows
   the navy placeholder. A "thumbnail:" in the video's .md file always wins. */
const FB_UA = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";
const unescapeHtml = (t: string) =>
  t
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

export function parseOgImage(html: string): string | null {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const name of ["og:image", "og:image:url", "twitter:image"]) {
    for (const tag of tags) {
      const isIt = new RegExp(`(?:property|name)\\s*=\\s*["']${name}["']`, "i").test(tag);
      const m = tag.match(/content\s*=\s*["']([^"']+)["']/i);
      if (isIt && m) return unescapeHtml(m[1]);
    }
  }
  return null;
}

type Thumb = { bytes: Uint8Array; type: string };
const fbCache = new Map<string, Promise<Thumb | null>>();

async function timedFetch(url: string, init: RequestInit = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    return await fetch(url, { redirect: "follow", signal: ctrl.signal, ...init });
  } finally {
    clearTimeout(t);
  }
}

const UAS = [
  FB_UA,
  "Mozilla/5.0 (compatible; Twitterbot/1.0)",
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36",
  "WhatsApp/2.23.20.0",
];

const fbVideoId = (url: string) =>
  url.match(/(?:videos\/(?:[^/?#]+\/)?|reel\/|[?&]v=|story_fbid=)(\d{8,})/)?.[1] || null;

async function grabImage(img: string, ua: string): Promise<Thumb | null> {
  try {
    const pic = await timedFetch(img, { headers: { "user-agent": ua, accept: "image/*" } });
    if (!pic.ok) return null;
    const type = pic.headers.get("content-type") || "";
    if (!type.startsWith("image/")) return null;
    const bytes = new Uint8Array(await pic.arrayBuffer());
    return bytes.length > 500 ? { bytes, type } : null;
  } catch {
    return null;
  }
}

/** The picture Facebook chose for this video link (null if unavailable). */
export function getFacebookThumb(url: string): Promise<Thumb | null> {
  if (!fbCache.has(url)) {
    fbCache.set(
      url,
      (async () => {
        // 1) the page's og:image, asking as several different crawlers
        const pages = [url, url.replace("://www.facebook.com", "://m.facebook.com")];
        for (const pageUrl of pages) {
          for (const ua of UAS) {
            try {
              const page = await timedFetch(pageUrl, {
                headers: { "user-agent": ua, accept: "text/html", "accept-language": "en-US,en;q=0.9" },
              });
              if (!page.ok) continue;
              const img = parseOgImage(await page.text());
              if (!img) continue;
              const got = (await grabImage(img, ua)) || (await grabImage(img, FB_UA));
              if (got) return got;
            } catch {
              /* try the next one */
            }
          }
        }
        // 2) Graph picture endpoint (works for public videos without a token)
        const id = fbVideoId(url);
        if (id) {
          const got = await grabImage(`https://graph.facebook.com/${id}/picture?type=large`, UAS[2]);
          if (got) return got;
        }
        console.warn(
          `[videos] No Facebook thumbnail for ${url}. Facebook blocked the build server; upload a Thumbnail in the video's entry instead.`
        );
        return null;
      })()
    );
  }
  return fbCache.get(url)!;
}


/* Find an uploaded thumbnail inside /public, wherever the CMS saved it.
   If the path in the .md does not exist, look in the usual upload folders by file name. */
const PUBLIC_DIR = path.join(process.cwd(), "public");
function resolveThumb(raw: string): string {
  const t = raw.trim();
  if (/^https?:\/\//i.test(t)) return t;
  const rel = t.replace(/^\/+/, "").replace(/^public\//, "");
  const name = path.basename(rel);
  const tries = [rel, `images/video-thumbs/${name}`, name, `images/${name}`, `assets/${name}`, `uploads/${name}`];
  for (const c of tries) {
    try {
      if (fs.existsSync(path.join(PUBLIC_DIR, c))) return withBase("/" + c);
    } catch {}
  }
  console.warn(`[videos] Thumbnail "${t}" was not found in /public. Check the file was uploaded.`);
  return withBase(t.startsWith("/") ? t : "/" + t);
}

const formatDate = (d?: Date | string) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

export const slugShow = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "broadcast";

// One accent colour per show, used on each card's label
const TAG_COLORS = [
  "#e63946",
  "#1d4ed8",
  "#f77f00",
  "#2a9d8f",
  "#7b2cbf",
  "#d6336c",
  "#2b9348",
  "#0b1f66",
];

/** All published videos (src/content/videos/*.md). Newest first, LIVE first. */
export async function getVideos(): Promise<VideoItem[]> {
  let entries: any[] = [];
  try {
    entries = await getCollection("videos", ({ data }: any) => !data.draft);
  } catch {
    entries = [];
  }

  entries.sort(
    (a, b) =>
      new Date(b.data.pubDatetime).getTime() -
      new Date(a.data.pubDatetime).getTime()
  );

  const showNames: string[] = [];
  for (const v of entries) {
    const s = (v.data.show || "Broadcast").trim();
    if (!showNames.includes(s)) showNames.push(s);
  }

  const videos: VideoItem[] = [];
  for (const v of entries) {
    const d = describe(v.data.url);
    const thumbId = slugShow(String(v.id).replace(/\.mdx?$/, ""));
    let thumb: string | null = v.data.thumbnail ? resolveThumb(v.data.thumbnail) : d.thumb;
    let thumbFromFacebook = false;
    if (!thumb && d.kind === "facebook" && (await getFacebookThumb(v.data.url.trim()))) {
      thumb = `${BASE}/video-thumbs/${thumbId}.jpg`;
      thumbFromFacebook = true;
    }
    const show = (v.data.show || "Broadcast").trim();
    videos.push({
      id: v.id,
      show,
      showSlug: slugShow(show),
      color: TAG_COLORS[showNames.indexOf(show) % TAG_COLORS.length],
      live: !!v.data.live,
      featured: !!v.data.featured,
      title: v.data.title,
      description: v.data.description || "",
      author: v.data.author || "JourKnows Broadcast",
      date: formatDate(v.data.pubDatetime),
      kind: d.kind,
      embed: d.embed,
      thumb,
      source: v.data.url.trim(),
      thumbId,
      thumbFromFacebook,
    });
  }

  // A live video always goes first (stable sort keeps newest-first otherwise)
  videos.sort((x, y) => Number(y.live) - Number(x.live));
  return videos;
}

/** Videos grouped by show ("desk"), in order of first appearance. */
export function getShows(videos: VideoItem[]) {
  const map = new Map<
    string,
    { name: string; slug: string; color: string; videos: VideoItem[] }
  >();
  for (const v of videos) {
    if (!map.has(v.showSlug)) {
      map.set(v.showSlug, {
        name: v.show,
        slug: v.showSlug,
        color: v.color,
        videos: [],
      });
    }
    map.get(v.showSlug)!.videos.push(v);
  }
  return [...map.values()];
}

/** Embed for a single video inside an article (no autoplay). */
export function getInlineEmbed(raw: string) {
  const d = describe(raw);
  const src = d.embed
    .replace("autoplay=1", "autoplay=0")
    .replace("autoplay=true", "autoplay=false");
  return { kind: d.kind, src };
}
