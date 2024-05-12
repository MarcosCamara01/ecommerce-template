"use client";

import { useEffect, useState } from "react";

export function useClientMediaQuery(query) {
  const [matches, setMatches] = useState(null);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);

    const handleMatchChange = (e) => {
      setMatches(e.matches);
    };

    mediaQueryList.addEventListener("change", handleMatchChange);
    setMatches(mediaQueryList.matches);

    return () => {
      mediaQueryList.removeEventListener("change", handleMatchChange);
    };
  }, [query]);

  return matches;
}
