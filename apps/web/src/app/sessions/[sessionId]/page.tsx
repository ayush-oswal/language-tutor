"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import type { CEFRLevel } from "@lt/core";
import { ExerciseListSidebar } from "@/components/ExerciseListSidebar";
import { LevelSelector } from "@/components/LevelSelector";
import { ProgressStats } from "@/components/ProgressStats";
import { IconArrowRight, IconBook, IconLightbulb, IconSparkles } from "@/components/Icons";
import { useSession } from "@/lib/hooks/useSession";
import { useExercises } from "@/lib/hooks/useExercises";
import { CEFR_LEVELS } from "@/lib/levels";

export default function SessionDashboardPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const { session, isLoading: sessionLoading, mutate } = useSession(sessionId, { poll: true });
  const [level, setLevel] = useState<CEFRLevel | "">("");
  const [levelInitialized, setLevelInitialized] = useState(false);
  const { exercises } = useExercises(sessionId, { level: level || undefined });

  // Default the level filter to the learner's current level, once, when the session loads.
  useEffect(() => {
    if (session && !levelInitialized) {
      setLevel(session.currentLevel);
      setLevelInitialized(true);
    }
  }, [session, levelInitialized]);

  const selectableLevels = session ? CEFR_LEVELS.slice(0, CEFR_LEVELS.indexOf(session.currentLevel) + 1) : [];

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
        <ExerciseListSidebar
          sessionId={sessionId}
          exercises={exercises ?? []}
          level={level}
          onLevelChange={setLevel}
          selectableLevels={selectableLevels}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div
            className="card"
            style={{ background: "var(--yellow-soft)", borderColor: "var(--ink)", padding: "1.1rem 1.25rem" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <IconLightbulb className="w-4 h-4" />
              <strong style={{ textTransform: "uppercase", fontSize: "0.85rem" }}>Note</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.88rem", lineHeight: 1.6, color: "var(--text-main)" }}>
              <li>Prompt your MCP client to learn new words, to expand your vocabulary.</li>
              <li>Use the exercises to revise and increase familiarity with already learned words.</li>
            </ul>
          </div>

          <ProgressStats session={session} />

          <LevelSelector session={session} onChanged={() => mutate()} />

          {/* Vocabulary Portal Card */}
          <div
            className="card"
            style={{
              background: "var(--pink-soft)",
              borderColor: "var(--ink)",
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
                  width: "52px",
                  height: "52px",
                  flexShrink: 0,
                  borderRadius: 0,
                  background: "var(--yellow)",
                  border: "var(--bw) solid var(--ink)",
                  boxShadow: "3px 3px 0 var(--ink)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--ink)",
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
