import Link from "next/link";
import type { LanguageSummary } from "@lt/core";
import { IconArrowRight, IconBook, IconSparkles } from "./Icons";

const LANGUAGE_GRADIENTS: Record<string, string> = {
  spanish: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
  french: "linear-gradient(135deg, #3b82f6 0%, #ef4444 100%)",
  german: "linear-gradient(135deg, #eab308 0%, #ef4444 100%)",
  japanese: "linear-gradient(135deg, #ec4899 0%, #ef4444 100%)",
  italian: "linear-gradient(135deg, #10b981 0%, #ef4444 100%)",
  russian: "linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)",
  chinese: "linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)",
};

export function LanguageCard({ language }: { language: LanguageSummary }) {
  const code = language.name.slice(0, 2).toUpperCase();
  const lowerName = language.name.toLowerCase();
  const avatarGradient = LANGUAGE_GRADIENTS[lowerName] ?? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)";

  return (
    <Link href={`/languages/${language.id}`} className="card card-link" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: avatarGradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "1rem",
                color: "white",
                boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
                letterSpacing: "0.05em",
              }}
            >
              {code}
            </div>
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
                {language.name}
              </h3>
              <span className="muted" style={{ fontSize: "0.8rem" }}>
                Target Language
              </span>
            </div>
          </div>
          <span className="pill pill-level">{language.currentLevel}</span>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center", margin: "1.25rem 0 0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            <IconBook className="w-4 h-4" />
            <span><strong>{language.wordCount}</strong> words in bank</span>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "1.25rem",
          paddingTop: "1rem",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "var(--primary-light)",
          fontSize: "0.85rem",
          fontWeight: 600,
        }}
      >
        <span>Open Dashboard</span>
        <IconArrowRight className="w-4 h-4" />
      </div>
    </Link>
  );
}
