import { useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";

export interface SwipePost {
  title: string;
  slug: string;
  author: string;
  image: string | null;
  date: string;
  tag: string;
  points: string[];
  source: "ai" | "auto";
}

interface Saved {
  slug: string;
  title: string;
  image: string | null;
}

const THRESHOLD = 110;
const SAVED_KEY = "jk_saved_stories_v1";
const href = (slug: string) => `/posts/${slug}`;

function loadSaved(): Saved[] {
  try {
    const v = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** Dating-app-style swipe deck of today's stories with summaries. Hydrate with client:visible. */
export default function StorySwipe({ posts }: { posts: SwipePost[] }) {
  const deck = posts;
  const [idx, setIdx] = useState(0);
  const [drag, setDrag] = useState({ x: 0, y: 0, dragging: false });
  const [fly, setFly] = useState<null | "left" | "right">(null);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [history, setHistory] = useState<{ idx: number; dir: "left" | "right"; slug: string }[]>([]);
  const [edition, setEdition] = useState("");

  const start = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setSaved(loadSaved());
    setLoaded(true);
    setEdition(
      new Date()
        .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
        .toUpperCase()
    );
    return () => clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(saved.slice(0, 50)));
    } catch {
      /* ignore */
    }
  }, [saved, loaded]);

  const done = idx >= deck.length;
  const top = deck[idx];

  const commit = (dir: "left" | "right") => {
    if (fly || done) return;
    const a = deck[idx];
    setFly(dir);
    timer.current = setTimeout(() => {
      if (dir === "right") {
        setSaved(prev =>
          prev.some(s => s.slug === a.slug)
            ? prev
            : [{ slug: a.slug, title: a.title, image: a.image }, ...prev]
        );
      }
      setHistory(h => [...h, { idx, dir, slug: a.slug }]);
      setIdx(i => i + 1);
      setFly(null);
      setDrag({ x: 0, y: 0, dragging: false });
    }, 260);
  };

  const undo = () => {
    if (fly || !history.length) return;
    const last = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    if (last.dir === "right") setSaved(prev => prev.filter(s => s.slug !== last.slug));
    setIdx(last.idx);
    setDrag({ x: 0, y: 0, dragging: false });
  };

  const open = (slug: string) => {
    window.location.href = href(slug);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (fly) return;
    start.current = { x: e.clientX, y: e.clientY };
    moved.current = false;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    setDrag(d => ({ ...d, dragging: true }));
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) moved.current = true;
    setDrag({ x: dx, y: dy * 0.4, dragging: true });
  };
  const onPointerUp = () => {
    if (!start.current) return;
    start.current = null;
    if (drag.x > THRESHOLD) commit("right");
    else if (drag.x < -THRESHOLD) commit("left");
    else setDrag({ x: 0, y: 0, dragging: false });
  };
  const onPointerCancel = () => {
    start.current = null;
    setDrag({ x: 0, y: 0, dragging: false });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      commit("right");
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      commit("left");
    } else if (e.key === "Enter" && top) open(top.slug);
    else if (e.key === "Backspace" || e.key.toLowerCase() === "z") {
      e.preventDefault();
      undo();
    }
  };

  const progress = fly ? 1 : Math.min(Math.abs(drag.x) / THRESHOLD, 1);
  const saveOp = fly === "right" ? 1 : Math.max(0, Math.min(drag.x / THRESHOLD, 1));
  const skipOp = fly === "left" ? 1 : Math.max(0, Math.min(-drag.x / THRESHOLD, 1));

  const visible = deck.slice(idx, idx + 3);

  return (
    <div className="jk-sw" aria-label="Swipe desk">
      <div className="jk-sw-inner">
        <div className="jk-sw-copy">
          <span className="jk-sw-eyebrow">
            <span className="jk-live jk-live--red" /> TODAY'S EDITION{edition ? ` · ${edition}` : ""}
          </span>
          <h2 className="jk-sw-heading">Swipe through the day's stories.</h2>
          <p className="jk-sw-sub">
            Every card comes with a short summary. Swipe right to save a story for later, swipe left to skip it, tap to
            read the whole thing.
          </p>
          <ul className="jk-sw-legend">
            <li>
              <kbd>←</kbd> Skip
            </li>
            <li>
              <kbd>→</kbd> Save
            </li>
            <li>
              <kbd>Enter</kbd> Read
            </li>
            <li>
              <kbd>Z</kbd> Undo
            </li>
          </ul>
          <div className="jk-sw-progress" aria-hidden="true">
            <div style={{ width: `${deck.length ? (Math.min(idx, deck.length) / deck.length) * 100 : 0}%` }} />
          </div>

          {saved.length > 0 && (
            <div className="jk-sw-saved">
              <h3>Saved for later · {saved.length}</h3>
              {saved.slice(0, 5).map(s => (
                <div className="jk-saved-row" key={s.slug}>
                  <a className="jk-saved-open" href={href(s.slug)}>
                    <span
                      className="jk-saved-thumb"
                      style={s.image ? { backgroundImage: `url(${s.image})` } : undefined}
                    />
                    <span className="jk-saved-title">{s.title}</span>
                  </a>
                  <button
                    className="jk-saved-remove"
                    onClick={() => setSaved(prev => prev.filter(p => p.slug !== s.slug))}
                    aria-label={`Remove ${s.title}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="jk-sw-wrap">
          <div
            className="jk-sw-deck"
            tabIndex={0}
            role="group"
            aria-label="Story cards. Use left and right arrow keys."
            onKeyDown={onKeyDown}
          >
            {done ? (
              <div className="jk-sw-done">
                <span style={{ fontSize: 28 }}>✦</span>
                <h3 style={{ fontFamily: "var(--jk-serif)", fontSize: 26, fontWeight: 800 }}>You're all caught up</h3>
                <p style={{ color: "rgba(255,255,255,.75)", fontSize: 14 }}>
                  {deck.length ? `You went through ${deck.length} stories.` : "No stories in today's edition yet."}{" "}
                  {saved.length ? `${saved.length} saved for later.` : ""}
                </p>
                {deck.length > 0 && (
                  <button
                    className="jk-sw-again"
                    onClick={() => {
                      setIdx(0);
                      setHistory([]);
                    }}
                  >
                    Review again
                  </button>
                )}
              </div>
            ) : (
              visible
                .map((a, depth) => {
                  const isTop = depth === 0;
                  let style: CSSProperties;
                  if (isTop) {
                    style = fly
                      ? {
                          transform: `translate(${fly === "right" ? "150%" : "-150%"}, -40px) rotate(${fly === "right" ? 28 : -28}deg)`,
                          transition: "transform .26s ease-in, opacity .26s",
                          opacity: 0,
                        }
                      : {
                          transform: `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x / 16}deg)`,
                          transition: drag.dragging ? "none" : "transform .3s cubic-bezier(.2,.9,.3,1.2)",
                        };
                  } else {
                    const lift = depth === 1 ? progress : 0;
                    style = {
                      transform: `translateY(${depth * 14 - 14 * lift}px) scale(${1 - 0.05 * depth + 0.05 * lift})`,
                      transition: drag.dragging ? "none" : "transform .3s ease",
                      pointerEvents: "none",
                    };
                  }
                  return (
                    <div
                      key={a.slug || a.title}
                      className="jk-sw-card"
                      style={{ ...style, zIndex: 10 - depth }}
                      {...(isTop
                        ? {
                            onPointerDown,
                            onPointerMove,
                            onPointerUp,
                            onPointerCancel,
                            onClick: () => {
                              if (!moved.current) open(a.slug);
                            },
                          }
                        : {})}
                    >
                      <div
                        className="jk-sw-cover"
                        style={a.image ? { backgroundImage: `url(${a.image})` } : undefined}
                      />
                      <div className="jk-sw-shade" />
                      <div className="jk-sw-top">
                        <span className="jk-sw-cat">{a.tag.toUpperCase()}</span>
                        <span className="jk-sw-count">
                          {idx + depth + 1} / {deck.length}
                        </span>
                      </div>
                      {isTop && (
                        <>
                          <div className="jk-sw-stamp jk-sw-stamp--save" style={{ opacity: saveOp }}>
                            SAVE
                          </div>
                          <div className="jk-sw-stamp jk-sw-stamp--skip" style={{ opacity: skipOp }}>
                            SKIP
                          </div>
                        </>
                      )}
                      <div className="jk-sw-bottom">
                        <h3 className="jk-sw-title">{a.title}</h3>
                        <p className="jk-sw-by">
                          by {a.author}
                          {a.date ? ` · ${a.date}` : ""}
                        </p>
                        <div className="jk-sw-summary">
                          <div className="jk-sw-summary-head">✦ {a.source === "ai" ? "AI SUMMARY" : "QUICK SUMMARY"}</div>
                          {a.points.length ? (
                            <ul>
                              {a.points.map((p, k) => (
                                <li key={k}>{p}</li>
                              ))}
                            </ul>
                          ) : (
                            <p style={{ fontSize: 12.5, color: "rgba(255,255,255,.8)" }}>Tap to read the full story.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
                .reverse()
            )}
          </div>

          <div className="jk-sw-actions">
            <button className="jk-sw-btn jk-sw-btn--sm" onClick={undo} disabled={!history.length || !!fly} aria-label="Undo last swipe">
              ↺
            </button>
            <button className="jk-sw-btn jk-sw-btn--skip" onClick={() => commit("left")} disabled={done} aria-label="Skip story">
              <svg className="jk-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 28, height: 28, strokeWidth: 3 }}>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <button className="jk-sw-btn jk-sw-btn--sm" onClick={() => top && open(top.slug)} disabled={done} aria-label="Read full story">
              ↗
            </button>
            <button className="jk-sw-btn jk-sw-btn--save" onClick={() => commit("right")} disabled={done} aria-label="Save story">
              <svg className="jk-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 28, height: 28, strokeWidth: 2.6 }}>
                <path d="M12 21s-7.5-4.6-9.5-9.3A5.3 5.3 0 0 1 12 6.4a5.3 5.3 0 0 1 9.5 5.3C19.5 16.4 12 21 12 21z" />
              </svg>
            </button>
          </div>
          <p className="jk-sw-hint">Swipe or use the buttons · tap a card to read</p>
        </div>
      </div>
    </div>
  );
}
