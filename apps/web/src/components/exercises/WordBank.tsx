"use client";

import { useState } from "react";
import { useSpeech } from "@/lib/hooks/useSpeech";
import { shuffle } from "@/lib/shuffle";

interface WordBankProps {
  tiles: string[];
  /** Voice for reading a tapped tile aloud. */
  lang: string | undefined;
  disabled: boolean;
  /** Called with the picked tiles joined by spaces, in the order they were picked. */
  onChange: (answer: string) => void;
}

/**
 * Duolingo-style answer builder: tapping a tile reads it aloud and appends it to the answer line;
 * tapping a tile on the line puts it back. Give it a fresh `key` per question so it starts empty.
 */
export function WordBank({ tiles, lang, disabled, onChange }: WordBankProps) {
  const { speak } = useSpeech();
  // Shuffled once per mount. Tiles are tracked by index so a repeated word stays two separate tiles.
  const [order] = useState(() => shuffle(tiles.map((_, index) => index)));
  const [picked, setPicked] = useState<number[]>([]);

  function update(next: number[]) {
    setPicked(next);
    onChange(next.map((index) => tiles[index]).join(" "));
  }

  function pick(index: number) {
    if (disabled || picked.includes(index)) return;
    speak(tiles[index], lang);
    update([...picked, index]);
  }

  function unpick(index: number) {
    if (disabled) return;
    update(picked.filter((i) => i !== index));
  }

  return (
    <div>
      <div className="word-bank-line">
        {picked.length === 0 ? (
          <span className="muted" style={{ fontSize: "0.9rem" }}>
            Tap the words below to build your answer
          </span>
        ) : (
          picked.map((index) => (
            <button key={index} type="button" className="word-tile" disabled={disabled} onClick={() => unpick(index)}>
              {tiles[index]}
            </button>
          ))
        )}
      </div>
      <div className="word-bank-tiles">
        {order.map((index) =>
          picked.includes(index) ? (
            <span key={index} className="word-tile word-tile-placeholder" aria-hidden="true">
              {tiles[index]}
            </span>
          ) : (
            <button key={index} type="button" className="word-tile" disabled={disabled} onClick={() => pick(index)}>
              {tiles[index]}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
