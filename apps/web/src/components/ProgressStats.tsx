import type { LanguageDetail } from "@lt/core";
import { IconBook, IconBrain, IconTrophy } from "./Icons";

export function ProgressStats({ language }: { language: LanguageDetail }) {
  const stats = language.vocabularyStats;
  const total = stats.total;
  const masteredPct = total === 0 ? 0 : Math.round((stats.mastered / total) * 100);
  const familiarPct = total === 0 ? 0 : Math.round((stats.familiar / total) * 100);
  const learningPct = total === 0 ? 0 : Math.round((stats.learning / total) * 100);
  const newPct = total === 0 ? 0 : Math.max(0, 100 - (masteredPct + familiarPct + learningPct));

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <h2 className="title" style={{ fontSize: "1.4rem", margin: 0 }}>
              {language.name}
            </h2>
            <span className="pill pill-level">{language.currentLevel}</span>
          </div>
          <p className="muted" style={{ marginTop: "0.2rem" }}>
            Vocabulary Mastery & Progress Overview
          </p>
        </div>

        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#34d399", fontFamily: "var(--font-mono)" }}>
            {masteredPct}%
          </span>
          <p className="muted" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>Mastered</p>
        </div>
      </div>

      {/* Multi-segment breakdown progress bar */}
      <div style={{ margin: "1.25rem 0 0.75rem" }}>
        <div className="multi-progress-bar" style={{ height: "10px" }}>
          {masteredPct > 0 && (
            <div
              className="multi-progress-segment"
              style={{ width: `${masteredPct}%`, background: "var(--success)" }}
              title={`Mastered: ${stats.mastered}`}
            />
          )}
          {familiarPct > 0 && (
            <div
              className="multi-progress-segment"
              style={{ width: `${familiarPct}%`, background: "var(--info)" }}
              title={`Familiar: ${stats.familiar}`}
            />
          )}
          {learningPct > 0 && (
            <div
              className="multi-progress-segment"
              style={{ width: `${learningPct}%`, background: "var(--warning)" }}
              title={`Learning: ${stats.learning}`}
            />
          )}
          {newPct > 0 && (
            <div
              className="multi-progress-segment"
              style={{ width: `${newPct}%`, background: "rgba(255, 255, 255, 0.15)" }}
              title={`New: ${stats.new}`}
            />
          )}
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="stats-grid">
        <div className="stat-box">
          <span className="stat-box-value" style={{ color: "#34d399" }}>{stats.mastered}</span>
          <span className="stat-box-label" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34d399" }} />
            Mastered
          </span>
        </div>

        <div className="stat-box">
          <span className="stat-box-value" style={{ color: "#38bdf8" }}>{stats.familiar}</span>
          <span className="stat-box-label" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#38bdf8" }} />
            Familiar
          </span>
        </div>

        <div className="stat-box">
          <span className="stat-box-value" style={{ color: "#fbbf24" }}>{stats.learning}</span>
          <span className="stat-box-label" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fbbf24" }} />
            Learning
          </span>
        </div>

        <div className="stat-box">
          <span className="stat-box-value" style={{ color: "var(--text-muted)" }}>{stats.new}</span>
          <span className="stat-box-label" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(255,255,255,0.3)" }} />
            New
          </span>
        </div>
      </div>
    </div>
  );
}
