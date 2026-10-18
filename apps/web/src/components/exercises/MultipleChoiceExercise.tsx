"use client";

import { useEffect, useState } from "react";
import type {
  MultipleChoiceAnswerKey,
  MultipleChoicePayload,
  MultipleChoiceQuestion,
} from "@lt/core";
import { IconSparkles } from "../Icons";
import { SpeakButton } from "../SpeakButton";
import { useDrillUntilCorrect } from "@/lib/hooks/useDrillUntilCorrect";
import { useSoundEffects } from "@/lib/hooks/useSoundEffects";
import { CheckFooter, OptionList, optionSpeechLang } from "./OptionList";
import type { ExerciseComponentProps } from "./types";

export function MultipleChoiceExercise({ exercise, onSubmit, languageCode }: ExerciseComponentProps) {
  const payload = exercise.payload as unknown as MultipleChoicePayload;
  const answerKey = exercise.answerKey as unknown as MultipleChoiceAnswerKey;
  const questionIds = payload.questions.map((q) => q.id);

  const { roundItems, firstAttempt, submitAnswer, isComplete } = useDrillUntilCorrect<string>(questionIds);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
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

  const correctOptionId = answerKey.answers[current.id];
  const isCorrect = selected === correctOptionId;
  const currentIndex = questionIds.length - roundItems.length + 1;
  const progressPct = Math.round((currentIndex / questionIds.length) * 100);

  function handleCheck() {
    if (!selected) return;
    setRevealed(true);
    if (isCorrect) playCorrect();
    else playWrong();
  }

  function handleContinue() {
    if (!selected || !current) return;
    submitAnswer(current.id, selected, isCorrect);
    setSelected(null);
    setRevealed(false);
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

      <OptionList
        options={current.options}
        selectedId={selected}
        correctOptionId={correctOptionId}
        revealed={revealed}
        speakLang={optionSpeechLang(current.optionLanguage, languageCode)}
        onSelect={setSelected}
      />

      <CheckFooter
        revealed={revealed}
        canCheck={selected !== null}
        isCorrect={isCorrect}
        onCheck={handleCheck}
        onContinue={handleContinue}
        correctText="✓ Brilliant! Correct answer."
        wrongText="✕ Not quite. Review the highlighted answer above."
      />
    </div>
  );
}
