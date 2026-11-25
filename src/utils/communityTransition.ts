/*
 * Site <-> Community transition.
 *
 * Going in:  the tapped button (floating chat button or a COMMUNITY link) expands into a
 *            full-screen navy circle, then /community/ loads and reveals the chat.
 * Coming out: /community/ hands back here and the navy cover collapses into the floating button.
 *
 * The two pages (this React site and the standalone /community/ page) pass a short-lived flag
 * through sessionStorage, so nothing is needed on the server.
 */

export const COMMUNITY_HREF = "/community/";

const FLAG = "jk-tr"; // { d: "in" | "out", t: timestamp }
const RETURN = "jk-return"; // the site page the person was on when they opened the chat
const NAVY = "#000E4B";
const EASE = "cubic-bezier(.7,0,.2,1)";

/** Two overlapping chat bubbles in white on navy (same artwork as the floating button). The three dots are animated (see DOT_CSS). */
export const CHAT_ICON_SVG =
  '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
  '<path fill="var(--jk-back,rgba(255,255,255,.5))" d="M11 6h22a7 7 0 0 1 7 7v10H22a8 8 0 0 0-8 8v3l-6 6V13a7 7 0 0 1 3-7z"/>' +
  '<path fill="#fff" d="M30 22h25a7 7 0 0 1 7 7v14a7 7 0 0 1-7 7h-5l-1 9-9-9H30a7 7 0 0 1-7-7V29a7 7 0 0 1 7-7z"/>' +
  '<circle class="jk-dot jk-d1" cx="34" cy="36" r="2.7" fill="#000E4B"/>' +
  '<circle class="jk-dot jk-d2" cx="43" cy="36" r="2.7" fill="#000E4B"/>' +
  '<circle class="jk-dot jk-d3" cx="52" cy="36" r="2.7" fill="#000E4B"/>' +
  "</svg>";

/**
 * Animation for the three chat dots.
 *  - Resting (floating button): a quick wave, then a calm pause, so it reads as "someone is typing"
 *    without pulling the eye while the person reads an article. It speeds up on hover.
 *  - Inside a transition cover (.jk-fast): a continuous wave.
 * Numbers are SVG user units (the icon's viewBox is 64 wide). Respects prefers-reduced-motion.
 */
export const DOT_CSS =
  ".jk-dot{transform-box:fill-box;transform-origin:center;animation:jkDot 2.6s cubic-bezier(.4,0,.2,1) infinite backwards}" +
  ".jk-d2{animation-delay:.14s}.jk-d3{animation-delay:.28s}" +
  "@keyframes jkDot{0%,26%,100%{transform:translateY(0) scale(1)}13%{transform:translateY(-4px) scale(1.2)}}" +
  ".jk-fast .jk-dot{animation-name:jkDotFast;animation-duration:1.1s}" +
  ".jk-fast .jk-d2{animation-delay:.15s}.jk-fast .jk-d3{animation-delay:.3s}" +
  "@keyframes jkDotFast{0%,60%,100%{transform:translateY(0) scale(1);opacity:.45}30%{transform:translateY(-5px) scale(1.2);opacity:1}}" +
  "@keyframes jkIcPop{from{opacity:0;transform:scale(.55)}to{opacity:1;transform:none}}" +
  ".jk-pop{animation:jkIcPop .5s cubic-bezier(.34,1.56,.64,1) .1s both}" +
  "@media (prefers-reduced-motion:reduce){.jk-dot,.jk-pop{animation:none!important;opacity:1}}" +
  // The site has a global `svg { width/height: 1.5rem }` rule (base.css). Without this the icon on the
  // cover renders at 24px instead of 76px, which looks like the icon shrinking mid-transition.
  "[data-jk-cover] svg{width:100%!important;height:100%!important;max-width:none!important;display:block!important}";

const COVER_CSS =
  "position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;pointer-events:auto;" +
  `background:radial-gradient(120% 90% at 50% 40%,#0a1f8a 0%,${NAVY} 70%);--jk-back:rgba(255,255,255,.5);`;

function ensureDotStyles() {
  if (document.getElementById("jk-dot-css")) return;
  const s = document.createElement("style");
  s.id = "jk-dot-css";
  s.textContent = DOT_CSS;
  document.head.appendChild(s);
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** True for a normal left click, so new-tab clicks (Ctrl/Cmd/Shift/middle) keep working. */
export function isPlainLeftClick(e: {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented?: boolean;
}): boolean {
  return (
    !e.defaultPrevented &&
    e.button === 0 &&
    !e.metaKey &&
    !e.ctrlKey &&
    !e.shiftKey &&
    !e.altKey
  );
}

/** @param pop the icon springs in while the circle grows (leaving a page); false when it must already be in place (arriving). */
function buildCover(pop: boolean): HTMLDivElement {
  ensureDotStyles();
  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  el.setAttribute("data-jk-cover", "");
  el.className = "jk-fast";
  el.style.cssText = COVER_CSS;
  const icon = document.createElement("div");
  icon.className = pop ? "jk-pop" : "";
  icon.style.cssText = "width:76px;height:76px";
  icon.innerHTML = CHAT_ICON_SVG;
  el.appendChild(icon);
  return el;
}

function radiusFrom(x: number, y: number): number {
  return Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 4;
}

/** Expand a navy circle from (x, y), then open the community chat. */
export function openCommunity(origin: { x: number; y: number }) {
  try {
    sessionStorage.setItem(FLAG, JSON.stringify({ d: "in", t: Date.now() }));
    sessionStorage.setItem(RETURN, location.pathname + location.search + location.hash);
  } catch {
    /* storage can be blocked; the page still opens */
  }

  let started = false;
  const go = () => {
    if (started) return;
    started = true;
    window.location.href = COMMUNITY_HREF;
  };

  if (prefersReducedMotion() || typeof document.body.animate !== "function") {
    go();
    return;
  }

  const cover = buildCover(true);
  document.body.appendChild(cover);
  const { x, y } = origin;
  const anim = cover.animate(
    [
      { clipPath: `circle(0px at ${x}px ${y}px)` },
      { clipPath: `circle(${radiusFrom(x, y)}px at ${x}px ${y}px)` },
    ],
    { duration: 520, easing: EASE, fill: "forwards" }
  );
  anim.onfinish = go;
  setTimeout(go, 1000); // safety net if the animation never reports finished
}

/**
 * Inline script that runs while the page is still being parsed. When the person is coming back
 * from the chat it paints the real cover (navy + the animated chat icon, identical to the one on
 * the chat page) immediately, so the site never flashes before the collapse animation starts and
 * the icon never pops in late. `playArrival` takes this same element over and collapses it;
 * a timer removes it anyway if no floating button ever mounts.
 */
export const ARRIVE_SCRIPT =
  "(function(){try{var t=JSON.parse(sessionStorage.getItem(" +
  JSON.stringify(FLAG) +
  ")||'null');if(!(t&&t.d==='out'&&Date.now()-t.t<10000))return;" +
  "var h=document.documentElement;h.classList.add('jk-arrive');" +
  "var s=document.createElement('style');s.id='jk-dot-css';s.textContent=" +
  JSON.stringify(DOT_CSS) +
  ";(document.head||h).appendChild(s);" +
  "var c=document.createElement('div');c.id='jk-arrive-cover';c.className='jk-fast';" +
  "c.setAttribute('data-jk-cover','');c.setAttribute('aria-hidden','true');c.style.cssText=" +
  JSON.stringify(COVER_CSS) +
  ";c.innerHTML=" +
  JSON.stringify('<div style="width:76px;height:76px">' + CHAT_ICON_SVG + "</div>") +
  ";h.appendChild(c);" +
  "setTimeout(function(){h.classList.remove('jk-arrive');var x=document.getElementById('jk-arrive-cover');if(x)x.remove()},2500)" +
  "}catch(e){}})();";

/**
 * Called once the floating button is on screen. If the person just left the chat, collapse the
 * navy cover into the button. Returns true when an arrival animation played.
 */
export function playArrival(target: { x: number; y: number }, onDone?: () => void): boolean {
  let flag: { d?: string; t?: number } | null = null;
  try {
    flag = JSON.parse(sessionStorage.getItem(FLAG) || "null");
  } catch {
    flag = null;
  }
  const root = document.documentElement;

  if (!flag || flag.d !== "out" || Date.now() - (flag.t || 0) > 10000) {
    root.classList.remove("jk-arrive");
    return false;
  }
  try {
    sessionStorage.removeItem(FLAG);
  } catch {
    /* ignore */
  }

  if (prefersReducedMotion() || typeof document.body.animate !== "function") {
    clearCovers();
    onDone?.();
    return true;
  }

  // Reuse the cover the inline script already painted (no swap, so no flicker); build one if it is missing.
  let cover = document.getElementById("jk-arrive-cover") as HTMLDivElement | null;
  if (cover) {
    cover.removeAttribute("id");
  } else {
    cover = buildCover(false);
    document.body.appendChild(cover);
  }
  root.classList.remove("jk-arrive");
  const { x, y } = target;
  const anim = cover.animate(
    [
      { clipPath: `circle(${radiusFrom(x, y)}px at ${x}px ${y}px)` },
      { clipPath: `circle(0px at ${x}px ${y}px)` },
    ],
    { duration: 560, easing: EASE, delay: 120, fill: "forwards" }
  );
  const finish = () => {
    cover!.remove();
    onDone?.();
  };
  anim.onfinish = finish;
  setTimeout(finish, 1400);
  return true;
}

/** Remove any leftover cover (for example when the browser restores the page from its back-forward cache). */
export function clearCovers() {
  document.querySelectorAll("[data-jk-cover]").forEach(n => n.remove());
  document.documentElement.classList.remove("jk-arrive");
}
