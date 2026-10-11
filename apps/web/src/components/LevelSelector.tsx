"use client";

import { useState } from "react";
import type { CEFRLevel, SessionOverview } from "@lt/core";
import { IconLayers } from "./Icons";
import { useApiClient } from "@/lib/hooks/useApiClient";
import { knownPct, LEVEL_NAMES } from "@/lib/levels";

export function LevelSelector({ session, onChanged }: { session: SessionOverview; onChanged: () => void }) {
  const client = useApiClient();
  const [pendingLevel, setPendingLevel] = useState<CEFRLevel | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(level: CEFRLevel) {
    setPendingLevel(level);
    setError(null);
    try {
      await client.changeLevel(session.id, level);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change level");
    } finally {
      setPendingLevel(null);
    }
  }

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
        <IconLayers className="w-4 h-4" />
        <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>Your Level</h3>
      </div>
      <p className="muted" style={{ fontSize: "0.85rem", marginBottom: "1.1rem" }}>
        New words come from your current level; revision covers your level and everything below it. Moving up
        treats unseen words below your new level as familiar.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {session.levelProgress.map((lp) => {
          const isCurrent = lp.level === session.currentLevel;
          const pct = knownPct(lp);
          return (
            <div
              key={lp.level}
              style={{
                display: "grid",
                gridTemplateColumns: "3rem 1fr auto",
                alignItems: "center",
                gap: "0.85rem",
                padding: "0.6rem 0.8rem",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${isCurrent ? "rgba(168, 85, 247, 0.4)" : "var(--border-subtle)"}`,
                background: isCurrent ? "rgba(168, 85, 247, 0.08)" : "transparent",
              }}
            >
              <span className="pill pill-level" style={{ justifyContent: "center" }}>
                {lp.level}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.3rem", gap: "0.5rem" }}>
                  <span style={{ color: "var(--text-main)", fontWeight: 600 }}>{LEVEL_NAMES[lp.level]}</span>
                  <span className="muted mono">
                    {lp.total === 0 ? "No words yet" : `${pct}% known · ${lp.total} words`}
                  </span>
                </div>
                <div className="progress-bar" style={{ height: "6px" }}>
                  <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
              {isCurrent ? (
                <span className="pill pill-primary" style={{ fontSize: "0.7rem" }}>
                  Current
                </span>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                  disabled={pendingLevel !== null || lp.total === 0}
                  title={lp.total === 0 ? "No words at this level yet" : undefined}
                  onClick={() => handleChange(lp.level)}
                >
                  {pendingLevel === lp.level ? "Switching..." : "Switch"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginTop: "0.75rem" }}>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
