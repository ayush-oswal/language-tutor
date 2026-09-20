"use client";

import { useSpeech } from "@/lib/hooks/useSpeech";
import { IconVolume } from "./Icons";

interface SpeakButtonProps {
  text: string;
  lang?: string;
  size?: "sm" | "md";
  style?: React.CSSProperties;
}

export function SpeakButton({ text, lang, size = "md", style }: SpeakButtonProps) {
  const { speak, speaking, supported } = useSpeech();

  if (!supported || !text?.trim()) return null;

  const iconSize = size === "sm" ? 14 : 16;

  return (
    <button
      type="button"
      className="btn btn-ghost"
      style={{
        padding: size === "sm" ? "0.25rem" : "0.4rem",
        borderRadius: "999px",
        minWidth: 0,
        lineHeight: 0,
        ...style,
      }}
      onClick={(e) => {
        e.stopPropagation();
        speak(text, lang);
      }}
      title="Listen"
      aria-label="Listen to this text"
    >
      <IconVolume size={iconSize} style={{ opacity: speaking ? 1 : 0.75 }} />
    </button>
  );
}
