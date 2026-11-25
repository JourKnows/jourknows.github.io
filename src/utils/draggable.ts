/*
 * Drag the floating buttons anywhere on screen, as ONE group.
 *
 * Every floating pill registers itself here. Dragging any of them moves all of them together,
 * keeping their stacking. The shared offset lives in two CSS variables on <html>
 * (--jk-gx / --jk-gy, in px, added to each pill's right / bottom), so pills that are mounted
 * separately (the Community chat on every page, "Stories for you" on the home page) stay in sync,
 * and the position is remembered in localStorage.
 *
 * A short press-and-move (more than a few pixels) drags; a plain tap or click still opens the pill.
 * Returns a cleanup function.
 */
const KEY = "jk-fab-group";
const THRESHOLD = 6; // px of movement before a press becomes a drag
const EDGE = 4; // px kept between the group and the screen edge

const group = new Set<HTMLElement>();
let gx = 0; // how far the group has moved left of its default spot
let gy = 0; // how far the group has moved up from its default spot
let loaded = false;
let swallowClick = false;

const root = () => document.documentElement;
const vw = () => root().clientWidth || window.innerWidth;
const vh = () => window.innerHeight;

function setOffset(x: number, y: number) {
  gx = x;
  gy = y;
  root().style.setProperty("--jk-gx", x + "px");
  root().style.setProperty("--jk-gy", y + "px");
}

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    if (v && typeof v.x === "number" && typeof v.y === "number") setOffset(v.x, v.y);
  } catch {
    /* ignore */
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ x: gx, y: gy }));
  } catch {
    /* storage can be blocked; the position just isn't remembered */
  }
}

/** Bounding box of every pill currently on screen. */
function union() {
  let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
  group.forEach(el => {
    if (!el.isConnected) return;
    const q = el.getBoundingClientRect();
    if (!q.width) return;
    l = Math.min(l, q.left);
    t = Math.min(t, q.top);
    r = Math.max(r, q.right);
    b = Math.max(b, q.bottom);
  });
  return isFinite(l) ? { l, t, r, b } : null;
}

/** Largest screen movement (dx, dy) that keeps the whole group on screen. */
function clampMove(u: { l: number; t: number; r: number; b: number }, dx: number, dy: number) {
  return {
    dx: Math.min(Math.max(dx, EDGE - u.l), vw() - EDGE - u.r),
    dy: Math.min(Math.max(dy, EDGE - u.t), vh() - EDGE - u.b),
  };
}

function keepOnScreen() {
  const u = union();
  if (!u || (gx === 0 && gy === 0)) return;
  const m = clampMove(u, 0, 0);
  if (m.dx || m.dy) setOffset(gx - m.dx, gy - m.dy);
}

let resizeBound = false;

export function makeDraggable(el: HTMLElement, opts: { ignore?: string } = {}): () => void {
  load();
  group.add(el);
  el.style.touchAction = "none";
  if (!resizeBound) {
    resizeBound = true;
    window.addEventListener("resize", keepOnScreen);
  }
  requestAnimationFrame(keepOnScreen);

  let startX = 0;
  let startY = 0;
  let startGx = 0;
  let startGy = 0;
  let box: { l: number; t: number; r: number; b: number } | null = null;
  let pid = -1;
  let dragging = false;

  const onMove = (e: PointerEvent) => {
    if (e.pointerId !== pid || !box) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!dragging) {
      if (Math.hypot(dx, dy) < THRESHOLD) return;
      dragging = true;
      group.forEach(n => n.classList.add("is-drag"));
    }
    e.preventDefault();
    const m = clampMove(box, dx, dy);
    setOffset(startGx - m.dx, startGy - m.dy);
  };

  const end = (e: PointerEvent) => {
    if (e.pointerId !== pid) return;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
    pid = -1;
    if (dragging) {
      dragging = false;
      group.forEach(n => n.classList.remove("is-drag"));
      save();
      swallowClick = true; // the click that follows a drag must not open the pill
      window.setTimeout(() => (swallowClick = false), 60);
    }
  };

  const onDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (opts.ignore && (e.target as Element).closest(opts.ignore)) return;
    box = union();
    if (!box) return;
    startX = e.clientX;
    startY = e.clientY;
    startGx = gx;
    startGy = gy;
    pid = e.pointerId;
    dragging = false;
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  const onClickCapture = (e: Event) => {
    if (!swallowClick) return;
    swallowClick = false;
    e.preventDefault();
    e.stopPropagation();
  };

  const noGhost = (e: Event) => e.preventDefault(); // stops the browser's link-drag ghost image

  el.addEventListener("pointerdown", onDown);
  el.addEventListener("click", onClickCapture, true);
  el.addEventListener("dragstart", noGhost);

  return () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
    el.removeEventListener("pointerdown", onDown);
    el.removeEventListener("click", onClickCapture, true);
    el.removeEventListener("dragstart", noGhost);
    el.classList.remove("is-drag");
    group.delete(el);
  };
}
