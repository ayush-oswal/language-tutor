import Link from "next/link";
import type { SessionOverview } from "@lt/core";
import { IconArrowRight, IconBook } from "./Icons";
import { knownPct, LEVEL_NAMES } from "@/lib/levels";

// Flat brand colours per language (yellow / pink / teal family).
const LANGUAGE_GRADIENTS: Record<string, string> = {
  spanish: "var(--yellow)",
  french: "var(--pink)",
  german: "var(--teal)",
  japanese: "var(--pink)",
  italian: "var(--teal)",
  russian: "var(--yellow)",
  chinese: "var(--coral)",
};

export function languageGradient(name: string): string {
  return LANGUAGE_GRADIENTS[name.toLowerCase()] ?? "var(--pink)";
}

export function LanguageAvatar({ name }: { name: string }) {
  return (
    <div
      style={{
        width: "52px",
        height: "52px",
        border: "var(--bw) solid var(--ink)",
        borderRadius: 0,
        background: languageGradient(name),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: "1rem",
        color: "var(--ink)",
        boxShadow: "3px 3px 0 var(--ink)",
        letterSpacing: "0.05em",
        flexShrink: 0,
      }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function SessionCard({ session }: { session: SessionOverview }) {
  const current = session.levelProgress.find((lp) => lp.level === session.currentLevel);
  const pct = knownPct(current);

  return (
    <Link href={`/sessions/${session.id}`} className="card card-link" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <LanguageAvatar name={session.language.name} />
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
                {session.language.name}
              </h3>
              <span className="muted" style={{ fontSize: "0.8rem" }}>
                {LEVEL_NAMES[session.currentLevel]}
              </span>
            </div>
          </div>
          <span className="pill pill-level">{session.currentLevel}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.85rem", margin: "1.25rem 0 0.6rem" }}>
          <IconBook className="w-4 h-4" />
          <span>
            <strong>{pct}%</strong> of {session.currentLevel} words known ({current?.total ?? 0} words)
          </span>
        </div>
        <div className="progress-bar" style={{ height: "6px" }}>
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div
        style={{
          marginTop: "1.25rem",
          paddingTop: "1rem",
          borderTop: "var(--bw) dashed var(--ink)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "var(--ink)",
          fontSize: "0.85rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        <span>Open Dashboard</span>
        <IconArrowRight className="w-4 h-4" />
      </div>
    </Link>
  );
}
