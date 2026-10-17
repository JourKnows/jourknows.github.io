import { useEffect, useRef, useState } from "react";
import StorySwipe from "./StorySwipe";
import type { SwipePost } from "./StorySwipe";

const MIN_KEY = "jk_fab_min";

/** Floating prompt that opens the story-swipe deck in a pop-up. Hydrate with client:idle. */
export default function SwipeLauncher({ posts }: { posts: SwipePost[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // keep deck mounted after first open so progress is kept
  const [min, setMin] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(MIN_KEY) === "1") setMin(true);
    } catch {
      /* ignore */
    }
  }, []);

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
        <div className={`jk-fab${min ? " is-min" : ""}`}>
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
              <svg className="jk-ic" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
              </svg>
            </span>
            <span className="jk-fab-text">Want to know stories that interest you?</span>
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
