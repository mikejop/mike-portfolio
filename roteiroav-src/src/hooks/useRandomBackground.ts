import { useState, useEffect } from "react";

const BACKGROUNDS = [
  "/roteiroav/backgrounds/bg-1.webp",
  "/roteiroav/backgrounds/bg-2.webp",
  "/roteiroav/backgrounds/bg-3.webp"
];

// Global variable to keep the background stable during the SPA session
let sessionBg = "";

function getSessionBg() {
  if (typeof window === "undefined") {
    // During SSR/static generation, return a fallback or the first background
    return BACKGROUNDS[0];
  }
  if (!sessionBg) {
    const random = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
    sessionBg = random;
  }
  return sessionBg;
}

export function useRandomBackground() {
  const [bgStyle, setBgStyle] = useState<React.CSSProperties>({
    backgroundColor: "#000",
  });

  useEffect(() => {
    setBgStyle({
      backgroundImage: `url("${getSessionBg()}")`,
      backgroundColor: "#000",
    });
  }, []);

  return bgStyle;
}
