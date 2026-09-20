"use client";

import { useEffect, useState } from "react";
import type { NewWordLearningAnswerKey, NewWordLearningPayload } from "@lt/core";
import { IconArrowRight, IconBook, IconBrain, IconCheck, IconSparkles, IconX } from "../Icons";
import { SpeakButton } from "../SpeakButton";
import { useDrillUntilCorrect } from "@/lib/hooks/useDrillUntilCorrect";
import { useSoundEffects } from "@/lib/hooks/useSoundEffects";
import type { ExerciseComponentProps } from "./types";

type Stage = "present" | "stage2" | "stage3";
const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

export function NewWordLearningExercise({ exercise, onSubmit, languageCode }: ExerciseComponentProps) {
  const payload = exercise.payload as unknown as NewWordLearningPayload;
  const answerKey = exercise.answerKey as unknown as NewWordLearningAnswerKey;

  const [stage, setStage] = useState<Stage>("present");
  const [submitting, setSubmitting] = useState(false);

  const stage2ItemIds = payload.stage2.items.map((i) => i.id);
  const stage3QuestionIds = payload.stage3.questions.map((q) => q.id);

  const stage2Drill = useDrillUntilCorrect<string>(stage2ItemIds);
  const stage3Drill = useDrillUntilCorrect<string>(stage3QuestionIds);

  const [stage2Selected, setStage2Selected] = useState<string | null>(null);
  const [stage3Selected, setStage3Selected] = useState<string | null>(null);
  const { playCorrect, playWrong } = useSoundEffects();

  useEffect(() => {
    if (stage === "stage2" && stage2Drill.isComplete) setStage("stage3");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage2Drill.isComplete]);

  useEffect(() => {
    if (stage !== "stage3" || !stage3Drill.isComplete || submitting) return;
    setSubmitting(true);
    onSubmit({
      stage2: { pairs: stage2Drill.firstAttempt },
      stage3: { answers: stage3Drill.firstAttempt },
    }).catch(() => setSubmitting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, stage3Drill.isComplete]);

  if (submitting) {
    return (
      <div className="card empty-state">
        <div className="empty-state-icon">
          <IconSparkles className="w-6 h-6" />
        </div>
        <p style={{ fontWeight: 600, color: "var(--text-main)" }}>Submitting learning session...</p>
      </div>
    );
  }

  // Stage 1: Vocabulary Introduction Flashcards
  if (stage === "present") {
    return (
      <div className="card" style={{ padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="pill pill-primary">Stage 1 of 3</span>
            <span className="pill">Discovery</span>
          </div>
          <span className="muted" style={{ fontSize: "0.85rem" }}>
            {payload.candidates.length} new words
          </span>
        </div>

        <h2 className="title" style={{ fontSize: "1.4rem", marginBottom: "0.4rem" }}>
          Study Your New Words
        </h2>
        <p className="muted" style={{ marginBottom: "1.5rem" }}>
          Read and familiarize yourself with these target words before starting the interactive verification drill.
        </p>

        <div className="flashcard-grid">
          {payload.candidates.map((c) => (
            <div key={c.tempId} className="flashcard">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <span className="flashcard-word">{c.word}</span>
                  <SpeakButton text={c.word} lang={languageCode} size="sm" />
                </div>
                {c.partOfSpeech && (
                  <span className="pill" style={{ fontSize: "0.7rem" }}>
                    {c.partOfSpeech}
                  </span>
                )}
              </div>
              <p className="flashcard-translation">{c.translation}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
          <button type="button" onClick={() => setStage("stage2")} className="btn" style={{ padding: "0.75rem 1.75rem" }}>
            <span>Start Practice Drill</span>
            <IconArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Stage 2: Matching Drill
  if (stage === "stage2") {
    const currentId = stage2Drill.roundItems[0];
    const current = payload.stage2.items.find((i) => i.id === currentId);
    if (!current) return null;
    const revealed = stage2Selected !== null;
    const correctOptionId = answerKey.stage2CorrectPairs[current.id];
    const isCorrect = stage2Selected === correctOptionId;
    const currentIndex = stage2ItemIds.length - stage2Drill.roundItems.length + 1;
    const progressPct = Math.round((currentIndex / stage2ItemIds.length) * 100);

    return (
      <div className="card" style={{ padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="pill pill-primary">Stage 2 of 3</span>
            <span className="pill">Matching Drill</span>
          </div>
          <span className="muted" style={{ fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
            {currentIndex} / {stage2ItemIds.length}
          </span>
        </div>

        <div className="progress-bar" style={{ marginBottom: "1.75rem", height: "6px" }}>
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.08) 100%)",
            border: "1px solid rgba(99, 102, 241, 0.25)",
            borderRadius: "var(--radius-md)",
            padding: "1.25rem",
            marginBottom: "1.5rem",
            textAlign: "center",
          }}
        >
          <span className="muted" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
            Match the term
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

        <div className="options-grid">
          {payload.stage2.options.map((option, idx) => {
            let cls = "option-btn";
            const isThisCorrect = revealed && option.id === correctOptionId;
            const isThisWrong = revealed && option.id === stage2Selected && !isCorrect;

            if (revealed) {
              if (isThisCorrect) cls += " correct";
              else if (isThisWrong) cls += " incorrect";
            } else if (option.id === stage2Selected) {
              cls += " selected";
            }

            return (
              <button
                key={option.id}
                type="button"
                className={cls}
                disabled={revealed}
                onClick={() => {
                  if (revealed) return;
                  setStage2Selected(option.id);
                  if (option.id === correctOptionId) playCorrect();
                  else playWrong();
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

                {revealed && isThisCorrect && <IconCheck className="w-5 h-5" />}
                {revealed && isThisWrong && <IconX className="w-5 h-5" />}
              </button>
            );
          })}
        </div>

        {revealed && (
          <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <span style={{ color: isCorrect ? "#34d399" : "#fda4af", fontWeight: 700 }}>
              {isCorrect ? "✓ Correct match!" : "✕ Incorrect."}
            </span>
            <button
              type="button"
              className="btn"
              style={{ padding: "0.7rem 1.5rem" }}
              onClick={() => {
                stage2Drill.submitAnswer(current.id, stage2Selected!, stage2Selected === correctOptionId);
                setStage2Selected(null);
              }}
            >
              <span>Continue</span>
              <IconArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Stage 3: Recall / Multiple Choice Drill
  const currentId = stage3Drill.roundItems[0];
  const current = payload.stage3.questions.find((q) => q.id === currentId);
  if (!current) return null;
  const revealed = stage3Selected !== null;
  const correctOptionId = answerKey.stage3Answers[current.id];
  const isCorrect = stage3Selected === correctOptionId;
  const currentIndex = stage3QuestionIds.length - stage3Drill.roundItems.length + 1;
  const progressPct = Math.round((currentIndex / stage3QuestionIds.length) * 100);

  return (
    <div className="card" style={{ padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className="pill pill-primary">Stage 3 of 3</span>
          <span className="pill">Active Recall</span>
        </div>
        <span className="muted" style={{ fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
          {currentIndex} / {stage3QuestionIds.length}
        </span>
      </div>

      <div className="progress-bar" style={{ marginBottom: "1.75rem", height: "6px" }}>
        <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <h3 className="title" style={{ fontSize: "1.35rem", lineHeight: 1.4, margin: 0 }}>
          {current.prompt}
        </h3>
        <SpeakButton text={current.prompt} lang={languageCode} />
      </div>

      {current.hint && (
        <div className="alert alert-info" style={{ marginBottom: "1rem", padding: "0.6rem 0.9rem" }}>
          <span>💡 Hint: {current.hint}</span>
        </div>
      )}

      <div className="options-grid">
        {current.options.map((option, idx) => {
          let cls = "option-btn";
          const isThisCorrect = revealed && option.id === correctOptionId;
          const isThisWrong = revealed && option.id === stage3Selected && !isCorrect;

          if (revealed) {
            if (isThisCorrect) cls += " correct";
            else if (isThisWrong) cls += " incorrect";
          } else if (option.id === stage3Selected) {
            cls += " selected";
          }

          return (
            <button
              key={option.id}
              type="button"
              className={cls}
              disabled={revealed}
              onClick={() => {
                if (revealed) return;
                setStage3Selected(option.id);
                if (option.id === correctOptionId) playCorrect();
                else playWrong();
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

              {revealed && isThisCorrect && <IconCheck className="w-5 h-5" />}
              {revealed && isThisWrong && <IconX className="w-5 h-5" />}
            </button>
          );
        })}
      </div>

      {revealed && (
        <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <span style={{ color: isCorrect ? "#34d399" : "#fda4af", fontWeight: 700 }}>
            {isCorrect ? "✓ Excellent recall!" : "✕ Incorrect."}
          </span>
          <button
            type="button"
            className="btn"
            style={{ padding: "0.7rem 1.5rem" }}
            onClick={() => {
              stage3Drill.submitAnswer(current.id, stage3Selected!, stage3Selected === correctOptionId);
              setStage3Selected(null);
            }}
          >
            <span>Continue</span>
            <IconArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
