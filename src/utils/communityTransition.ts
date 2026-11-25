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

/** Two overlapping chat bubbles (same artwork as the floating button). */
export const CHAT_ICON_SVG =
  '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
  '<path fill="var(--jk-back,#6C6E8F)" d="M11 6h22a7 7 0 0 1 7 7v10H22a8 8 0 0 0-8 8v3l-6 6V13a7 7 0 0 1 3-7z"/>' +
  '<path fill="#E8683B" d="M30 22h25a7 7 0 0 1 7 7v14a7 7 0 0 1-7 7h-5l-1 9-9-9H30a7 7 0 0 1-7-7V29a7 7 0 0 1 7-7z"/>' +
  '<circle cx="34" cy="36" r="2.7" fill="#fff"/><circle cx="43" cy="36" r="2.7" fill="#fff"/><circle cx="52" cy="36" r="2.7" fill="#fff"/>' +
  "</svg>";

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

function buildCover(): HTMLDivElement {
  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  el.setAttribute("data-jk-cover", "");
  el.style.cssText =
    "position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;pointer-events:auto;" +
    `background:radial-gradient(120% 90% at 50% 40%,#0a1f8a 0%,${NAVY} 70%);--jk-back:#B7B9DE;`;
  const icon = document.createElement("div");
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

  const cover = buildCover();
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
 * from the chat it paints the navy cover immediately, so the site never flashes before the
 * collapse animation starts. `CommunityFab` removes it on mount (and a timer removes it anyway).
 */
export const ARRIVE_SCRIPT =
  "(function(){try{var t=JSON.parse(sessionStorage.getItem('" +
  FLAG +
  "')||'null');if(t&&t.d==='out'&&Date.now()-t.t<10000){var h=document.documentElement;h.classList.add('jk-arrive');" +
  "var s=document.createElement('style');s.id='jk-arrive-css';" +
  "s.textContent='html.jk-arrive::before{content:\"\";position:fixed;inset:0;z-index:2147483000;background:" +
  NAVY +
  "}';document.head.appendChild(s);" +
  "setTimeout(function(){h.classList.remove('jk-arrive')},2500)}}catch(e){}})();";

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
    root.classList.remove("jk-arrive");
    onDone?.();
    return true;
  }

  const cover = buildCover();
  document.body.appendChild(cover);
  root.classList.remove("jk-arrive"); // the real cover is now in place, same look, no flicker
  const { x, y } = target;
  const anim = cover.animate(
    [
      { clipPath: `circle(${radiusFrom(x, y)}px at ${x}px ${y}px)` },
      { clipPath: `circle(0px at ${x}px ${y}px)` },
    ],
    { duration: 560, easing: EASE, delay: 120, fill: "forwards" }
  );
  const finish = () => {
    cover.remove();
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
