// Shared desk (section) settings so the home page and the desk pages
// (/tags/<desk>) always use the same order and the same colours.

export const SECTION_ORDER = [
  "news",
  "sports",
  "opinion",
  "feature",
  "sci-tech",
  "explainer",
  "literary",
  "cartoon",
];

// One vivid colour per desk (white text sits on top of it)
export const TAG_COLORS = [
  "#e63946", // red
  "#1d4ed8", // blue
  "#f77f00", // orange
  "#2a9d8f", // teal
  "#7b2cbf", // purple
  "#d6336c", // pink
  "#2b9348", // green
  "#0b1f66", // navy
];

// Short line under each desk name. Edit freely.
export const DESK_TAGLINES: Record<string, string> = {
  news: "What happened, and why it matters.",
  sports: "Scores, stories and the people behind the plays.",
  opinion: "Views from the newsroom and beyond.",
  feature: "Long reads and human stories.",
  "sci-tech": "Science, technology and what comes next.",
  explainer: "The context behind the headlines.",
  literary: "Verse and prose from student writers.",
  cartoon: "Sharp lines, sharper points.",
};

type TagItem = { tag: string; tagName: string };

// Same sort the home page uses
export const sortDesks = <T extends TagItem>(tags: T[]): T[] =>
  [...tags].sort((a, b) => {
    const aIdx = SECTION_ORDER.indexOf(a.tag);
    const bIdx = SECTION_ORDER.indexOf(b.tag);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.tagName.localeCompare(b.tagName);
  });

// Same colour the home page gives each desk
export const deskColor = (sorted: TagItem[], tag: string): string => {
  const i = sorted.findIndex(t => t.tag === tag);
  if (i >= 0) return TAG_COLORS[i % TAG_COLORS.length];
  let h = 0;
  for (const c of tag) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TAG_COLORS[h % TAG_COLORS.length];
};
