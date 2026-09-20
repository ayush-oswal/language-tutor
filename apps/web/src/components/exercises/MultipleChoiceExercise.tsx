"use client";

import { useEffect, useState } from "react";
import type {
  MultipleChoiceAnswerKey,
  MultipleChoicePayload,
  MultipleChoiceQuestion,
} from "@lt/core";
import { IconArrowRight, IconCheck, IconSparkles, IconX } from "../Icons";
import { SpeakButton } from "../SpeakButton";
import { useDrillUntilCorrect } from "@/lib/hooks/useDrillUntilCorrect";
import { useSoundEffects } from "@/lib/hooks/useSoundEffects";
import type { ExerciseComponentProps } from "./types";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

export function MultipleChoiceExercise({ exercise, onSubmit, languageCode }: ExerciseComponentProps) {
  const payload = exercise.payload as unknown as MultipleChoicePayload;
  const answerKey = exercise.answerKey as unknown as MultipleChoiceAnswerKey;
  const questionIds = payload.questions.map((q) => q.id);

  const { roundItems, firstAttempt, submitAnswer, isComplete } = useDrillUntilCorrect<string>(questionIds);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { playCorrect, playWrong } = useSoundEffects();

  const currentId = roundItems[0];
  const current: MultipleChoiceQuestion | undefined = payload.questions.find((q) => q.id === currentId);

  useEffect(() => {
    if (!isComplete || submitting) return;
    setSubmitting(true);
    onSubmit({ answers: firstAttempt }).catch(() => setSubmitting(false));
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
  const correctOptionId = answerKey.answers[current.id];
  const isCorrect = selected === correctOptionId;
  const currentIndex = questionIds.length - roundItems.length + 1;
  const progressPct = Math.round((currentIndex / questionIds.length) * 100);

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
          Question {currentIndex} of {questionIds.length}
        </span>
        <span className="muted" style={{ fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
          {progressPct}% Complete
        </span>
      </div>

      <div className="progress-bar" style={{ marginBottom: "1.75rem", height: "6px" }}>
        <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Question Prompt */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <h3 className="title" style={{ fontSize: "1.35rem", lineHeight: 1.4, margin: 0 }}>
          {current.prompt}
        </h3>
        <SpeakButton text={current.prompt} lang={languageCode} />
      </div>

      {current.hint && (
        <div className="alert alert-info" style={{ marginTop: "0.5rem", marginBottom: "1rem", padding: "0.6rem 0.9rem" }}>
          <span>💡 Hint: {current.hint}</span>
        </div>
      )}

      {/* Options List */}
      <div className="options-grid" style={{ marginTop: "1.5rem" }}>
        {current.options.map((option, idx) => {
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

      {/* Feedback Banner & Continue Button */}
      {revealed && (
        <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {isCorrect ? (
              <span style={{ color: "#34d399", fontWeight: 700, fontSize: "1rem" }}>
                ✓ Brilliant! Correct answer.
              </span>
            ) : (
              <span style={{ color: "#fda4af", fontWeight: 600, fontSize: "0.95rem" }}>
                ✕ Not quite. Review the highlighted answer above.
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
