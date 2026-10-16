const STOP = new Set(
  "a an and are as at be but by for from has have he her his i in is it its of on or our she that the their them they this to was we were will with you your not been than then there these those which who whom would could should about after before into over under also more most such can may might do does did so if when what while".split(
    " "
  )
);

export interface PostSummary {
  points: string[];
  /** "ai" when the post's frontmatter supplies `aiSummary`, otherwise "auto" (on-build extractive summary) */
  source: "ai" | "auto";
}

/** Strips frontmatter, images, links, headings, code and HTML from markdown. */
export function cleanMarkdown(md = ""): string {
  return md
    .replace(/^---[\s\S]*?---/, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^#{1,6}\s.*$/gm, " ")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*([-*+]|\d+\.)\s+/gm, "")
    .replace(/[*_~]{1,3}([^*_~\n]+)[*_~]{1,3}/g, "$1")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sentencesOf(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]+["”')\]]*(?=\s|$)|[^.!?]+$/g) || [])
    .map(s => s.trim())
    .filter(s => s.length >= 40 && s.length <= 320);
}

const wordsOf = (s: string) =>
  (s.toLowerCase().match(/[a-z']{3,}/g) || []).filter(w => !STOP.has(w));

export function readingMinutes(body = ""): number {
  const words = cleanMarkdown(body).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function summarizePost(
  body = "",
  description = "",
  aiSummary?: string | string[],
  maxPoints = 3
): PostSummary {
  if (Array.isArray(aiSummary) && aiSummary.length) {
    return { points: aiSummary.slice(0, maxPoints).map(String), source: "ai" };
  }
  if (typeof aiSummary === "string" && aiSummary.trim()) {
    const s = sentencesOf(aiSummary);
    return {
      points: (s.length ? s : [aiSummary.trim()]).slice(0, maxPoints),
      source: "ai",
    };
  }

  const text = cleanMarkdown(body);
  const sents = sentencesOf(text);

  if (!sents.length) {
    const d = description.trim();
    return { points: d ? [d] : [], source: "auto" };
  }
  if (sents.length <= maxPoints) return { points: sents, source: "auto" };

  const freq = new Map<string, number>();
  for (const w of wordsOf(text)) freq.set(w, (freq.get(w) || 0) + 1);

  const points = sents
    .map((s, i) => {
      const ws = wordsOf(s);
      const score =
        ws.reduce((a, w) => a + (freq.get(w) || 0), 0) / Math.sqrt(ws.length || 1);
      return { s, i, score: score * (i < 3 ? 1.25 : 1) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxPoints)
    .sort((a, b) => a.i - b.i)
    .map(x => x.s);

  return { points, source: "auto" };
}
