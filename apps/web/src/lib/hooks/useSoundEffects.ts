"use client";

import { useCallback, useRef } from "react";

function useSound(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  return useCallback(() => {
    if (typeof window === "undefined") return;
    if (!audioRef.current) audioRef.current = new Audio(src);
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {
      // Autoplay can be blocked before the user has interacted with the page — safe to ignore.
    });
  }, [src]);
}

export function useSoundEffects() {
  const playCorrect = useSound("/Correct.mp3");
  const playWrong = useSound("/wrong.mp3");
  return { playCorrect, playWrong };
}
