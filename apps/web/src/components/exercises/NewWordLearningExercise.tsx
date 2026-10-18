"use client";

import { useEffect, useState } from "react";
import type { NewWordLearningAnswerKey, NewWordLearningPayload } from "@lt/core";
import { IconArrowRight, IconSparkles } from "../Icons";
import { SpeakButton } from "../SpeakButton";
import { useDrillUntilCorrect } from "@/lib/hooks/useDrillUntilCorrect";
import { useSoundEffects } from "@/lib/hooks/useSoundEffects";
import { shuffle } from "@/lib/shuffle";
import { CheckFooter, NATIVE_SPEECH_LANG, OptionList } from "./OptionList";
import type { ExerciseComponentProps } from "./types";

type Stage = "present" | "stage2" | "stage3";
const BLANK = /_{3,}/;

function fillBlank(sentence: string, answer: string): string {
  return sentence.replace(BLANK, answer);
}

/** Renders the gap as a blank line, or highlights the answer once it is revealed. */
function renderSentence(sentence: string, answer: string | null) {
  const [before, after = ""] = sentence.split(BLANK);
  return (
    <>
      {before}
      {answer === null ? (
        <span style={{ display: "inline-block", minWidth: "4ch", borderBottom: "2px solid var(--text-muted)" }}>&nbsp;</span>
      ) : (
        <span style={{ color: "#34d399", fontWeight: 800 }}>{answer}</span>
      )}
      {after}
    </>
  );
}

export function NewWordLearningExercise({ exercise, onSubmit, languageCode }: ExerciseComponentProps) {
  const payload = exercise.payload as unknown as NewWordLearningPayload;
  const answerKey = exercise.answerKey as unknown as NewWordLearningAnswerKey;

  const [stage, setStage] = useState<Stage>("present");
  // The generator's option order often mirrors the question order, so it is never trusted. Shuffled once per
  // mount so the order stays put while the learner works through the drill.
  const [stage2Options] = useState(() => shuffle(payload.stage2.options));
  const [stage3Options] = useState(
    () => new Map(payload.stage3.questions.map((q) => [q.id, shuffle(q.options)])),
  );
  const [submitting, setSubmitting] = useState(false);

  const stage2ItemIds = payload.stage2.items.map((i) => i.id);
  const stage3QuestionIds = payload.stage3.questions.map((q) => q.id);

  const stage2Drill = useDrillUntilCorrect<string>(stage2ItemIds);
  const stage3Drill = useDrillUntilCorrect<string>(stage3QuestionIds);

  const [stage2Selected, setStage2Selected] = useState<string | null>(null);
  const [stage3Selected, setStage3Selected] = useState<string | null>(null);
  const [stage2Revealed, setStage2Revealed] = useState(false);
  const [stage3Revealed, setStage3Revealed] = useState(false);
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
            {payload.words.length} new words
          </span>
        </div>

        <h2 className="title" style={{ fontSize: "1.4rem", marginBottom: "0.4rem" }}>
          Study Your New Words
        </h2>
        <p className="muted" style={{ marginBottom: "1.5rem" }}>
          Read each word, its meaning and how it is used in the example sentences. You&apos;ll match the words, then
          fill them into these sentences.
        </p>

        <div className="flashcard-grid">
          {payload.words.map((w) => (
            <div key={w.wordId} className="flashcard">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <span className="flashcard-word">{w.word}</span>
                  <SpeakButton text={w.word} lang={languageCode} size="sm" />
                </div>
                <span className="pill" style={{ fontSize: "0.7rem" }}>
                  {w.partOfSpeech.toLowerCase()}
                  {w.gender ? ` · ${w.gender}` : ""}
                </span>
              </div>
              <p className="flashcard-translation">{w.translation}</p>
              {w.sentences.slice(0, 2).map((s, i) => (
                <div key={i} style={{ marginTop: "0.6rem", fontSize: "0.85rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--text-main)" }}>
                    <span>{s.sentence}</span>
                    <SpeakButton text={s.sentence} lang={languageCode} size="sm" />
                  </div>
                  <div className="muted" style={{ fontSize: "0.8rem" }}>
                    {s.translation}
                  </div>
                </div>
              ))}
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
    const revealed = stage2Revealed;
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

        {/* Options are the English translations */}
        <OptionList
          options={stage2Options}
          selectedId={stage2Selected}
          correctOptionId={correctOptionId}
          revealed={revealed}
          speakLang={NATIVE_SPEECH_LANG}
          onSelect={setStage2Selected}
        />

        <CheckFooter
          revealed={revealed}
          canCheck={stage2Selected !== null}
          isCorrect={isCorrect}
          onCheck={() => {
            setStage2Revealed(true);
            if (isCorrect) playCorrect();
            else playWrong();
          }}
          onContinue={() => {
            stage2Drill.submitAnswer(current.id, stage2Selected!, isCorrect);
            setStage2Selected(null);
            setStage2Revealed(false);
          }}
          correctText="✓ Correct match!"
          wrongText="✕ Incorrect."
        />
      </div>
    );
  }

  // Stage 3: Recall / Multiple Choice Drill
  const currentId = stage3Drill.roundItems[0];
  const current = payload.stage3.questions.find((q) => q.id === currentId);
  if (!current) return null;
  const revealed = stage3Revealed;
  const correctOptionId = answerKey.stage3Answers[current.id];
  const correctOptionText = current.options.find((o) => o.id === correctOptionId)?.text ?? "";
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

      <span className="muted" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
        {current.prompt}
      </span>

      <div
        style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.08) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.25)",
          borderRadius: "var(--radius-md)",
          padding: "1.25rem",
          margin: "0.4rem 0 1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
          <h3 className="title" style={{ fontSize: "1.35rem", lineHeight: 1.5, margin: 0 }}>
            {renderSentence(current.sentence, revealed ? correctOptionText : null)}
          </h3>
          {revealed && <SpeakButton text={fillBlank(current.sentence, correctOptionText)} lang={languageCode} />}
        </div>
        <p className="muted" style={{ margin: "0.5rem 0 0", fontSize: "0.9rem" }}>
          {current.sentenceTranslation}
        </p>
      </div>

      {current.hint && (
        <div className="alert alert-info" style={{ marginBottom: "1rem", padding: "0.6rem 0.9rem" }}>
          <span>💡 Hint: {current.hint}</span>
        </div>
      )}

      <OptionList
        options={stage3Options.get(current.id) ?? current.options}
        selectedId={stage3Selected}
        correctOptionId={correctOptionId}
        revealed={revealed}
        speakLang={languageCode}
        onSelect={setStage3Selected}
      />

      <CheckFooter
        revealed={revealed}
        canCheck={stage3Selected !== null}
        isCorrect={isCorrect}
        onCheck={() => {
          setStage3Revealed(true);
          if (isCorrect) playCorrect();
          else playWrong();
        }}
        onContinue={() => {
          stage3Drill.submitAnswer(current.id, stage3Selected!, isCorrect);
          setStage3Selected(null);
          setStage3Revealed(false);
        }}
        correctText="✓ Excellent recall!"
        wrongText="✕ Incorrect."
      />
    </div>
  );
}
