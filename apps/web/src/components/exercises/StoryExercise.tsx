"use client";

import { useEffect, useState } from "react";
import type { StoryAnswerKey, StoryPayload } from "@lt/core";
import { IconArrowLeft, IconArrowRight, IconCheck, IconLanguage, IconSparkles, IconX } from "../Icons";
import { SpeakButton } from "../SpeakButton";
import { useSpeech } from "@/lib/hooks/useSpeech";
import { useSoundEffects } from "@/lib/hooks/useSoundEffects";
import { answersMatch } from "@/lib/textMatch";
import type { ExerciseComponentProps } from "./types";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

export function StoryExercise({ exercise, onSubmit, languageCode }: ExerciseComponentProps) {
  const payload = exercise.payload as unknown as StoryPayload;
  const answerKey = exercise.answerKey as unknown as StoryAnswerKey;
  const { speak } = useSpeech();
  const { playCorrect, playWrong } = useSoundEffects();

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);

  // Per-node-type transient UI state, reset whenever we advance to a new node.
  const [selected, setSelected] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [textRevealed, setTextRevealed] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [matchingIndex, setMatchingIndex] = useState(0);
  const [matchingSelected, setMatchingSelected] = useState<string | null>(null);
  const [matchingPairs, setMatchingPairs] = useState<Record<string, string>>({});

  const node = payload.nodes[index];
  const isLast = index === payload.nodes.length - 1;
  const progressPct = Math.round(((index + 1) / payload.nodes.length) * 100);

  // Only narrative scenes auto-play — questions stay silent by default so answering
  // isn't accidentally spoiled by hearing the target word/sentence read aloud;
  // the SpeakButton is still available on every node for the learner to use manually.
  useEffect(() => {
    if (node?.kind === "narrative") {
      speak(node.text, languageCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  if (!node) return null;

  function resetPerNodeState() {
    setSelected(null);
    setTextInput("");
    setTextRevealed(false);
    setShowTranslation(false);
    setMatchingIndex(0);
    setMatchingSelected(null);
    setMatchingPairs({});
  }

  async function handleAdvance(nextAnswers: Record<string, unknown>) {
    if (isLast) {
      setSubmitting(true);
      await onSubmit({ answers: nextAnswers }).catch(() => setSubmitting(false));
      return;
    }
    setIndex((i) => i + 1);
    resetPerNodeState();
  }

  function handleBack() {
    if (index === 0) return;
    setIndex((i) => i - 1);
    resetPerNodeState();
  }

  if (submitting) {
    return (
      <div className="card empty-state">
        <div className="empty-state-icon">
          <IconSparkles className="w-6 h-6" />
        </div>
        <p style={{ fontWeight: 600, color: "var(--text-main)" }}>Submitting story completion...</p>
      </div>
    );
  }

  const header = (label: string) => (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {index > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: "0.3rem 0.7rem", fontSize: "0.8rem" }}
              onClick={handleBack}
              title="Go back and re-read the previous scene"
            >
              <IconArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}
          <span className="pill pill-primary">
            Scene {index + 1} of {payload.nodes.length}
          </span>
          <span className="pill">{label}</span>
        </div>
        <span className="muted" style={{ fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
          {progressPct}% Complete
        </span>
      </div>
      <div className="progress-bar" style={{ marginBottom: "2rem", height: "6px" }}>
        <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
      </div>
    </>
  );

  const translationToggle = (text: string) => (
    <>
      <div style={{ marginTop: "0.75rem" }}>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem" }}
          onClick={() => setShowTranslation((v) => !v)}
        >
          <IconLanguage className="w-4 h-4" />
          <span>{showTranslation ? "Hide Translation" : "Show Translation"}</span>
        </button>
      </div>
      {showTranslation && (
        <p className="muted" style={{ marginTop: "0.75rem", fontSize: "0.95rem", lineHeight: 1.6, fontStyle: "italic" }}>
          {text}
        </p>
      )}
    </>
  );

  if (node.kind === "narrative") {
    return (
      <div className="card" style={{ padding: "2.25rem 2rem" }}>
        {header("Narrative")}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(99, 102, 241, 0.05) 100%)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "2rem",
            marginBottom: "2rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
            <SpeakButton text={node.text} lang={languageCode} size="sm" />
          </div>
          <p style={{ fontSize: "1.15rem", lineHeight: 1.8, color: "var(--text-main)", whiteSpace: "pre-line" }}>{node.text}</p>
          {node.translation && translationToggle(node.translation)}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="button" onClick={() => handleAdvance(answers)} className="btn" style={{ padding: "0.75rem 1.75rem" }}>
            <span>{isLast ? "Finish Story" : "Next Scene"}</span>
            <IconArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (node.questionType === "MULTIPLE_CHOICE") {
    const revealed = selected !== null;
    const keyEntry = answerKey.answers[node.id];
    const correctOptionId = keyEntry?.questionType === "MULTIPLE_CHOICE" ? keyEntry.correctOptionId : undefined;
    const isCorrect = selected === correctOptionId;

    return (
      <div className="card" style={{ padding: "2.25rem 2rem" }}>
        {header("Multiple Choice")}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <h3 className="title" style={{ fontSize: "1.35rem", lineHeight: 1.5, margin: 0 }}>
            {node.prompt}
          </h3>
          <SpeakButton text={node.prompt} lang={languageCode} />
        </div>
        {node.translation && translationToggle(node.translation)}
        {node.hint && (
          <div className="alert alert-info" style={{ marginTop: "1rem", marginBottom: "1rem", padding: "0.6rem 0.9rem" }}>
            <span>💡 Hint: {node.hint}</span>
          </div>
        )}
        <div className="options-grid">
          {node.options.map((option, idx) => {
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
                onClick={() => {
                  setSelected(option.id);
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
          <div style={{ marginTop: "1.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <span style={{ color: isCorrect ? "#34d399" : "#fda4af", fontWeight: 700 }}>
              {isCorrect ? "✓ Correct!" : "✕ Not quite right."}
            </span>
            <button
              type="button"
              className="btn"
              style={{ padding: "0.75rem 1.75rem" }}
              onClick={() => {
                const next = { ...answers, [node.id]: selected! };
                setAnswers(next);
                handleAdvance(next);
              }}
            >
              <span>{isLast ? "Finish Story" : "Next Scene"}</span>
              <IconArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  if (node.questionType === "TRANSLATION" || node.questionType === "FILL_BLANK") {
    const keyEntry = answerKey.answers[node.id];
    const accepted = keyEntry?.questionType === "TRANSLATION" || keyEntry?.questionType === "FILL_BLANK" ? keyEntry.acceptedAnswers : [];
    const isCorrect = answersMatch(textInput, accepted);
    const label = node.questionType === "TRANSLATION" ? "Translation" : "Fill in the Blank";

    function handleCheck() {
      if (!textInput.trim()) return;
      setTextRevealed(true);
      if (isCorrect) playCorrect();
      else playWrong();
    }
    function handleContinue() {
      const next = { ...answers, [node.id]: textInput };
      setAnswers(next);
      handleAdvance(next);
    }

    return (
      <div className="card" style={{ padding: "2.25rem 2rem" }}>
        {header(label)}
        {node.questionType === "TRANSLATION" ? (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              borderRadius: "var(--radius-md)",
              padding: "1.5rem",
              marginBottom: "1.5rem",
              textAlign: "center",
            }}
          >
            <span className="muted" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
              Translate into target language
            </span>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: "0.4rem" }}>
              <h3 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, color: "var(--text-main)" }}>&ldquo;{node.prompt}&rdquo;</h3>
              <SpeakButton text={node.prompt} lang={node.direction === "TO_NATIVE" ? languageCode : "en-US"} />
            </div>
          </div>
        ) : (
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
                text={node.sentence.replace(/___/g, textRevealed ? (answersMatch(textInput, accepted) ? textInput : accepted[0] ?? "...") : "...")}
                lang={languageCode}
                size="sm"
              />
            </div>
            <p style={{ fontSize: "1.25rem", fontWeight: 600, lineHeight: 1.6, color: "var(--text-main)" }}>
              {node.sentence.split("___").map((part, i, arr) => (
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
                      {textInput || "______"}
                    </span>
                  )}
                </span>
              ))}
            </p>
            {node.translation && translationToggle(node.translation)}
          </div>
        )}

        {node.hint && (
          <div className="alert alert-info" style={{ marginBottom: "1rem", padding: "0.6rem 0.9rem" }}>
            <span>💡 Hint: {node.hint}</span>
          </div>
        )}

        <input
          style={{ width: "100%", fontSize: "1rem", padding: "0.85rem 1.15rem" }}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          disabled={textRevealed}
          placeholder={node.questionType === "TRANSLATION" ? "Type your translation..." : "Type the missing word..."}
        />

        {textRevealed && (
          <div className={`alert ${isCorrect ? "alert-success" : "alert-danger"}`} style={{ marginTop: "1rem" }}>
            <span>{isCorrect ? "Correct!" : `Not quite — accepted: ${accepted.join(", ")}`}</span>
          </div>
        )}

        <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
          {!textRevealed ? (
            <button type="button" onClick={handleCheck} disabled={!textInput.trim()} className="btn" style={{ padding: "0.7rem 1.5rem" }}>
              <span>Check</span>
            </button>
          ) : (
            <button type="button" onClick={handleContinue} className="btn" style={{ padding: "0.7rem 1.5rem" }}>
              <span>{isLast ? "Finish Story" : "Next Scene"}</span>
              <IconArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (node.questionType !== "MATCHING" || !Array.isArray(node.items)) {
    // Unrecognized node shape (e.g. an exercise generated by an older/incompatible
    // schema version) — fail gracefully instead of crashing the page.
    throw new Error(`Unsupported story node: ${JSON.stringify({ id: node.id, questionType: (node as { questionType?: string }).questionType })}`);
  }

  // Walk this MATCHING node's 2-4 pairs one at a time before advancing.
  const currentItem = node.items[matchingIndex];
  if (!currentItem) return null;
  const keyEntry = answerKey.answers[node.id];
  const correctPairs = keyEntry?.questionType === "MATCHING" ? keyEntry.correctPairs : {};
  const revealed = matchingSelected !== null;
  const correctOptionId = correctPairs[currentItem.id];
  const isCorrect = matchingSelected === correctOptionId;
  const isLastItemInNode = matchingIndex === node.items.length - 1;

  function handleContinueMatching() {
    const nextPairs = { ...matchingPairs, [currentItem.id]: matchingSelected! };
    setMatchingPairs(nextPairs);
    setMatchingSelected(null);
    if (isLastItemInNode) {
      const next = { ...answers, [node.id]: { pairs: nextPairs } };
      setAnswers(next);
      handleAdvance(next);
    } else {
      setMatchingIndex((i) => i + 1);
    }
  }

  return (
    <div className="card" style={{ padding: "2.25rem 2rem" }}>
      {header("Matching")}
      <p className="muted" style={{ marginBottom: "0.5rem" }}>
        Match {matchingIndex + 1} of {node.items.length}
      </p>
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
          Find the match for
        </span>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: "0.3rem" }}>
          <h3 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, color: "var(--text-main)" }}>{currentItem.text}</h3>
          <SpeakButton text={currentItem.text} lang={languageCode} />
        </div>
      </div>
      {currentItem.hint && (
        <div className="alert alert-info" style={{ marginBottom: "1rem", padding: "0.6rem 0.9rem" }}>
          <span>💡 Hint: {currentItem.hint}</span>
        </div>
      )}
      <div className="options-grid">
        {node.options.map((option, idx) => {
          let cls = "option-btn";
          const isThisCorrect = revealed && option.id === correctOptionId;
          const isThisWrong = revealed && option.id === matchingSelected && !isCorrect;
          if (revealed) {
            if (isThisCorrect) cls += " correct";
            else if (isThisWrong) cls += " incorrect";
          } else if (option.id === matchingSelected) {
            cls += " selected";
          }
          return (
            <button
              key={option.id}
              type="button"
              className={cls}
              disabled={revealed}
              onClick={() => {
                setMatchingSelected(option.id);
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
        <div style={{ marginTop: "1.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <span style={{ color: isCorrect ? "#34d399" : "#fda4af", fontWeight: 700 }}>
            {isCorrect ? "✓ Correct match!" : "✕ Incorrect."}
          </span>
          <button type="button" className="btn" style={{ padding: "0.75rem 1.75rem" }} onClick={handleContinueMatching}>
            <span>{isLastItemInNode ? (isLast ? "Finish Story" : "Next Scene") : "Next Match"}</span>
            <IconArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
