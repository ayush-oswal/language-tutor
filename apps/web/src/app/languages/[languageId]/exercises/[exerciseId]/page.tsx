"use client";

import Link from "next/link";
import { use, useState } from "react";
import type { ExerciseResult } from "@lt/core";
import { ExerciseReview } from "@/components/exercises/ExerciseReview";
import { exerciseRegistry } from "@/components/exercises/registry";
import { IconArrowLeft, IconArrowRight, IconBook, IconCheck, IconSparkles, IconTrophy } from "@/components/Icons";
import { useApiClient } from "@/lib/hooks/useApiClient";
import { useExercise } from "@/lib/hooks/useExercises";
import { useLanguage } from "@/lib/hooks/useLanguage";

const EXERCISE_TYPE_LABELS: Record<string, string> = {
  NEW_WORD_LEARNING: "New Word Learning",
  MATCHING: "Matching Drill",
  MULTIPLE_CHOICE: "Multiple Choice Drill",
  TRANSLATION: "Translation Practice",
  FILL_BLANK: "Fill in the Blank",
  STORY: "Interactive Story",
};

export default function ExercisePage({
  params,
}: {
  params: Promise<{ languageId: string; exerciseId: string }>;
}) {
  const { languageId, exerciseId } = use(params);
  const { language } = useLanguage(languageId);
  const client = useApiClient();
  const { exercise, isLoading, mutate } = useExercise(exerciseId);
  const [result, setResult] = useState<ExerciseResult | null>(null);
  const [retaking, setRetaking] = useState(false);

  if (isLoading || !exercise) {
    return (
      <main className="container">
        <div className="card empty-state">
          <div className="empty-state-icon">
            <IconSparkles className="w-6 h-6" />
          </div>
          <p style={{ fontWeight: 600, color: "var(--text-main)" }}>Loading your session...</p>
        </div>
      </main>
    );
  }

  const Component = exerciseRegistry[exercise.type];
  const typeLabel = EXERCISE_TYPE_LABELS[exercise.type] ?? "Language Drill";

  return (
    <main className="container" style={{ maxWidth: "800px" }}>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">My Languages</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href={`/languages/${languageId}`}>{language?.name ?? "…"}</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-active">{typeLabel}</span>
      </nav>

      {result ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#34d399",
              margin: "0 auto 1rem",
            }}
          >
            <IconTrophy className="w-8 h-8" />
          </div>

          <h2 className="title" style={{ fontSize: "1.8rem" }}>
            Session Complete!
          </h2>
          <p className="muted" style={{ maxWidth: "420px", margin: "0 auto 1.5rem" }}>
            Great job practicing {language?.name ?? "your language"}. Your spaced repetition progress has been recorded.
          </p>

          <div className="score-circle">
            <span className="score-value">
              {Math.round(result.attempt.percentage)}%
            </span>
            <span className="muted" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Final Score
            </span>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "1.5rem",
              background: "rgba(255, 255, 255, 0.03)",
              padding: "0.75rem 1.5rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              marginBottom: "2rem",
            }}
          >
            <div>
              <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#34d399", fontFamily: "var(--font-mono)" }}>
                {result.attempt.score}
              </span>
              <span className="muted" style={{ fontSize: "0.8rem", marginLeft: "0.3rem" }}>Correct</span>
            </div>
            <div style={{ width: "1px", height: "20px", background: "var(--border-subtle)" }} />
            <div>
              <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", fontFamily: "var(--font-mono)" }}>
                {result.attempt.questionResults.length}
              </span>
              <span className="muted" style={{ fontSize: "0.8rem", marginLeft: "0.3rem" }}>Questions</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={`/languages/${languageId}`}>
              <button type="button" className="btn" style={{ padding: "0.75rem 1.5rem" }}>
                <span>Back to Dashboard</span>
                <IconArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href={`/languages/${languageId}/vocabulary`}>
              <button type="button" className="btn btn-secondary" style={{ padding: "0.75rem 1.5rem" }}>
                <IconBook className="w-4 h-4" />
                <span>Review Vocabulary</span>
              </button>
            </Link>
          </div>
        </div>
      ) : exercise.attempts.length > 0 && !retaking ? (
        <ExerciseReview exercise={exercise} attempt={exercise.attempts[0]} onRetake={() => setRetaking(true)} />
      ) : (
        <Component
          exercise={exercise}
          languageCode={language?.languageCode}
          onSubmit={async (answers) => {
            const res = await client.completeExercise(exerciseId, answers);
            setRetaking(false);
            setResult(res);
            mutate();
          }}
        />
      )}
    </main>
  );
}
