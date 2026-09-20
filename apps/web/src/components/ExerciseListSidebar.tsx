import Link from "next/link";
import type { ExerciseStatus, ExerciseSummary, ExerciseType } from "@lt/core";
import { IconBook, IconBrain, IconCheck, IconClock, IconLayers, IconPlay, IconSparkles } from "./Icons";

const GROUP_LABELS: Record<ExerciseType, string> = {
  NEW_WORD_LEARNING: "New Words",
  MATCHING: "Matching Pairs",
  MULTIPLE_CHOICE: "Multiple Choice",
  TRANSLATION: "Translation",
  FILL_BLANK: "Fill in the Blank",
  STORY: "Stories & Scenarios",
};

const GROUP_ORDER: ExerciseType[] = [
  "NEW_WORD_LEARNING",
  "MATCHING",
  "MULTIPLE_CHOICE",
  "TRANSLATION",
  "FILL_BLANK",
  "STORY",
];

const STATUS_LABEL: Record<ExerciseStatus, string> = {
  NEW: "New",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

export function ExerciseListSidebar({
  languageId,
  exercises,
}: {
  languageId: string;
  exercises: ExerciseSummary[];
}) {
  const byType = new Map<ExerciseType, ExerciseSummary[]>();
  for (const type of GROUP_ORDER) byType.set(type, []);
  for (const exercise of exercises) {
    byType.get(exercise.type)?.push(exercise);
  }

  const hasAny = exercises.length > 0;
  const completedCount = exercises.filter((e) => e.status === "COMPLETED").length;

  return (
    <aside className="card" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <IconLayers className="w-4 h-4" />
          <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>
            Practice Sessions
          </h3>
        </div>
        {hasAny && (
          <span className="pill" style={{ fontSize: "0.7rem" }}>
            {completedCount}/{exercises.length} Done
          </span>
        )}
      </div>

      {!hasAny && (
        <div className="empty-state" style={{ padding: "1.5rem 0.5rem", textAlign: "left" }}>
          <p className="muted" style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
            No exercises generated yet. Ask your assistant to generate exercises or teach new words!
          </p>
        </div>
      )}

      {GROUP_ORDER.filter((type) => (byType.get(type)?.length ?? 0) > 0).map((type) => {
        const list = byType.get(type)!;
        return (
          <div className="sidebar-group" key={type}>
            <div className="sidebar-group-header">
              <span>{GROUP_LABELS[type]}</span>
              <span className="pill" style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem" }}>
                {list.length}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {list.map((exercise, i) => {
                const isCompleted = exercise.status === "COMPLETED";
                const isInProgress = exercise.status === "IN_PROGRESS";

                return (
                  <Link
                    key={exercise.id}
                    href={`/languages/${languageId}/exercises/${exercise.id}`}
                    className="sidebar-item"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: isCompleted
                            ? "var(--success-bg)"
                            : isInProgress
                            ? "var(--warning-bg)"
                            : "rgba(255,255,255,0.05)",
                          color: isCompleted
                            ? "#34d399"
                            : isInProgress
                            ? "#fbbf24"
                            : "var(--text-muted)",
                        }}
                      >
                        {isCompleted ? (
                          <IconCheck className="w-3.5 h-3.5" />
                        ) : isInProgress ? (
                          <IconClock className="w-3.5 h-3.5" />
                        ) : (
                          <IconPlay className="w-3 h-3" />
                        )}
                      </div>
                      <span style={{ fontWeight: 500 }}>
                        Session #{list.length - i}
                      </span>
                    </div>

                    <span className={`pill pill-status-${exercise.status}`} style={{ fontSize: "0.7rem" }}>
                      {STATUS_LABEL[exercise.status]}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </aside>
  );
}
