import { useState, useEffect } from "react";
import { LOGO, SEARCH_ICON } from "../utils/constants";
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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen && compact) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [menuOpen, compact]);

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

  const [categoriesOpen, setCategoriesOpen] = useState(false);

  return (
    <>
      {/* Site Banner */}
      <div
        className="hidden sm:block"
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
      </div>
      <header
        className={`sticky top-0 z-[200] shadow-[0_2px_16px_rgba(0,0,77,0.15)] ${compact ? "bg-jk-navy-grad" : "bg-white"}`}
      >
        {/* Top bar */}
        <div
          className="flex items-center justify-between relative mx-auto w-full max-w-[1400px]"
          style={{
            padding: compact ? "0 14px" : "0 32px",
            height: compact ? 58 : 46,
          }}
        >
          {/* Left side / Search */}
          <div className="flex items-center">
            {compact ? (
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
            ) : (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <button
                  type="submit"
                  className="bg-transparent border-none cursor-pointer p-1 shrink-0 flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
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
                  placeholder=""
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-[#e9ecef] rounded-full h-[28px] focus:outline-none px-4 w-[200px] lg:w-[250px] outline-none text-[#000060] font-sans text-[13px] border border-transparent focus:border-[#000060]/30 transition-colors"
                />
              </form>
            )}
          </div>

          {/* Logo (Centered Absolute) */}
          {compact && (
            <a
              href="/"
              className="absolute left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] flex items-center justify-center cursor-pointer outline-none no-underline z-10"
            >
              <img
                src="https://i0.wp.com/jourknowsph.com/wp-content/uploads/2026/02/untitled-1920-x-900-px-1920-x-750-px.png?fit=1920%2C750&ssl=1"
                alt="JourKnows"
                className="object-contain shrink-0"
                style={{ height: 32, width: "auto" }}
              />
            </a>
          )}

          {/* Desktop nav links */}
          {!compact && (
            <nav className="flex items-center z-10">
              <div className="flex items-center gap-4 lg:gap-6">
                {navLinks.map(link => (
                  <a
                    key={link.label}
                    href={link.href}
                    className={`font-display text-[12px] lg:text-[14px] tracking-[0.5px] uppercase no-underline whitespace-nowrap transition-colors ${
                      isActive(link.href)
                        ? "font-extrabold text-[#000060]"
                        : "font-bold text-[#333333] hover:text-[#000060]"
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
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
        {compact && searchOpen && (
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
          style={{ top: compact ? 58 : 70 }}
        >
          <nav
            onClick={e => e.stopPropagation()}
            className="absolute right-0 w-[min(260px,80vw)] bg-[#000060] shadow-[-4px_0_24px_rgba(0,0,0,0.4)] pt-1.5 overflow-y-auto pb-24 animate-[slideInRight_0.2s_ease_both]"
            style={{
              top: 0,
              height: `calc(100svh - ${compact ? 58 : 70}px)`,
            }}
          >
            <div className="px-5 py-3 font-display font-black text-[11px] text-white/50 tracking-[1px] mb-1">
              CATEGORIES
            </div>
            {navLinks
              .filter(link => link.href !== "/")
              .map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
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
