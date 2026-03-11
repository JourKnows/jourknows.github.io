import { useState, useEffect } from "react";
import { LOGO, SEARCH_ICON } from "../utils/constants";

function useBreakpoint() {
  const getW = () => (typeof window !== "undefined" ? window.innerWidth : 1200);
  const [w, setW] = useState(getW);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return {
    isMobile: w < 640,
    isTablet: w >= 640 && w < 1024,
    isDesktop: w >= 1024,
    w,
  };
}

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const isActive = (href: string) => {
    if (!activeHref) return false;
    if (href === "/" && activeHref === "/") return true;
    if (href !== "/" && activeHref.startsWith(href)) return true;
    return false;
  };

  return (
    <>
      <header className="sticky top-0 z-[200] bg-jk-navy-grad shadow-[0_2px_16px_rgba(0,0,77,0.5)]">
        {/* Top bar */}
        <div
          className="flex items-center gap-2 mx-auto w-full max-w-[1400px]"
          style={{
            padding: compact ? "0 14px" : "0 32px",
            height: compact ? 58 : 70,
          }}
        >
          {/* Search button */}
          <button
            onClick={() => setSearchOpen(s => !s)}
            className="jk-btn bg-transparent border-none cursor-pointer p-1.5 shrink-0"
            aria-label="Search"
          >
            <img
              src={SEARCH_ICON}
              alt="search"
              className="w-5 h-5 opacity-80"
            />
          </button>

          {/* Logo */}
          <a
            href="/"
            className="flex-1 flex items-center gap-2.5 cursor-pointer outline-none no-underline"
            style={{ justifyContent: compact ? "center" : "flex-start" }}
          >
            <img
              src={LOGO}
              alt="JourKnows"
              className="rounded-lg object-cover shrink-0"
              style={{ width: compact ? 38 : 50, height: compact ? 38 : 50 }}
            />
            {!compact && (
              <span className="font-display font-extrabold text-[17px] text-white tracking-[0.5px]">
                JourKnows
              </span>
            )}
          </a>

          {/* Desktop nav links */}
          {!compact && (
            <nav className="flex gap-5 items-center">
              {navLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`jk-btn bg-transparent border-none cursor-pointer font-display tracking-[0.5px] whitespace-nowrap pb-0.5 outline-none no-underline block ${
                    isActive(link.href)
                      ? "font-extrabold text-white border-b-2 border-white"
                      : "font-semibold text-white/75 border-b-2 border-transparent hover:text-white"
                  }`}
                  style={{ fontSize: 12 }}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}

          {/* Hamburger */}
          {compact && (
            <button
              onClick={() => setMenuOpen(s => !s)}
              className="jk-btn bg-transparent border-none cursor-pointer p-1.5 shrink-0 outline-none"
              aria-label="Menu"
            >
              <div className="flex flex-col gap-[5px] w-6">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="block h-[2.5px] rounded-sm bg-white origin-center transition-all duration-250"
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

        {/* Search bar */}
        {searchOpen && (
          <div className="bg-[#00003c]/95 py-2 px-3.5">
            <form onSubmit={handleSearch}>
              <input
                autoFocus
                placeholder="Search articles…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/12 border border-white/30 rounded-full py-2 px-4 text-white font-display text-[13px] outline-none placeholder:text-white/60 focus:border-white/60 transition-colors"
              />
            </form>
          </div>
        )}
      </header>

      {/* Mobile slide-in menu */}
      {compact && menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-[199] bg-black/45"
        >
          <nav
            onClick={e => e.stopPropagation()}
            className="absolute right-0 w-[min(260px,80vw)] bg-[#000060] shadow-[-4px_0_24px_rgba(0,0,0,0.4)] min-h-[100svh] pt-1.5 animate-[jkFadeUp_0.2s_ease_both]"
            style={{ top: compact ? 58 : 70 }}
          >
            {navLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                className={`block w-full text-left border-none cursor-pointer font-display text-[15px] text-white py-3.5 px-5 tracking-[0.5px] outline-none no-underline ${
                  isActive(link.href)
                    ? "font-extrabold bg-white/12 border-l-[3px] border-l-white"
                    : "font-semibold bg-transparent border-l-[3px] border-l-transparent"
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
