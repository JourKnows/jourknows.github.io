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
  min-width:64px; max-width:84px; padding:11px 8px 10px;
  border-radius:12px 0 0 12px;
  background:#000E4B; border:1px solid rgba(255,255,255,.14); border-right:0;
  box-shadow:-4px 6px 20px rgba(0,0,0,.35);
  color:#fff; text-decoration:none; cursor:pointer;
  -webkit-tap-highlight-color:transparent; touch-action:manipulation; user-select:none;
  transform-origin:right center;
  transition:transform .45s cubic-bezier(.16,1,.3,1), min-width .35s cubic-bezier(.16,1,.3,1), padding .35s cubic-bezier(.16,1,.3,1), background .25s ease, box-shadow .3s ease;
}
.jkfab:active{ transform:scale(.96); }
.jkfab:focus-visible{ outline:3px solid #fff; outline-offset:3px; }
@media (hover:hover){ .jkfab:hover{ transform:translateX(-3px); background:#000; box-shadow:-6px 8px 24px rgba(0,0,0,.45); } }

.jkfab-ic{ position:relative; width:32px; height:32px; flex:none; }
.jkfab-ic > span{ display:block; width:100%; height:100%; }
.jkfab-ic svg{ width:100%; height:100%; display:block; }
.jkfab-lb{
  display:block; text-align:center; font-weight:700; font-size:10px; line-height:1.15;
  letter-spacing:.08em; text-transform:uppercase; color:#fff;
  max-height:32px; overflow:hidden; opacity:1;
  transition:max-height .3s ease, opacity .2s ease, margin .3s ease;
}

/* Collapsed while reading: icon only, so it never covers an article */
.jkfab.is-min{ min-width:52px; padding:10px 8px; }
.jkfab.is-min .jkfab-lb{ max-height:0; opacity:0; margin-top:-6px; }

@media (min-width:1024px){
  .jkfab{ bottom:32px; min-width:80px; max-width:96px; padding:14px 12px 13px; gap:7px; }
  .jkfab-ic{ width:36px; height:36px; }
  .jkfab-lb{ font-size:11px; max-height:34px; }
}

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
        className={`jkfab${min ? " is-min" : ""}${pop ? " is-pop" : ""}`}
      >
        <span className="jkfab-ic">
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
