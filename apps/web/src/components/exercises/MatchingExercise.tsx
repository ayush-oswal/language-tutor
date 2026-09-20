"use client";

import { useEffect, useState } from "react";
import type { MatchingAnswerKey, MatchingItem, MatchingPayload } from "@lt/core";
import { IconArrowRight, IconCheck, IconSparkles, IconX } from "../Icons";
import { SpeakButton } from "../SpeakButton";
import { useDrillUntilCorrect } from "@/lib/hooks/useDrillUntilCorrect";
import { useSoundEffects } from "@/lib/hooks/useSoundEffects";
import type { ExerciseComponentProps } from "./types";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

export function MatchingExercise({ exercise, onSubmit, languageCode }: ExerciseComponentProps) {
  const payload = exercise.payload as unknown as MatchingPayload;
  const answerKey = exercise.answerKey as unknown as MatchingAnswerKey;
  const itemIds = payload.items.map((i) => i.id);

  const { roundItems, firstAttempt, submitAnswer, isComplete } = useDrillUntilCorrect<string>(itemIds);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { playCorrect, playWrong } = useSoundEffects();

  const currentId = roundItems[0];
  const current: MatchingItem | undefined = payload.items.find((i) => i.id === currentId);

  useEffect(() => {
    if (!isComplete || submitting) return;
    setSubmitting(true);
    onSubmit({ pairs: firstAttempt }).catch(() => setSubmitting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  if (isComplete) {
    return (
      <div className="card empty-state">
        <div className="empty-state-icon">
          <IconSparkles className="w-6 h-6" />
        </div>
        <p style={{ fontWeight: 600, color: "var(--text-main)" }}>
          {submitting ? "Submitting results..." : "All done!"}
        </p>
      </div>
    );
  }
  if (!current) return null;

  const revealed = selected !== null;
  const correctOptionId = answerKey.correctPairs[current.id];
  const isCorrect = selected === correctOptionId;
  const currentIndex = itemIds.length - roundItems.length + 1;
  const progressPct = Math.round((currentIndex / itemIds.length) * 100);

  function handleSelect(optionId: string) {
    if (revealed) return;
    setSelected(optionId);
    if (optionId === correctOptionId) playCorrect();
    else playWrong();
  }

  function handleContinue() {
    if (!selected || !current) return;
    submitAnswer(current.id, selected, selected === correctOptionId);
    setSelected(null);
  }

  return (
    <div className="card" style={{ padding: "2rem" }}>
      {/* Exercise Progress Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <span className="pill pill-primary">
          Match {currentIndex} of {itemIds.length}
        </span>
        <span className="muted" style={{ fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
          {progressPct}% Complete
        </span>
      </div>

      <div className="progress-bar" style={{ marginBottom: "1.75rem", height: "6px" }}>
        <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Target Word Highlight Card */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.08) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.25)",
          borderRadius: "var(--radius-md)",
          padding: "1.25rem",
          marginBottom: "1.5rem",
          textAlign: "center",
        }}
      >
        <span className="muted" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
          Find the match for
        </span>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: "0.3rem" }}>
          <h3 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, color: "var(--text-main)" }}>
            {current.text}
          </h3>
          <SpeakButton text={current.text} lang={languageCode} />
        </div>
      </div>

      {current.hint && (
        <div className="alert alert-info" style={{ marginBottom: "1rem", padding: "0.6rem 0.9rem" }}>
          <span>💡 Hint: {current.hint}</span>
        </div>
      )}

      {/* Options */}
      <div className="options-grid">
        {payload.options.map((option, idx) => {
          let cls = "option-btn";
          const isThisCorrect = revealed && option.id === correctOptionId;
          const isThisWrong = revealed && option.id === selected && !isCorrect;

          if (revealed) {
            if (isThisCorrect) cls += " correct";
            else if (isThisWrong) cls += " incorrect";
          } else if (option.id === selected) {
            cls += " selected";
          }

          return (
            <button
              key={option.id}
              type="button"
              className={cls}
              disabled={revealed}
              onClick={() => handleSelect(option.id)}
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

              {revealed && isThisCorrect && <IconCheck className="w-5 h-5" />}
              {revealed && isThisWrong && <IconX className="w-5 h-5" />}
            </button>
          );
        })}
      </div>

      {/* Action Footer */}
      {revealed && (
        <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {isCorrect ? (
              <span style={{ color: "#34d399", fontWeight: 700, fontSize: "1rem" }}>
                ✓ Perfect match!
              </span>
            ) : (
              <span style={{ color: "#fda4af", fontWeight: 600, fontSize: "0.95rem" }}>
                ✕ Incorrect. Keep going!
              </span>
            )}
          </div>

          <button type="button" onClick={handleContinue} className="btn" style={{ padding: "0.7rem 1.5rem" }}>
            <span>Continue</span>
            <IconArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
