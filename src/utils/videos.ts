import { getCollection } from "astro:content";

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

  const videos: VideoItem[] = entries.map(v => {
    const d = describe(v.data.url);
    const show = (v.data.show || "Broadcast").trim();
    return {
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
      thumb: v.data.thumbnail ? withBase(v.data.thumbnail) : d.thumb,
    };
  });

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
