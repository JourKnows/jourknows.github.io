import { useEffect, useRef, useState } from "react";
import StorySwipe from "./StorySwipe";
import { makeDraggable } from "../utils/draggable";
import type { SwipePost } from "./StorySwipe";

const MIN_KEY = "jk_fab_min";

/** Floating prompt that opens the story-swipe deck in a pop-up. Hydrate with client:idle. */
export default function SwipeLauncher({ posts }: { posts: SwipePost[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // keep deck mounted after first open so progress is kept
  const [min, setMin] = useState(false);
  const [scrollMin, setScrollMin] = useState(false); // collapses while scrolling, like the chat pill
  const [pop, setPop] = useState(true); // slide-in on arrival
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const fab = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(MIN_KEY) === "1") setMin(true);
    } catch {
      /* ignore */
    }
  }, []);

  // Same behaviour as the community chat pill: collapse to the icon while scrolling down,
  // bring the label back on scroll up or when idle.
  useEffect(() => {
    const t = window.setTimeout(() => setPop(false), 800);
    let lastY = window.scrollY;
    let dir = 0;
    let acc = 0;
    let ticking = false;
    let idle: number | undefined;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const d = y - lastY;
        lastY = y;
        if (d > 0) {
          if (dir !== 1) {
            dir = 1;
            acc = 0;
          }
          acc += d;
          if (acc > 24 && y > 120) setScrollMin(true);
        } else if (d < 0) {
          if (dir !== -1) {
            dir = -1;
            acc = 0;
          }
          acc -= d;
          if (acc > 16) setScrollMin(false);
        }
        if (y <= 120) setScrollMin(false);
        ticking = false;
        window.clearTimeout(idle);
        idle = window.setTimeout(() => setScrollMin(false), 1800);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(idle);
      window.clearTimeout(t);
    };
  }, []);

  // Drag the floating buttons anywhere on screen, together as a group; a plain tap still opens the deck.
  useEffect(() => {
    if (open || !fab.current) return;
    return makeDraggable(fab.current, { ignore: ".jk-fab-x" });
  }, [open, posts.length]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>(".jk-sw-deck")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return setOpen(false);
      if (e.key !== "Tab" || !panel.current) return;
      const f = panel.current.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], [tabindex='0']");
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      btn.current?.focus();
    };
  }, [open]);

  if (!posts.length) return null;

  const shrink = () => {
    setMin(true);
    try {
      sessionStorage.setItem(MIN_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      {!open && (
        <div ref={fab} className={`jk-fab${min || scrollMin ? " is-min" : ""}${pop ? " is-pop" : ""}`}>
          <button
            ref={btn}
            className="jk-fab-main"
            onClick={() => {
              setMounted(true);
              setOpen(true);
            }}
            aria-haspopup="dialog"
            aria-label="Want to know stories that interest you? Open the story swipe."
          >
            <span className="jk-fab-ic" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28" className="jk-fab-glyph" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3h9a2 2 0 0 1 2 2v11" />
                <rect x="4" y="6" width="12" height="15" rx="2" />
                <path d="M7 11h6M7 14.5h6M7 18h3" />
              </svg>
            </span>
            <span className="jk-fab-text">
              Stories for you
            </span>
          </button>
          {!min && (
            <button className="jk-fab-x" onClick={shrink} aria-label="Minimize prompt">
              <svg className="jk-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 14, height: 14 }}>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {mounted && (
        <div
          className="jk-modal"
          hidden={!open}
          onMouseDown={e => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div ref={panel} className="jk-modal-panel" role="dialog" aria-modal="true" aria-label="Swipe through today's stories">
            <button className="jk-modal-close" onClick={() => setOpen(false)} aria-label="Close">
              <svg className="jk-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 18, height: 18 }}>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <div className="jk-modal-head">
              <h2>Stories for you</h2>
              <p>Swipe right to save, left to skip. Tap a card to read it.</p>
            </div>
            <StorySwipe posts={posts} variant="modal" />
          </div>
        </div>
      )}
    </>
  );
}
