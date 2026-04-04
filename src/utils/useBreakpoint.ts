import { useState, useEffect } from "react";

export default function useBreakpoint() {
  // Always start with 1200 (desktop) for SSR consistency
  const [w, setW] = useState(1200);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setW(window.innerWidth);
    setIsHydrated(true);

    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  return {
    isMobile: w < 640,
    isTablet: w >= 640 && w < 1024,
    isDesktop: w >= 1024,
    isHydrated,
    w,
  };
}
