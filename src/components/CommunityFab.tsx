import React, { useEffect, useRef, useState } from "react";
import { makeDraggable } from "../utils/draggable";
import {
  ARRIVE_SCRIPT,
  CHAT_ICON_SVG,
  COMMUNITY_HREF,
  DOT_CSS,
  clearCovers,
  isPlainLeftClick,
  openCommunity,
  playArrival,
} from "../utils/communityTransition";

/**
 * Render this as the very first thing in the page body (AppNavbar does it). It paints the navy
 * cover while the page is still loading when the person is returning from the community chat,
 * so there is no flash of the site before the collapse animation.
 */
export function CommunityArriveGuard() {
  return <script dangerouslySetInnerHTML={{ __html: ARRIVE_SCRIPT }} />;
}

const CSS = `
.jkfab{
  position:fixed; right:calc(16px + var(--jk-gx,0px)); bottom:calc(20px + env(safe-area-inset-bottom,0px) + var(--jk-gy,0px)); z-index:150;
  display:flex; flex-direction:row; align-items:center;
  height:48px; padding:0 18px 0 12px;
  border-radius:999px;
  background:#000E4B; border:1px solid rgba(255,255,255,.18);
  box-shadow:0 8px 24px rgba(0,0,0,.4);
  color:#fff; text-decoration:none; cursor:pointer;
  -webkit-tap-highlight-color:transparent; touch-action:none; user-select:none; -webkit-user-drag:none;
  transition:transform .35s cubic-bezier(.16,1,.3,1), padding .3s ease, background .25s ease, box-shadow .3s ease;
}
.jkfab:active{ transform:scale(.96); }
.jkfab:focus-visible{ outline:3px solid #fff; outline-offset:2px; }
@media (hover:hover){ .jkfab:hover{ transform:translateY(-2px); background:#000; box-shadow:0 12px 28px rgba(0,0,0,.5); } }

.jkfab.is-drag{ transition:none; cursor:grabbing; transform:scale(1.04); box-shadow:0 16px 34px rgba(0,0,0,.55); }
.jkfab-ic{ position:relative; width:28px; height:28px; flex:none; }
.jkfab-ic > span{ display:block; width:100%; height:100%; }
.jkfab-ic svg{ width:100%; height:100%; display:block; }
.jkfab-lb{
  display:block; margin-left:10px; white-space:nowrap; overflow:hidden;
  font-weight:700; font-size:12px; line-height:1; letter-spacing:.06em; text-transform:uppercase; color:#fff;
  max-width:160px; opacity:1;
  transition:max-width .3s ease, opacity .2s ease, margin .3s ease;
}

/* Collapsed while reading: icon-only circle, so it never covers an article */
.jkfab.is-min{ padding:0 9px; }
.jkfab.is-min .jkfab-lb{ max-width:0; opacity:0; margin-left:0; }

@media (min-width:1024px){
  .jkfab{ right:calc(24px + var(--jk-gx,0px)); bottom:calc(32px + var(--jk-gy,0px)); }
}

/* The three chat dots wave on their own (DOT_CSS); pressing or hovering the button makes them eager */
.jkfab:active .jk-dot{ animation-duration:1.1s; animation-name:jkDotFast; }
@media (hover:hover){ .jkfab:hover .jk-dot{ animation-duration:1.1s; animation-name:jkDotFast; } }
.jkfab.is-pop{ animation:jkfabPop .7s cubic-bezier(.34,1.56,.64,1) both; }
@keyframes jkfabPop{ 0%{ transform:translateX(80px) scale(.8); opacity:0 } 100%{ transform:none; opacity:1 } }

@media (prefers-reduced-motion:reduce){
  .jkfab,.jkfab-lb{ transition:none; }
  .jkfab.is-pop{ animation:none; }
}
@media print{ .jkfab{ display:none } }
`;

export default function CommunityFab() {
  const ref = useRef<HTMLAnchorElement>(null);
  const [min, setMin] = useState(false);
  const [pop, setPop] = useState(false);

  // Collapse to the icon while scrolling down; bring the label back on scroll up or when idle.
  // Distance is accumulated per direction, so slow scrolling counts as well as quick flicks.
  useEffect(() => {
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
          if (acc > 24 && y > 120) setMin(true);
        } else if (d < 0) {
          if (dir !== -1) {
            dir = -1;
            acc = 0;
          }
          acc -= d;
          if (acc > 16) setMin(false);
        }
        if (y <= 120) setMin(false);
        ticking = false;
        window.clearTimeout(idle);
        idle = window.setTimeout(() => setMin(false), 1800);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(idle);
    };
  }, []);

  // Drag the floating buttons anywhere on screen, together as a group; a plain tap still opens the chat.
  useEffect(() => (ref.current ? makeDraggable(ref.current) : undefined), []);

  // Coming back from the chat: collapse the navy cover into this button, then pop the button.
  // Also clean up if the browser restores the page from its back-forward cache.
  useEffect(() => {
    const rect = ref.current?.getBoundingClientRect();
    const target = rect
      ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      : { x: window.innerWidth - 40, y: window.innerHeight - 60 };
    playArrival(target, () => {
      setPop(true);
      window.setTimeout(() => setPop(false), 800);
    });

    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) clearCovers();
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  // Warm up the chat page so the transition lands on an already-fetched document.
  useEffect(() => {
    const warm = () => {
      if (document.querySelector('link[rel="prefetch"][href="' + COMMUNITY_HREF + '"]')) return;
      const l = document.createElement("link");
      l.rel = "prefetch";
      l.href = COMMUNITY_HREF;
      document.head.appendChild(l);
    };
    const w = window as any;
    const id = w.requestIdleCallback ? w.requestIdleCallback(warm) : window.setTimeout(warm, 1500);
    return () => {
      if (w.cancelIdleCallback) w.cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, []);

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isPlainLeftClick(e)) return;
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    openCommunity({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: DOT_CSS + CSS }} />
      <a
        ref={ref}
        href={COMMUNITY_HREF}
        data-astro-reload=""
        onClick={onClick}
        aria-label="Open the JourKnows community chat"
        className={`jkfab${min ? " is-min" : ""}${pop ? " is-pop" : ""}`}
      >
        <span className="jkfab-ic">
          <span dangerouslySetInnerHTML={{ __html: CHAT_ICON_SVG }} />
        </span>
        <span className="jkfab-lb">
          Community chat
        </span>
      </a>
    </>
  );
}
