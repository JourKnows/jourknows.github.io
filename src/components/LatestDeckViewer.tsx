import React, { useState, useEffect, useCallback, useRef } from "react";

export interface LatestPost {
  title: string;
  slug: string;
  image: string | null;
  author: string;
  date: string;
  tag: string;
  description: string;
}

interface Props {
  posts: LatestPost[];
}

type Direction = "next" | "prev";

const DECK_COUNT = 8;

export default function LatestDeckViewer({ posts }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<Direction>("next");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isRestored, setIsRestored] = useState(false);
  const [textVisible, setTextVisible] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [luckySpinning, setLuckySpinning] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [dragDelta, setDragDelta] = useState(0);
  const [hasSwiped, setHasSwiped] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  if (!posts || posts.length === 0) return null;

  const deckPosts = posts.slice(0, DECK_COUNT);

  useEffect(() => {
    const savedSlug = sessionStorage.getItem("jourknows_deck_slug");
    if (savedSlug) {
      const idx = deckPosts.findIndex(p => p.slug === savedSlug);
      if (idx !== -1) setCurrentIndex(idx);
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsRestored(true);
      });
    });
  }, [deckPosts]);

  useEffect(() => {
    if (isRestored && deckPosts[currentIndex]) {
      sessionStorage.setItem(
        "jourknows_deck_slug",
        deckPosts[currentIndex].slug
      );
    }
  }, [currentIndex, deckPosts, isRestored]);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
  };

  const playTickSound = (pitch: number = 1, volume: number = 0.1) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === "suspended") ctx.resume();

    // Create a very short, satisfying mechanical "tick" or "click"
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Tick sound characteristics
    osc.type = "triangle";
    // Frequency drops rapidly
    osc.frequency.setValueAtTime(800 * pitch, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      100 * pitch,
      ctx.currentTime + 0.05
    );

    // Very sharp volume envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  };

  const playDingSound = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") ctx.resume();

    // Satisfying bell/ding sound for the final landing
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1108.73, ctx.currentTime); // C#6

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 1.5);
    osc2.stop(ctx.currentTime + 1.5);
  };

  const goTo = useCallback(
    (nextIdx: number, dir: Direction = "next", instant: boolean = false) => {
      if ((isTransitioning && !instant) || nextIdx === currentIndex) return;
      setDirection(dir);

      if (instant) {
        setPrevIndex(currentIndex);
        setCurrentIndex(nextIdx);
        setTimeout(() => setPrevIndex(null), 50);
        return;
      }

      setIsTransitioning(true);
      setPrevIndex(currentIndex);
      setCurrentIndex(nextIdx);
      setTimeout(() => {
        setPrevIndex(null);
        setIsTransitioning(false);
      }, 350);
    },
    [currentIndex, isTransitioning]
  );

  const handleNext = useCallback(() => {
    goTo((currentIndex + 1) % deckPosts.length, "next");
  }, [currentIndex, deckPosts.length, goTo]);

  const handlePrev = useCallback(() => {
    goTo((currentIndex - 1 + deckPosts.length) % deckPosts.length, "prev");
  }, [currentIndex, deckPosts.length, goTo]);

  // Autoplay — pause when expanded or spinning
  const resetAutoplay = useCallback(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    if (!expanded && !luckySpinning) {
      autoplayRef.current = setInterval(handleNext, 10000);
    }
  }, [handleNext, expanded, luckySpinning]);

  useEffect(() => {
    resetAutoplay();
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [resetAutoplay]);

  // Touch & Mouse swipe handling
  const minSwipeDistance = 40;
  const handleSwipeStart = (clientX: number, clientY: number) => {
    if (luckySpinning || isTransitioning) return;
    setTouchEnd(null);
    setDragDelta(0);
    setTouchStart(isMobile ? clientY : clientX);
  };
  const handleSwipeMove = (clientX: number, clientY: number) => {
    if (luckySpinning || touchStart === null) return;
    const current = isMobile ? clientY : clientX;
    setTouchEnd(current);
    setDragDelta(current - touchStart);
  };
  const handleSwipeEnd = () => {
    if (luckySpinning || touchStart === null) {
      setTouchStart(null);
      setDragDelta(0);
      return;
    }
    if (dragDelta < -minSwipeDistance) {
      handleNext();
      resetAutoplay();
      setHasSwiped(true);
    } else if (dragDelta > minSwipeDistance) {
      handlePrev();
      resetAutoplay();
      setHasSwiped(true);
    }
    setTouchStart(null);
    setTouchEnd(null);
    setDragDelta(0);
  };

  const onTouchStart = (e: React.TouchEvent) =>
    handleSwipeStart(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) =>
    handleSwipeMove(e.targetTouches[0].clientX, e.targetTouches[0].clientY);

  const onMouseDown = (e: React.MouseEvent) =>
    handleSwipeStart(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) =>
    handleSwipeMove(e.clientX, e.clientY);

  // Keyboard + wheel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        luckySpinning ||
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      )
        return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        handleNext();
        resetAutoplay();
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        handlePrev();
        resetAutoplay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    const el = containerRef.current;
    let wheelCooldown = false;
    const handleWheel = (e: WheelEvent) => {
      if (wheelCooldown || expanded || luckySpinning) return;
      if (Math.abs(e.deltaY) < 25) return;
      e.preventDefault();
      if (e.deltaY > 0) handleNext();
      else handlePrev();
      resetAutoplay();
      wheelCooldown = true;
      setTimeout(() => (wheelCooldown = false), 450);
    };

    if (el) el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (el) el.removeEventListener("wheel", handleWheel);
    };
  }, [handleNext, handlePrev, resetAutoplay, expanded, luckySpinning]);

  // Slide styles - customized for spin state
  const getSlideStyle = (idx: number): React.CSSProperties => {
    const isActive = idx === currentIndex;
    const isLeaving = idx === prevIndex;
    const isNext = idx === (currentIndex + 1) % deckPosts.length;
    const isPrev =
      idx === (currentIndex - 1 + deckPosts.length) % deckPosts.length;

    const translate3d = (val: string | number) => {
      const v = typeof val === "number" ? `${val}px` : val;
      return isMobile ? `translate3d(0, ${v}, 0)` : `translate3d(${v}, 0, 0)`;
    };

    if (luckySpinning) {
      if (isActive) {
        return {
          zIndex: 2,
          transform: `${translate3d(0)} scale(1)`,
          opacity: 1,
          transition: "transform 0.1s linear, opacity 0.1s linear",
          willChange: "transform",
        };
      }
      if (isLeaving) {
        return {
          zIndex: 1,
          transform: `${translate3d("-100%")} scale(0.9)`,
          opacity: 0.5,
          transition: "transform 0.1s linear, opacity 0.1s linear",
          willChange: "transform",
        };
      }
      return {
        zIndex: 0,
        transform: `${translate3d("100%")} scale(0.9)`,
        opacity: 0,
        transition: "none",
        willChange: "transform",
      };
    }

    const trans = isRestored
      ? "transform 0.35s cubic-bezier(0.1, 0.9, 0.2, 1)"
      : "none";

    // When NOT dragging
    if (touchStart === null) {
      if (isActive) {
        return {
          zIndex: 2,
          transform: translate3d(0),
          opacity: 1,
          transition: trans,
          willChange: "transform",
        };
      }
      if (isLeaving) {
        const offset = direction === "next" ? "-100%" : "100%";
        return {
          zIndex: 2,
          transform: translate3d(offset),
          opacity: 1,
          transition: trans,
          willChange: "transform",
        };
      }
      const hiddenOffset = direction === "next" ? "100%" : "-100%";
      return {
        zIndex: 0,
        transform: translate3d(hiddenOffset),
        opacity: 1,
        transition: trans,
        pointerEvents: "none",
        willChange: "transform",
      };
    }

    // When DRAGGING (1:1 physical follow)
    if (isActive) {
      return {
        zIndex: 2,
        transform: translate3d(dragDelta),
        opacity: 1,
        transition: "none",
        willChange: "transform",
      };
    }
    if (isNext && dragDelta < 0) {
      return {
        zIndex: 2,
        transform: translate3d(`calc(100% + ${dragDelta}px)`),
        opacity: 1,
        transition: "none",
        willChange: "transform",
      };
    }
    if (isPrev && dragDelta > 0) {
      return {
        zIndex: 2,
        transform: translate3d(`calc(-100% + ${dragDelta}px)`),
        opacity: 1,
        transition: "none",
        willChange: "transform",
      };
    }
    return {
      zIndex: 0,
      transform: translate3d("100%"),
      opacity: 1,
      transition: "none",
      pointerEvents: "none",
      willChange: "transform",
    };
  };

  const textStagger = (delay: number): React.CSSProperties => {
    const translate3d = (val: string | number) => {
      const v = typeof val === "number" ? `${val}px` : val;
      return isMobile ? `translate3d(0, ${v}, 0)` : `translate3d(${v}, 0, 0)`;
    };
    return {
      opacity: textVisible && !luckySpinning ? 1 : 0,
      transform:
        textVisible && !luckySpinning ? translate3d(0) : translate3d(12),
      transition: luckySpinning
        ? "none"
        : `opacity 0.35s cubic-bezier(0.1, 0.9, 0.2, 1) ${delay * 0.5}s, transform 0.35s cubic-bezier(0.1, 0.9, 0.2, 1) ${delay * 0.5}s`,
      willChange: "opacity, transform",
    };
  };

  const triggerLuckySpin = () => {
    if (luckySpinning) return;
    initAudio();
    setLuckySpinning(true);
    setExpanded(false);
    setTextVisible(false);

    let step = 0;
    // Total spins: 20-30 frames
    const totalSteps = 20 + Math.floor(Math.random() * 10);
    // Final target post from ALL posts
    const finalIdx = Math.floor(Math.random() * posts.length);

    // If finalIdx is outside the deck, temporarily append it to the deck for the reveal
    // (We handle this implicitly since we'll just set currentIndex to finalIdx,
    // and we map over 'posts' or 'deckPosts'. We should map over ALL posts when spinning
    // so the final one is available).

    const spin = () => {
      step++;
      if (step < totalSteps) {
        // Fast random cycling
        const randomIdx = Math.floor(Math.random() * posts.length);

        // Pitch goes down as it slows
        const progress = step / totalSteps;
        const pitch = 1.5 - progress * 0.8;
        const volume = 0.05 + progress * 0.05;
        playTickSound(pitch, volume);

        // Instant switch
        setPrevIndex(currentIndex);
        setCurrentIndex(randomIdx);
        setTimeout(() => setPrevIndex(null), 30);

        // Decelerate curve: very fast at first, exponentially slower
        // Starts around 40ms, ends around 400ms
        const delay = 40 + Math.pow(progress, 3) * 360;
        setTimeout(spin, delay);
      } else {
        // Land on the final random post
        playDingSound();
        setCurrentIndex(finalIdx);
        setTextVisible(true);

        // Navigate after a dramatic pause
        setTimeout(() => {
          window.location.href = `/posts/${posts[finalIdx].slug}/`;
        }, 1200);
      }
    };

    // Start spin
    spin();
  };

  // When spinning, we map over ALL posts so the final random one is available in the DOM.
  // When not spinning, we map over deckPosts for performance.
  const displayPosts = luckySpinning ? posts : deckPosts;

  return (
    <div className="w-full">
      {/* Full-bleed deck */}
      <div
        ref={containerRef}
        className={`relative w-full h-[75vh] min-h-[340px] max-h-[580px] sm:max-h-[480px] lg:max-h-[540px] overflow-hidden group bg-[#0a0a14] touch-pan-x sm:touch-pan-y cursor-grab active:cursor-grabbing ${
          luckySpinning ? "pointer-events-none" : ""
        }`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={handleSwipeEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={handleSwipeEnd}
        onMouseLeave={handleSwipeEnd}
      >
        {displayPosts.map((post, idx) => {
          const isActive = idx === currentIndex;

          return (
            <div
              key={post.slug + idx}
              className="absolute inset-0 w-full h-full"
              style={getSlideStyle(idx)}
            >
              <a
                href={`/posts/${post.slug}/`}
                className="absolute inset-0 w-full h-full block no-underline"
                onClick={e => luckySpinning && e.preventDefault()}
              >
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    draggable="false"
                    style={{
                      animation:
                        isActive && !luckySpinning
                          ? "latestKenBurns 16s ease-in-out both"
                          : "none",
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#00046d] to-[#314DEB]" />
                )}

                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.3) 35%, rgba(0,0,0,0.05) 65%, transparent 100%)",
                  }}
                />

                {/* Hide text entirely while spinning for cleaner slot machine effect */}
                {!luckySpinning && (
                  <div className="absolute bottom-0 left-0 right-0 z-10 px-5 sm:px-8 lg:px-14 pb-6 sm:pb-10 lg:pb-12">
                    <div style={textStagger(0.12)}>
                      <span className="inline-block bg-white/95 px-3 py-[3px] rounded-[3px] mb-3 shadow-sm">
                        <span className="font-display font-extrabold text-[10px] sm:text-[11px] text-[#00046d] uppercase tracking-wider">
                          {post.tag}
                        </span>
                      </span>
                    </div>

                    <h3
                      className="font-display font-black text-[22px] sm:text-[30px] lg:text-[40px] text-white leading-[1.1] mb-2 sm:mb-3 line-clamp-3 max-w-[850px]"
                      style={{
                        ...textStagger(0.22),
                        textShadow: "0 2px 16px rgba(0,0,0,0.25)",
                      }}
                    >
                      {post.title}
                    </h3>

                    <p
                      className="font-display text-[13px] sm:text-[15px] text-white/80 leading-[1.5] line-clamp-2 mb-3 sm:mb-4 max-w-[620px] hidden sm:block"
                      style={textStagger(0.32)}
                    >
                      {post.description}
                    </p>

                    <div
                      className="flex items-center justify-between"
                      style={textStagger(0.4)}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
                          <span className="text-white text-[11px] font-bold">
                            {post.author.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-display font-semibold text-[12px] sm:text-[13px] text-white/95 leading-tight">
                            {post.author}
                          </span>
                          <span className="font-mono font-medium text-[10px] sm:text-[11px] text-white/55 leading-tight">
                            {post.date}
                          </span>
                        </div>
                      </div>
                      <span className="shrink-0 border border-white/40 text-white uppercase rounded-full px-4 py-1.5 sm:px-5 sm:py-2 font-display font-bold text-[10px] sm:text-[11px] tracking-wider hover:bg-white hover:text-[#00046d] transition-colors duration-300 bg-white/5">
                        READ MORE
                      </span>
                    </div>
                  </div>
                )}

                {/* Spin overlay effect */}
                {luckySpinning && (
                  <div className="absolute inset-0 bg-[#00046d]/20 mix-blend-overlay pointer-events-none" />
                )}
              </a>
            </div>
          );
        })}

        {/* Mobile vertical swipe indicator */}
        {!luckySpinning && (
          <div
            className={`absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-2 z-30 sm:hidden pointer-events-none bg-black/25 rounded-full py-4 px-1.5 backdrop-blur-[2px] border border-white/10 shadow-lg transition-opacity duration-500 ${hasSwiped ? "opacity-0" : "opacity-70"}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-[bounce_2s_infinite]"
            >
              <path d="m18 15-6-6-6 6" />
            </svg>
            <span
              className="text-white text-[10px] font-display font-black tracking-[0.2em] uppercase mt-1 mb-1"
              style={{ writingMode: "vertical-rl" }}
            >
              SWIPE
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-[bounce_2s_infinite]"
              style={{ animationDelay: "1s" }}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        )}

        {/* Navigation arrows - hidden during spin */}
        {!luckySpinning && (
          <>
            <button
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                handlePrev();
                resetAutoplay();
              }}
              className="absolute left-3 sm:left-5 lg:left-7 top-1/2 -translate-y-1/2 w-11 h-11 bg-black/25 border border-white/15 rounded-full hidden sm:flex items-center justify-center z-30 opacity-100 transition-all duration-300 hover:bg-white/90 hover:text-[#00046d] hover:border-white active:scale-90 text-white/80"
              aria-label="Previous article"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                handleNext();
                resetAutoplay();
              }}
              className="absolute right-3 sm:right-5 lg:right-7 top-1/2 -translate-y-1/2 w-11 h-11 bg-black/25 border border-white/15 rounded-full hidden sm:flex items-center justify-center z-30 opacity-100 transition-all duration-300 hover:bg-white/90 hover:text-[#00046d] hover:border-white active:scale-90 text-white/80"
              aria-label="Next article"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </>
        )}

        {/* Progress bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[5px] z-20"
          style={{ background: "rgba(0,4,109,0.18)" }}
        >
          {!luckySpinning && (
            <div
              key={currentIndex}
              className="h-full"
              style={{
                background: "linear-gradient(to right, #00046d, #314DEB)",
                boxShadow: "2px 0 12px 2px rgba(49,77,235,0.7)",
                animation: expanded
                  ? "none"
                  : "latestProgress 10s cubic-bezier(0.25, 0.1, 0.1, 1) both",
              }}
            />
          )}
        </div>
      </div>

      {/* Footer bar with EXPAND and LUCKY */}
      <div className="px-4 sm:px-8 lg:px-14 py-3 sm:py-4 flex items-center justify-between bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.04)] relative z-30">
        {/* Left: Expand Button */}
        <div className="flex-1 flex justify-start">
          <button
            onClick={() => setExpanded(prev => !prev)}
            disabled={luckySpinning}
            className={`font-display font-extrabold text-[10px] sm:text-[11px] tracking-wider uppercase w-9 h-9 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 rounded-full no-underline transition-all duration-300 flex items-center justify-center gap-2 ${
              luckySpinning
                ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                : "text-[#1e1e1e] bg-black/[0.03] hover:bg-black/[0.06] active:scale-95 cursor-pointer"
            }`}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
            <span className="hidden sm:inline">
              {expanded ? "COLLAPSE" : "EXPAND"}
            </span>
          </button>
        </div>

        {/* Center: Title */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center pointer-events-none">
          <div className="bg-[#f4f6ff] border border-[#0007d3]/10 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full flex items-center gap-2 sm:gap-2.5 shadow-[0_2px_12px_rgba(0,7,211,0.06)] backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0007d3] opacity-60"></span>
              <span className="relative inline-flex rounded-full h-full w-full bg-[#0007d3]"></span>
            </span>
            <h2 className="font-display font-black text-[11px] sm:text-[13px] tracking-[0.2em] text-[#0007d3] uppercase mt-[1px]">
              LATEST
            </h2>
          </div>
        </div>

        {/* Right: Lucky Spin Button */}
        <div className="flex-1 flex justify-end">
          <button
            onClick={triggerLuckySpin}
            disabled={luckySpinning}
            className={`group font-display font-extrabold text-[10px] sm:text-[11px] tracking-wider uppercase w-9 h-9 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 rounded-full no-underline transition-all duration-300 flex items-center justify-center gap-2 ${
              luckySpinning
                ? "bg-gradient-to-r from-[#0007d3] to-[#ff0050] text-white shadow-[0_4px_16px_rgba(255,0,80,0.3)] scale-105 cursor-not-allowed"
                : "bg-[#1e1e1e] text-white shadow-md hover:bg-[#FFD700] hover:text-[#1e1e1e] hover:shadow-[0_0_20px_rgba(255,215,0,0.5)] active:scale-95 cursor-pointer"
            }`}
            aria-label="I'm feeling lucky"
          >
            {luckySpinning ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-spin"
              >
                <path d="M21 12a9 9 0 1 1-6.22-8.56" />
              </svg>
            ) : (
              <span className="text-[14px] leading-none">☘️</span>
            )}
            <span className="hidden sm:inline">
              {luckySpinning ? "SPINNING..." : "FEELING LUCKY"}
            </span>
          </button>
        </div>
      </div>

      {/* Expanded article grid */}
      <div
        className="overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          maxHeight: expanded ? `${posts.length * 120}px` : "0px",
          opacity: expanded ? 1 : 0,
        }}
      >
        <div className="bg-white px-5 sm:px-8 lg:px-14 pb-6 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {posts.map((post, idx) => (
              <a
                key={post.slug + idx + "_grid"}
                href={`/posts/${post.slug}/`}
                className="flex gap-3 sm:gap-4 py-3 border-b border-black/5 last:border-b-0 no-underline group/item transition-colors duration-300 hover:bg-[#f8f9ff] rounded-lg px-2 -mx-2"
              >
                {/* Thumbnail */}
                <div className="w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] rounded-lg overflow-hidden shrink-0 bg-[#e5e7eb]">
                  {post.image ? (
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#c7d2fe] to-[#6366f1] flex items-center justify-center">
                      <span className="font-display font-bold text-lg text-white/50">
                        {post.tag.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span className="font-display font-extrabold text-[9px] sm:text-[10px] text-[#00046d] uppercase tracking-wider mb-1">
                    {post.tag}
                  </span>
                  <h4 className="font-display font-bold text-[13px] sm:text-[14px] text-[#1a1a1a] leading-[1.3] line-clamp-2 mb-1 group-hover/item:text-[#00046d] transition-colors duration-300">
                    {post.title}
                  </h4>
                  <span className="font-mono text-[10px] text-[#888]">
                    {post.author} · {post.date}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes latestKenBurns {
          0% { transform: scale(1.0); }
          100% { transform: scale(1.07); }
        }
        @keyframes latestProgress {
          0% { width: 0%; opacity: 0.7; }
          5% { opacity: 1; }
          90% { opacity: 1; }
          100% { width: 100%; opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
