"use client";

import Link from "next/link";
import { use } from "react";
import { ExerciseListSidebar } from "@/components/ExerciseListSidebar";
import { LevelSelector } from "@/components/LevelSelector";
import { ProgressStats } from "@/components/ProgressStats";
import { IconArrowRight, IconBook, IconSparkles } from "@/components/Icons";
import { useSession } from "@/lib/hooks/useSession";
import { useExercises } from "@/lib/hooks/useExercises";

export default function SessionDashboardPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const { session, isLoading: sessionLoading, mutate } = useSession(sessionId);
  const { exercises } = useExercises(sessionId);

  if (sessionLoading || !session) {
    return (
      <main className="container">
        <div className="card empty-state">
          <div className="empty-state-icon">
            <IconSparkles className="w-6 h-6" />
          </div>
          <p style={{ fontWeight: 600, color: "var(--text-main)" }}>Loading language dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">My Languages</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-active">{session.language.name}</span>
      </nav>

      <div className="layout">
        <ExerciseListSidebar sessionId={sessionId} exercises={exercises ?? []} />

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <ProgressStats session={session} />

          <LevelSelector session={session} onChanged={() => mutate()} />

          {/* Vocabulary Portal Card */}
          <div
            className="card"
            style={{
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)",
              borderColor: "rgba(99, 102, 241, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "1.5rem",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "var(--primary-glow)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--primary-light)",
                }}
              >
                <IconBook className="w-6 h-6" />
              </div>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
                  Vocabulary Bank
                </h3>
                <p className="muted" style={{ fontSize: "0.85rem", marginTop: "0.2rem" }}>
                  Browse and search all <strong>{session.vocabularyStats.total} words</strong> up to{" "}
                  {session.currentLevel}.
                </p>
              </div>
            </div>

            <Link href={`/sessions/${sessionId}/vocabulary`}>
              <button type="button" className="btn" style={{ padding: "0.6rem 1.15rem" }}>
                <span>View Full Vocabulary</span>
                <IconArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
