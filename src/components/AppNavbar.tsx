import React, { useState, useEffect } from "react";
import useBreakpoint from "../utils/useBreakpoint";

export default function AppNavbar({
  activeHref,
  navLinks = [{ label: "HOME", href: "/" }],
}: {
  activeHref?: string;
  navLinks?: { label: string; href: string }[];
}) {
  const { isMobile, isTablet } = useBreakpoint();
  const compact = isMobile || isTablet;

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length > 0) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const isActive = (href: string) => {
    if (!activeHref) return false;
    if (href === "/") return activeHref === "/" || activeHref === "/search";
    return activeHref.startsWith(href);
  };

  return (
    <>
      {/* Site Banner (MUST STAY INTACT AND UNMODIFIED ABOVE HEADER) */}
      <a
        href="/"
        className="hidden sm:block cursor-pointer group"
        style={{
          width: "100%",
          aspectRatio: "1024 / 85",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <img
          src="https://i.imgur.com/u77FS3O.jpeg"
          alt="Site banner"
          className="transition-transform duration-[800ms] group-hover:scale-[1.02]"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        <img
          src="https://i0.wp.com/jourknowsph.com/wp-content/uploads/2026/02/untitled-1920-x-900-px-1920-x-750-px.png?fit=1920%2C750&ssl=1"
          alt="Site logo"
          className="transition-opacity duration-[800ms] group-hover:opacity-80"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            height: "90%",
            aspectRatio: "311 / 224",
            objectFit: "contain",
          }}
        />
      </a>

      {/* 
        The Apple Liquid Glass Architecture Wrapper
        pointer-events-none lets users click articles under the pill's negative space.
      */}
      <header
        className={`sticky w-full z-[200] flex justify-center pointer-events-none transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isScrolled && !compact ? "top-4 lg:top-5" : "top-0"
        }`}
      >
        <div
          className={`pointer-events-auto flex items-center justify-between relative transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu origin-top ${
            compact
              ? isScrolled
                ? // Mobile: Navy Dark Liquid Glass
                  "w-full bg-[#000060]/75 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border-b border-white/10"
                : // Mobile: Solid Navy
                  "w-full bg-[#000060] border-[transparent] shadow-[0_2px_16px_rgba(0,0,77,0.15)]"
              : isScrolled
                ? // Desktop: VisionOS Apple Glass Pill (Isolated & Floating)
                  "w-[min(1100px,92%)] rounded-[24px] bg-white/40 backdrop-blur-[32px] backdrop-saturate-[200%] shadow-[0_16px_40px_rgba(0,0,0,0.08)] border border-white/10"
                : // Desktop: Solid Edge-to-Edge Architecture
                  "w-full rounded-none bg-white border-b border-black/5 shadow-[0_2px_16px_rgba(0,0,0,0.03)]"
          }`}
          style={{
            padding: compact ? "0 14px" : isScrolled ? "0 28px" : "0 32px",
            height: compact ? (isScrolled ? 50 : 58) : isScrolled ? 54 : 60,
            maxWidth: compact ? "100%" : isScrolled ? "1100px" : "1400px",
          }}
        >
          {/* Left side / Search */}
          <div className="flex items-center">
            {compact ? (
              <button
                onClick={() => setSearchOpen(s => !s)}
                className="jk-btn bg-transparent border-none cursor-pointer p-1.5 shrink-0 outline-none hover:bg-white/10 rounded-full transition-colors"
                aria-label="Search"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            ) : (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div className="relative flex items-center group">
                  <button
                    type="submit"
                    className="absolute left-3 opacity-60 bg-transparent border-none outline-none cursor-pointer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#000060"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </button>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-black/5 rounded-full h-[32px] pl-10 pr-4 w-[200px] lg:w-[240px] outline-none text-[#000060] font-sans text-[13px] border border-black/5 focus:border-white/80 focus:bg-white/80 focus:w-[220px] lg:focus:w-[280px] transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] placeholder:text-[#000060]/50 hover:bg-black/10"
                  />
                </div>
              </form>
            )}
          </div>

          {/* Logo (Centered Absolute, Mobile Baseline ONLY) */}
          {compact && (
            <a
              href="/"
              className="absolute left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] flex items-center justify-center cursor-pointer outline-none no-underline z-10 hover:opacity-80 transition-opacity"
            >
              <img
                src="https://i0.wp.com/jourknowsph.com/wp-content/uploads/2026/02/untitled-1920-x-900-px-1920-x-750-px.png?fit=1920%2C750&ssl=1"
                alt="JourKnows"
                className="object-contain shrink-0 transition-all duration-500"
                style={{ height: isScrolled ? 26 : 32, width: "auto" }}
              />
            </a>
          )}

          {/* Desktop nav links */}
          {!compact && (
            <nav className="flex items-center z-10 h-full">
              <div className="flex items-center gap-4 lg:gap-5 h-full">
                {navLinks.map(link => {
                  const active = isActive(link.href);
                  return (
                    <a
                      key={link.label}
                      href={link.href}
                      className={`relative font-display flex items-center justify-center h-full text-[12px] lg:text-[14px] tracking-[0.5px] uppercase no-underline whitespace-nowrap transition-all duration-300 px-3 ${
                        active
                          ? "font-extrabold text-[#000060]"
                          : "font-semibold text-[#555555] hover:text-[#000060] hover:bg-white/40 rounded-md my-2"
                      }`}
                      style={{ height: "calc(100% - 16px)" }}
                    >
                      {link.label}
                      {/* Active indicator bar */}
                      {active && (
                        <span className="absolute bottom-[-8px] left-0 w-full h-[3px] bg-[#000060] rounded-t-sm" />
                      )}
                    </a>
                  );
                })}
              </div>
            </nav>
          )}

          {/* Hamburger (Mobile Right) */}
          {compact && (
            <button
              onClick={() => setMenuOpen(s => !s)}
              className="jk-btn bg-transparent border-none cursor-pointer p-1.5 shrink-0 outline-none hover:bg-white/10 rounded-full transition-colors"
              aria-label="Menu"
            >
              <div className="flex flex-col gap-[5px] w-6">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="block h-[2.5px] rounded-sm bg-white origin-center transition-all duration-300"
                    style={{
                      transform: menuOpen
                        ? i === 1
                          ? "scaleX(0)"
                          : i === 0
                            ? "translateY(7.5px) rotate(45deg)"
                            : "translateY(-7.5px) rotate(-45deg)"
                        : "none",
                    }}
                  />
                ))}
              </div>
            </button>
          )}
        </div>

        {/* Mobile Search Input Overlay (Apple Liquid Glass) */}
        {compact && searchOpen && (
          <div className="absolute top-[100%] left-0 right-0 w-full pointer-events-auto bg-[#000020]/50 backdrop-blur-[40px] backdrop-saturate-[200%] border-b border-white/10 py-3 px-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all animate-[jkFadeUp_0.2s_ease_both]">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <div className="absolute left-4 top-[50%] translate-y-[-50%] opacity-70">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                <input
                  autoFocus
                  placeholder="Search articles…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-[16px] py-3 pl-12 pr-4 text-white font-display text-[16px] outline-none placeholder:text-white/60 focus:border-white/50 focus:bg-white/20 transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.15)]"
                />
              </div>
            </form>
          </div>
        )}
      </header>

      {/* Mobile slide-in menu (Apple Liquid Glass) */}
      {compact && menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-[199] bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        >
          <nav
            onClick={e => e.stopPropagation()}
            className="absolute right-0 w-[min(320px,85vw)] bg-[#000020]/50 backdrop-blur-[40px] backdrop-saturate-[200%] shadow-[-20px_0_60px_rgba(0,0,0,0.4)] min-h-[100svh] pt-6 animate-[jkFadeUp_0.3s_ease_both] overflow-y-auto pb-32 border-l border-white/10 transition-all duration-300"
            style={{
              top: isScrolled ? 50 : 58,
              height: `calc(100svh - ${isScrolled ? 50 : 58}px)`,
            }}
          >
            <div className="px-7 py-2 font-display font-black text-[11px] text-white/50 tracking-[2px] mb-3 uppercase">
              Categories
            </div>
            <div className="mx-5 bg-white/10 rounded-[20px] overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_20px_rgba(0,0,0,0.2)] border border-white/10">
              {navLinks
                .filter(link => link.href !== "/")
                .map((link, idx, arr) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className={`block w-full text-left border-none cursor-pointer font-display text-[16px] text-white py-4 px-6 tracking-[0.5px] outline-none no-underline transition-all duration-300 active:bg-white/20 active:scale-[0.98] ${
                      isActive(link.href)
                        ? "font-extrabold bg-white/15 shadow-[inset_4px_0_0_#ffffff]"
                        : "font-medium hover:bg-white/10"
                    } ${idx !== arr.length - 1 ? "border-b border-white/10" : ""}`}
                  >
                    {link.label}
                  </a>
                ))}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
