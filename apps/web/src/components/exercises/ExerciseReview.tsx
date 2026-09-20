import type { Exercise, ExerciseAttempt, QuestionResult } from "@lt/core";
import { resolveQuestionResults } from "./review";

export function ExerciseReview({
  exercise,
  attempt,
  onRetake,
}: {
  exercise: Exercise;
  attempt: ExerciseAttempt;
  onRetake: () => void;
}) {
  const questionResults = attempt.questionResults as unknown as QuestionResult[];
  const resolved = resolveQuestionResults(exercise, questionResults);

  return (
    <div className="card">
      <p className="title" style={{ fontSize: "1.1rem" }}>
        Previously completed
      </p>
      <p className="muted">
        Score: {attempt.score} / {resolved.length} ({Math.round(attempt.percentage)}%) &middot; submitted{" "}
        {attempt.completedAt ? new Date(attempt.completedAt).toLocaleString() : ""}
      </p>

      <div style={{ marginTop: "1rem" }}>
        {resolved.map((r) => (
          <div
            key={r.questionId}
            style={{
              padding: "0.6rem 0",
              borderBottom: "1px solid #2a2e38",
            }}
          >
            <p style={{ margin: 0 }}>{r.prompt}</p>
            <p className="muted" style={{ margin: "0.25rem 0 0" }}>
              Your answer: <strong style={{ color: r.correct ? "#7fd996" : "#e0544c" }}>{r.submittedLabel}</strong>
              {!r.correct && (
                <>
                  {" "}
                  &middot; Correct answer: <strong>{r.expectedLabel}</strong>
                </>
              )}
            </p>
          </div>
        ))}
      </div>

      <button type="button" onClick={onRetake} style={{ marginTop: "1.25rem" }}>
        Retake
      </button>
    </div>
  );
}
