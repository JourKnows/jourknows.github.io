import React, { useState, useRef } from "react";

interface Props {
  title: string;
  slug: string;
  author: string;
  date: string;
  description: string;
  images: string[];
}

export default function ExplainerGallery({
  title,
  slug,
  author,
  date,
  description,
  images,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    // Calculate which image is mostly in view
    const scrollPosition = el.scrollLeft;
    const width = el.clientWidth;
    const index = Math.round(scrollPosition / width);
    if (index !== currentIndex && index >= 0 && index < images.length) {
      setCurrentIndex(index);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (scrollRef.current && currentIndex < images.length - 1) {
      scrollRef.current.scrollTo({
        left: (currentIndex + 1) * scrollRef.current.clientWidth,
        behavior: "smooth",
      });
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    if (scrollRef.current && currentIndex > 0) {
      scrollRef.current.scrollTo({
        left: (currentIndex - 1) * scrollRef.current.clientWidth,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="bg-[#fafafa] rounded-2xl overflow-hidden shadow-[0_12px_24px_rgba(0,0,0,0.06)] border border-black/5 group/card transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] flex flex-col sm:flex-row">
      {/* Gallery Section */}
      <div className="relative w-full sm:w-[50%] lg:w-[55%] shrink-0 border-b sm:border-b-0 sm:border-r border-black/5 bg-[#e0e0e0]">
        {/* CSS Native Snap Scroll Container */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory"
          onScroll={handleScroll}
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {/* Hide webkit scrollbar hack via inline style block injected for this component */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
            .flex.overflow-x-auto::-webkit-scrollbar {
              display: none;
            }
          `,
            }}
          />

          {images.map((img, idx) => (
            <div key={idx} className="w-full shrink-0 snap-center relative">
              <div className="w-full aspect-[4/5] bg-[#e0e0e0] overflow-hidden">
                <img
                  src={img}
                  alt={`Explainer slide ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-[800ms] group-hover/card:scale-[1.02]"
                  loading={idx === 0 ? "eager" : "lazy"}
                />
              </div>
            </div>
          ))}
          {images.length === 0 && (
            <div className="w-full shrink-0 snap-center">
              <div className="w-full aspect-[4/5] bg-[#e0e0e0] flex items-center justify-center font-mono text-[12px] text-[#555] uppercase">
                Artwork Unavailable
              </div>
            </div>
          )}
        </div>

        {/* Photo Count Indicator */}
        {images.length > 1 && (
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full font-display font-bold text-[11px] tracking-widest pointer-events-none z-10 shadow-md">
            {currentIndex + 1} / {images.length} PHOTOS
          </div>
        )}

        {/* Desktop Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className={`absolute left-3 top-[50%] -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm border border-black/10 rounded-full flex items-center justify-center z-10 shadow-md transition-all duration-300 hover:bg-white hover:scale-110 active:scale-95 ${currentIndex === 0 ? "opacity-0 pointer-events-none" : "opacity-0 group-hover/card:opacity-100 hidden sm:flex"}`}
              aria-label="Previous photo"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#151515"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className={`absolute right-3 top-[50%] -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm border border-black/10 rounded-full flex items-center justify-center z-10 shadow-md transition-all duration-300 hover:bg-white hover:scale-110 active:scale-95 ${currentIndex === images.length - 1 ? "opacity-0 pointer-events-none" : "opacity-0 group-hover/card:opacity-100 hidden sm:flex"}`}
              aria-label="Next photo"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#151515"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Article Context Section */}
      <a
        href={`/posts/${slug}/`}
        className="p-5 sm:p-7 lg:p-10 no-underline outline-none bg-white flex-1 min-w-0 flex flex-col sm:justify-center relative"
      >
        <h3 className="font-display font-black text-[24px] sm:text-[28px] lg:text-[32px] text-[#151515] group-hover/card:text-[#00046d] transition-colors duration-300 mb-[10px] leading-[1.2]">
          {title}
        </h3>
        <p className="font-sans font-medium text-[13px] italic text-[#555] mb-[2px]">
          by {author}
        </p>
        <p className="font-sans font-bold text-[13px] italic text-[#333] mb-4">
          {date}
        </p>
        <p className="font-display text-[15px] sm:text-[16px] text-[#444] leading-[1.6] line-clamp-3">
          {description}
        </p>
      </a>
    </div>
  );
}
