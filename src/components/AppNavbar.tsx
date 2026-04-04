import { useState, useEffect } from "react";
import { LOGO, SEARCH_ICON } from "../utils/constants";
import useBreakpoint from "../utils/useBreakpoint";

/* ── Inline SVG icons for bottom bar ── */
const IconHome = ({ active }: { active: boolean }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? "#ffffff" : "rgba(255,255,255,0.6)"}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconTrending = ({ active }: { active: boolean }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? "#ffffff" : "rgba(255,255,255,0.6)"}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

const IconSearch = ({ active }: { active: boolean }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? "#ffffff" : "rgba(255,255,255,0.6)"}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconGrid = ({ active }: { active: boolean }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? "#ffffff" : "rgba(255,255,255,0.6)"}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconMore = ({ active }: { active: boolean }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? "#ffffff" : "rgba(255,255,255,0.6)"}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

type BottomTab = "home" | "trending" | "search" | "categories" | "more";

export default function AppNavbar({
  activeHref,
  navLinks = [{ label: "HOME", href: "/" }],
}: {
  activeHref?: string;
  navLinks?: { label: string; href: string }[];
}) {
  const { isMobile, isTablet, isHydrated } = useBreakpoint();
  const compact = isHydrated && (isMobile || isTablet);
  const [activePanel, setActivePanel] = useState<
    "search" | "categories" | "more" | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Lock body scroll when a panel is open
  useEffect(() => {
    if (activePanel && compact) {
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
  }, [activePanel, compact]);

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

  const togglePanel = (panel: "search" | "categories" | "more") => {
    setActivePanel(prev => (prev === panel ? null : panel));
  };

  const getActiveTab = (): BottomTab | null => {
    if (activePanel)
      return activePanel === "search"
        ? "search"
        : activePanel === "categories"
          ? "categories"
          : "more";
    if (activeHref === "/") return "home";
    if (activeHref === "/posts" || activeHref === "/posts/") return "trending";
    return null;
  };
  const currentTab = getActiveTab();

  const categoryLinks = navLinks.filter(link => link.href !== "/");

  // Mobile loading overlay — shown before hydration on mobile-width screens
  // Uses CSS media query so it never appears on desktop regardless of JS state
  if (!isHydrated) {
    return (
      <>
        {/* Desktop banner + header render normally during SSR */}
        <div
          className="hidden lg:block"
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
        {/* Mobile: slim loading header while JS initializes */}
        <div
          className="lg:hidden"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 200,
            height: 50,
            background: "linear-gradient(135deg, #000050 0%, #000080 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src="https://i0.wp.com/jourknowsph.com/wp-content/uploads/2026/02/untitled-1920-x-900-px-1920-x-750-px.png?fit=1920%2C750&ssl=1"
            alt="JourKnows"
            style={{ height: 30, width: "auto", objectFit: "contain" }}
          />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Site Banner — desktop only */}
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

      {/* ── Top Header ── */}
      <header
        className={`sticky top-0 z-[200] shadow-[0_2px_16px_rgba(0,0,77,0.15)] ${compact ? "bg-jk-navy-grad" : "bg-white"}`}
      >
        <div
          className="flex items-center justify-between relative mx-auto w-full max-w-[1400px]"
          style={{
            padding: compact ? "0 14px" : "0 32px",
            height: compact ? 50 : 46,
          }}
        >
          {/* Desktop: search bar */}
          {!compact && (
            <div className="flex items-center">
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
            </div>
          )}

          {/* Mobile: centered logo */}
          {compact && (
            <a
              href="/"
              className="absolute left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] flex items-center justify-center cursor-pointer outline-none no-underline z-10"
            >
              <img
                src="https://i0.wp.com/jourknowsph.com/wp-content/uploads/2026/02/untitled-1920-x-900-px-1920-x-750-px.png?fit=1920%2C750&ssl=1"
                alt="JourKnows"
                className="object-contain shrink-0"
                style={{ height: 30, width: "auto" }}
              />
            </a>
          )}

          {/* Desktop: nav links */}
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
        </div>
      </header>

      {/* ── Mobile Panels (overlay content between header and bottom bar) ── */}
      {compact && activePanel && (
        <div
          className="fixed inset-0 z-[198] bg-black/50"
          style={{ top: 50, bottom: 64 }}
          onClick={() => setActivePanel(null)}
        >
          <div
            className="absolute inset-0 overflow-y-auto animate-[jkFadeUp_0.18s_ease_both]"
            onClick={e => e.stopPropagation()}
          >
            {/* Search panel */}
            {activePanel === "search" && (
              <div className="bg-[#000040] min-h-full px-5 pt-5 pb-8">
                <p className="font-display font-extrabold text-[13px] text-white/60 tracking-[1px] uppercase mb-4">
                  Search Articles
                </p>
                <form onSubmit={handleSearch}>
                  <input
                    autoFocus
                    placeholder="Search articles…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white/10 border border-white/30 rounded-lg py-3 px-4 text-white font-display text-[15px] outline-none placeholder:text-white/40 focus:border-white/60 transition-colors"
                  />
                  <button
                    type="submit"
                    className="jk-btn mt-3 w-full bg-white text-[#000060] font-display font-bold text-[13px] rounded-lg py-2.5 border-none cursor-pointer"
                  >
                    SEARCH
                  </button>
                </form>
              </div>
            )}

            {/* Categories panel */}
            {activePanel === "categories" && (
              <div className="bg-[#000040] min-h-full px-5 pt-5 pb-8">
                <p className="font-display font-extrabold text-[13px] text-white/60 tracking-[1px] uppercase mb-4">
                  Categories
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {categoryLinks.map(link => (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={() => setActivePanel(null)}
                      className={`block rounded-lg py-4 px-4 text-center font-display text-[13px] tracking-[0.5px] uppercase no-underline transition-colors ${
                        isActive(link.href)
                          ? "bg-white/20 text-white font-extrabold"
                          : "bg-white/8 text-white/80 font-semibold hover:bg-white/15"
                      }`}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* More panel */}
            {activePanel === "more" && (
              <div className="bg-[#000040] min-h-full px-5 pt-5 pb-8">
                <p className="font-display font-extrabold text-[13px] text-white/60 tracking-[1px] uppercase mb-4">
                  Menu
                </p>
                {[
                  { label: "About Us", href: "/about" },
                  { label: "All Posts", href: "/posts" },
                  { label: "Tags", href: "/tags" },
                ].map(link => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setActivePanel(null)}
                    className="flex items-center gap-3 py-3.5 px-2 border-b border-white/10 font-display text-[15px] text-white font-semibold no-underline hover:bg-white/5 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="mt-6">
                  <p className="font-display font-extrabold text-[13px] text-white/60 tracking-[1px] uppercase mb-3">
                    Categories
                  </p>
                  {categoryLinks.map(link => (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={() => setActivePanel(null)}
                      className={`flex items-center gap-3 py-3 px-2 border-b border-white/10 font-display text-[14px] no-underline transition-colors ${
                        isActive(link.href)
                          ? "text-white font-extrabold bg-white/8"
                          : "text-white/80 font-medium hover:bg-white/5"
                      }`}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Bar ── */}
      {compact && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-[200] bg-[#000050] border-t border-white/10 shadow-[0_-2px_16px_rgba(0,0,50,0.3)]"
          style={{ height: 64, paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-center justify-around h-full max-w-[500px] mx-auto px-2">
            {(
              [
                {
                  key: "home" as BottomTab,
                  label: "Home",
                  icon: IconHome,
                  action: () => {
                    setActivePanel(null);
                    window.location.href = "/";
                  },
                },
                {
                  key: "trending" as BottomTab,
                  label: "Latest",
                  icon: IconTrending,
                  action: () => {
                    setActivePanel(null);
                    window.location.href = "/posts";
                  },
                },
                {
                  key: "search" as BottomTab,
                  label: "Search",
                  icon: IconSearch,
                  action: () => togglePanel("search"),
                },
                {
                  key: "categories" as BottomTab,
                  label: "Sections",
                  icon: IconGrid,
                  action: () => togglePanel("categories"),
                },
                {
                  key: "more" as BottomTab,
                  label: "More",
                  icon: IconMore,
                  action: () => togglePanel("more"),
                },
              ] as const
            ).map(tab => {
              const active = currentTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={tab.action}
                  className="flex flex-col items-center justify-center gap-0.5 bg-transparent border-none cursor-pointer outline-none px-1 py-1 min-w-[52px]"
                  aria-label={tab.label}
                >
                  <tab.icon active={active} />
                  <span
                    className={`font-display text-[10px] tracking-[0.3px] ${
                      active
                        ? "text-white font-bold"
                        : "text-white/50 font-medium"
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
