import React, { useEffect, useRef, useState } from "react";
import {
  ARRIVE_SCRIPT,
  CHAT_ICON_SVG,
  COMMUNITY_HREF,
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
  position:fixed; right:0; bottom:calc(20px + env(safe-area-inset-bottom,0px)); z-index:150;
  display:flex; flex-direction:column; align-items:center; gap:6px;
  min-width:68px; max-width:84px; padding:11px 8px 10px;
  border-radius:24px 0 0 24px;
  background:#ECEEFB; border:1px solid rgba(27,32,56,.08); border-right:0;
  box-shadow:-6px 8px 26px rgba(27,32,56,.20), inset 0 1px 0 #fff;
  color:#2A2D4A; text-decoration:none; cursor:pointer;
  -webkit-tap-highlight-color:transparent; touch-action:manipulation; user-select:none;
  transform-origin:right center;
  transition:transform .45s cubic-bezier(.16,1,.3,1), min-width .35s cubic-bezier(.16,1,.3,1), padding .35s cubic-bezier(.16,1,.3,1), box-shadow .3s ease;
}
.jkfab:active{ transform:scale(.95); }
.jkfab:focus-visible{ outline:3px solid #E8683B; outline-offset:3px; }
@media (hover:hover){ .jkfab:hover{ transform:translateX(-4px); box-shadow:-10px 10px 30px rgba(27,32,56,.26), inset 0 1px 0 #fff; } }

.jkfab-ic{ position:relative; width:36px; height:36px; flex:none; }
.jkfab-ic > span:last-child{ display:block; width:100%; height:100%; }
.jkfab-ic svg{ width:100%; height:100%; display:block; }
.jkfab-ring{
  position:absolute; inset:-5px; border-radius:50%; border:2px solid #E8683B; opacity:0; pointer-events:none;
  animation:jkfabRing 3.6s ease-out 2.4s infinite;
}
.jkfab-lb{
  display:block; text-align:center; font-weight:800; font-size:11px; line-height:1.05;
  font-stretch:condensed; letter-spacing:.01em; text-transform:uppercase; color:#2A2D4A;
  max-height:32px; overflow:hidden; opacity:1;
  transition:max-height .3s ease, opacity .2s ease, margin .3s ease;
}

/* Collapsed while reading: icon only, so it never covers an article */
.jkfab.is-min{ min-width:56px; padding:10px 8px; }
.jkfab.is-min .jkfab-lb{ max-height:0; opacity:0; margin-top:-6px; }

@media (min-width:1024px){
  .jkfab{ bottom:32px; min-width:84px; max-width:100px; padding:14px 12px 13px; gap:7px; }
  .jkfab-ic{ width:40px; height:40px; }
  .jkfab-lb{ font-size:12.5px; max-height:34px; }
}

.jkfab.is-pop{ animation:jkfabPop .7s cubic-bezier(.34,1.56,.64,1) both; }
@keyframes jkfabPop{ 0%{ transform:translateX(80px) scale(.8); opacity:0 } 100%{ transform:none; opacity:1 } }
@keyframes jkfabRing{ 0%{ transform:scale(.8); opacity:0 } 12%{ opacity:.9 } 60%,100%{ transform:scale(1.5); opacity:0 } }

@media (prefers-reduced-motion:reduce){
  .jkfab,.jkfab-lb{ transition:none; }
  .jkfab-ring{ animation:none; }
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
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <a
        ref={ref}
        href={COMMUNITY_HREF}
        data-astro-reload=""
        onClick={onClick}
        aria-label="Open the JourKnows community chat"
        className={`jkfab font-display${min ? " is-min" : ""}${pop ? " is-pop" : ""}`}
      >
        <span className="jkfab-ic">
          <span className="jkfab-ring" aria-hidden="true" />
          <span dangerouslySetInnerHTML={{ __html: CHAT_ICON_SVG }} />
        </span>
        <span className="jkfab-lb">
          Community
          <br />
          chat
        </span>
      </a>
    </>
  );
}
