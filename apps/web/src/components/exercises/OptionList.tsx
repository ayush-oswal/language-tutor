"use client";

import type { McOption, OptionLanguage } from "@lt/core";
import { IconArrowRight, IconCheck, IconX } from "../Icons";
import { useSpeech } from "@/lib/hooks/useSpeech";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

/** Voice used for English (native-language) text. */
export const NATIVE_SPEECH_LANG = "en-US";

/** Older exercises have no optionLanguage; their options were target-language words. */
export function optionSpeechLang(optionLanguage: OptionLanguage | undefined, languageCode: string | undefined) {
  return optionLanguage === "NATIVE" ? NATIVE_SPEECH_LANG : languageCode;
}

interface OptionListProps {
  options: McOption[];
  selectedId: string | null;
  correctOptionId: string | undefined;
  revealed: boolean;
  /** Voice for reading a tapped option aloud. */
  speakLang: string | undefined;
  onSelect: (optionId: string) => void;
}

/** Tapping an option selects it and reads it aloud; the answer is only judged once the learner presses Check. */
export function OptionList({ options, selectedId, correctOptionId, revealed, speakLang, onSelect }: OptionListProps) {
  const { speak } = useSpeech();
  const isCorrect = selectedId === correctOptionId;

  return (
    <div className="options-grid">
      {options.map((option, idx) => {
        let cls = "option-btn";
        const isThisCorrect = revealed && option.id === correctOptionId;
        const isThisWrong = revealed && option.id === selectedId && !isCorrect;

        if (revealed) {
          if (isThisCorrect) cls += " correct";
          else if (isThisWrong) cls += " incorrect";
        } else if (option.id === selectedId) {
          cls += " selected";
        }

        return (
          <button
            key={option.id}
            type="button"
            className={cls}
            disabled={revealed}
            onClick={() => {
              onSelect(option.id);
              speak(option.text, speakLang);
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
              <span
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {OPTION_LETTERS[idx] ?? idx + 1}
              </span>
              <span style={{ fontSize: "1rem" }}>{option.text}</span>
            </div>

            {isThisCorrect && <IconCheck className="w-5 h-5" />}
            {isThisWrong && <IconX className="w-5 h-5" />}
          </button>
        );
      })}
    </div>
  );
}

interface CheckFooterProps {
  revealed: boolean;
  canCheck: boolean;
  isCorrect: boolean;
  onCheck: () => void;
  onContinue: () => void;
  correctText: string;
  wrongText: string;
  continueLabel?: string;
}

/** "Check" until the answer is judged, then the verdict and a button to move on. */
export function CheckFooter({
  revealed,
  canCheck,
  isCorrect,
  onCheck,
  onContinue,
  correctText,
  wrongText,
  continueLabel = "Continue",
}: CheckFooterProps) {
  if (!revealed) {
    return (
      <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
        <button type="button" onClick={onCheck} disabled={!canCheck} className="btn" style={{ padding: "0.7rem 1.5rem" }}>
          <span>Check</span>
        </button>
      </div>
    );
  }
  return (
    <div
      style={{
        marginTop: "1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
      }}
    >
      <span style={{ color: isCorrect ? "#34d399" : "#fda4af", fontWeight: 700 }}>{isCorrect ? correctText : wrongText}</span>
      <button type="button" onClick={onContinue} className="btn" style={{ padding: "0.7rem 1.5rem" }}>
        <span>{continueLabel}</span>
        <IconArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
