import React, { useState, useEffect } from "react";

export interface ComicPost {
  title: string;
  slug: string;
  image: string;
  author: string;
  date: string;
}

interface Props {
  posts: ComicPost[];
}

export default function CartoonComicViewer({ posts }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  if (!posts || posts.length === 0) return null;

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % posts.length);
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + posts.length) % posts.length);
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > minSwipeDistance;
    const isDownSwipe = distance < -minSwipeDistance;
    if (isUpSwipe) {
      handleNext();
    } else if (isDownSwipe) {
      handlePrev();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing if the user is typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);

    // Native wheel scroll with passive: false to prevent page scrolling
    const el = containerRef.current;
    let isWheeling = false;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // Stay in place
      if (isWheeling) return;

      if (e.deltaY > 30) {
        handleNext();
        isWheeling = true;
        setTimeout(() => (isWheeling = false), 500); // Cooldown to prevent flying through pages
      } else if (e.deltaY < -30) {
        handlePrev();
        isWheeling = true;
        setTimeout(() => (isWheeling = false), 500);
      }
    };

    // Prevent page scroll during touch swiping
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    if (el) {
      el.addEventListener("wheel", handleWheel, { passive: false });
      el.addEventListener("touchmove", handleTouchMove, { passive: false });
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (el) {
        el.removeEventListener("wheel", handleWheel);
        el.removeEventListener("touchmove", handleTouchMove);
      }
    };
  }, [posts.length]);

  return (
    <div
      className="w-full max-w-[480px] sm:max-w-[550px] lg:max-w-[600px] mx-auto py-6 sm:py-12 px-4 sm:px-0 animate-glassFadeUp"
      style={{ animationDelay: "300ms" }}
    >
      {/* Editorial Header */}
      <div className="mb-4 flex items-end justify-between border-b-4 border-[#1a1a1a] pb-2">
        <h2 className="font-display font-black text-3xl sm:text-4xl text-[#1a1a1a] tracking-tight uppercase">
          CARTOON
        </h2>
        <div className="font-mono text-sm font-bold text-[#1a1a1a] bg-[#1a1a1a] text-white px-3 py-1 -mb-[2px] rounded-t-md">
          PAGE {String(currentIndex + 1).padStart(2, "0")} /{" "}
          {String(posts.length).padStart(2, "0")}
        </div>
      </div>

      {/* Comic Viewer Container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-square bg-[#f4f1e1] border-4 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a,12px_12px_0px_#ddd] sm:shadow-[8px_8px_0px_#1a1a1a,16px_16px_0px_#ddd] overflow-hidden group cursor-pointer transition-transform duration-300 hover:-translate-y-1"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Paper grain removed to significantly lessen lag and improve performance */}

        {/* Inner Cards for animation mapping */}
        {posts.map((post, idx) => {
          const distance = (idx - currentIndex + posts.length) % posts.length;

          const isActive = distance === 0;
          const isNext = distance === 1;
          const isNextNext = distance === 2;
          const isNextNextNext = distance === 3;
          const isPrev = distance === posts.length - 1;

          // Performance optimization: DO NOT render hidden cards in the DOM to eliminate lag
          if (
            !isActive &&
            !isNext &&
            !isNextNext &&
            !isNextNextNext &&
            !isPrev &&
            posts.length > 5
          ) {
            return null;
          }

          // Vertical Deck of cards offset logic
          let zIndex = 0;
          let opacity = 0;
          let transform = "translate(0, 100%) scale(0.95)";

          if (isActive) {
            zIndex = 10;
            opacity = 1;
            transform = "translate(0, 0) rotate(0deg) scale(1)";
          } else if (isNext) {
            zIndex = 9;
            opacity = 1;
            transform = "translate(0, 20px) rotate(3deg) scale(0.97)";
          } else if (isNextNext) {
            zIndex = 8;
            opacity = 1;
            transform = "translate(0, 40px) rotate(-2.5deg) scale(0.94)";
          } else if (isNextNextNext) {
            zIndex = 7;
            opacity = 1;
            transform = "translate(0, 60px) rotate(1.5deg) scale(0.91)";
          } else if (isPrev) {
            zIndex = 11; // Slide UP over the active card when swiping down (prev)
            opacity = 0; // Fade out as it slides up
            transform = "translate(0, -120%) rotate(-6deg) scale(0.95)";
          }

          return (
            <div
              key={post.slug}
              className="absolute inset-0 w-full h-full transition-all duration-[400ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
              style={{
                zIndex,
                opacity,
                transform,
                pointerEvents: isActive ? "auto" : "none",
              }}
            >
              {/* Ultra-minimal solid background instead of heavy blur to guarantee zero lag */}
              <div className="absolute inset-0 w-full h-full bg-[#f4f1e1]" />

              {/* Foreground Image Container */}
              <div className="absolute inset-0 w-full h-full px-3 pt-3 pb-12 sm:px-5 sm:pt-5 sm:pb-16 z-10 flex flex-col justify-between">
                <div className="relative w-full h-full bg-white border-4 border-[#1a1a1a] shadow-[6px_6px_0px_rgba(26,26,26,0.3)] overflow-hidden flex flex-col">
                  <a
                    href={`/posts/${post.slug}/`}
                    className="w-full h-full block flex-1 overflow-hidden relative group/img bg-white"
                  >
                    <img
                      src={post.image}
                      alt={post.title}
                      className="absolute inset-0 w-full h-full object-contain p-0 transition-transform duration-500 group-hover/img:scale-[1.02]"
                      draggable="false"
                    />
                  </a>
                  {/* Caption Bar inside the panel */}
                  <div className="bg-[#fcfbf9] border-t-4 border-[#1a1a1a] p-3 shrink-0 relative z-10">
                    <h3 className="font-display font-black text-sm sm:text-lg text-[#1a1a1a] line-clamp-2 leading-tight uppercase">
                      {post.title}
                    </h3>
                    <p className="font-mono font-bold text-[10px] sm:text-xs text-[#555] mt-1 uppercase">
                      BY {post.author} • {post.date}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Navigation Overlays - Vertical */}
        <button
          onClick={e => {
            e.stopPropagation();
            handlePrev();
          }}
          className="absolute right-2 sm:right-4 top-4 w-10 h-10 sm:w-12 sm:h-12 bg-[#fcfbf9] border-4 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] rounded-full flex items-center justify-center z-30 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#1a1a1a] hover:text-white hover:scale-110 active:scale-95 disabled:opacity-50"
          aria-label="Previous page"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="square"
            strokeLinejoin="miter"
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
        </button>

        <button
          onClick={e => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-2 sm:right-4 bottom-4 w-10 h-10 sm:w-12 sm:h-12 bg-[#fcfbf9] border-4 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] rounded-full flex items-center justify-center z-30 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#1a1a1a] hover:text-white hover:scale-110 active:scale-95"
          aria-label="Next page"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="square"
            strokeLinejoin="miter"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      <div className="mt-6 flex justify-between items-center px-2">
        <div className="font-mono font-bold text-[10px] sm:text-xs text-[#555] uppercase tracking-wider flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
          Swipe up/down to flip
        </div>
        <a
          href="/tags/cartoon"
          className="font-display font-black text-[10px] sm:text-xs uppercase text-[#1a1a1a] border-b-2 border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all px-2 py-1"
        >
          VIEW ALL ARCHIVES →
        </a>
      </div>
    </div>
  );
}
