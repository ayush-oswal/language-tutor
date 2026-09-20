"use client";

import { useEffect, useRef, useState } from "react";
import type { FillBlankAnswerKey, FillBlankPayload, FillBlankQuestion } from "@lt/core";
import { IconArrowRight, IconCheck, IconSparkles, IconX } from "../Icons";
import { SpeakButton } from "../SpeakButton";
import { useDrillUntilCorrect } from "@/lib/hooks/useDrillUntilCorrect";
import { useSoundEffects } from "@/lib/hooks/useSoundEffects";
import { answersMatch } from "@/lib/textMatch";
import type { ExerciseComponentProps } from "./types";

export function FillBlankExercise({ exercise, onSubmit, languageCode }: ExerciseComponentProps) {
  const payload = exercise.payload as unknown as FillBlankPayload;
  const answerKey = exercise.answerKey as unknown as FillBlankAnswerKey;
  const questionIds = payload.questions.map((q) => q.id);

  const { roundItems, firstAttempt, submitAnswer, isComplete } = useDrillUntilCorrect<string>(questionIds);
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { playCorrect, playWrong } = useSoundEffects();

  const currentId = roundItems[0];
  const current: FillBlankQuestion | undefined = payload.questions.find((q) => q.id === currentId);
  const accepted = current ? answerKey.answers[current.id] ?? current.acceptedAnswers : [];
  const isCorrect = answersMatch(input, accepted);
  const currentIndex = questionIds.length - roundItems.length + 1;
  const progressPct = Math.round((currentIndex / questionIds.length) * 100);

  useEffect(() => {
    if (!isComplete || submitting) return;
    setSubmitting(true);
    onSubmit({ answers: firstAttempt }).catch(() => setSubmitting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  useEffect(() => {
    if (!revealed && inputRef.current) {
      inputRef.current.focus();
    }
  }, [revealed, currentId]);

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

  function handleCheck() {
    if (!input.trim()) return;
    setRevealed(true);
    if (isCorrect) playCorrect();
    else playWrong();
  }

  function handleContinue() {
    if (!current) return;
    submitAnswer(current.id, input, isCorrect);
    setInput("");
    setRevealed(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!revealed) {
        handleCheck();
      } else {
        handleContinue();
      }
    }
  }

  return (
    <div className="card" style={{ padding: "2rem" }}>
      {/* Exercise Progress Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <span className="pill pill-primary">
          Blank {currentIndex} of {questionIds.length}
        </span>
        <span className="muted" style={{ fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
          {progressPct}% Complete
        </span>
      </div>

      <div className="progress-bar" style={{ marginBottom: "1.75rem", height: "6px" }}>
        <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Sentence Prompt */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "-0.5rem" }}>
          <SpeakButton
            text={current.sentence.replace(/___/g, revealed ? accepted[0] ?? "..." : "...")}
            lang={languageCode}
            size="sm"
          />
        </div>
        <p style={{ fontSize: "1.25rem", fontWeight: 600, lineHeight: 1.6, color: "var(--text-main)" }}>
          {current.sentence.split("___").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span
                  style={{
                    display: "inline-block",
                    minWidth: "70px",
                    padding: "0.1rem 0.6rem",
                    margin: "0 0.35rem",
                    borderBottom: "2px solid var(--primary-light)",
                    color: "var(--primary-light)",
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                >
                  {input || "______"}
                </span>
              )}
            </span>
          ))}
        </p>
        {current.translation && (
          <p className="muted" style={{ marginTop: "0.75rem", fontSize: "0.95rem" }}>
            Translation: &ldquo;{current.translation}&rdquo;
          </p>
        )}
      </div>

      {current.hint && (
        <div className="alert alert-info" style={{ marginBottom: "1rem", padding: "0.6rem 0.9rem" }}>
          <span>💡 Hint: {current.hint}</span>
        </div>
      )}

      {/* Input Field */}
      <div>
        <input
          ref={inputRef}
          style={{ width: "100%", fontSize: "1rem", padding: "0.85rem 1.15rem" }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={revealed}
          placeholder="Type the missing word and press Enter..."
        />
      </div>

      {/* Feedback Banner */}
      {revealed && (
        <div
          className={`alert ${isCorrect ? "alert-success" : "alert-danger"}`}
          style={{ marginTop: "1rem", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.35rem" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {isCorrect ? <IconCheck className="w-5 h-5" /> : <IconX className="w-5 h-5" />}
            <span style={{ fontWeight: 700 }}>
              {isCorrect ? "Correct answer!" : "Not quite correct."}
            </span>
          </div>
          {!isCorrect && accepted.length > 0 && (
            <p style={{ fontSize: "0.85rem", opacity: 0.9 }}>
              Accepted answers: <strong>{accepted.join(", ")}</strong>
            </p>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
        {!revealed ? (
          <button type="button" onClick={handleCheck} disabled={!input.trim()} className="btn" style={{ padding: "0.7rem 1.5rem" }}>
            <span>Check Answer</span>
          </button>
        ) : (
          <button type="button" onClick={handleContinue} className="btn" style={{ padding: "0.7rem 1.5rem" }}>
            <span>Continue</span>
            <IconArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
