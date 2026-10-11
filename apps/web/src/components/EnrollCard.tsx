"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CEFRLevel, LanguageSummary } from "@lt/core";
import { IconPlus } from "./Icons";
import { LanguageAvatar } from "./SessionCard";
import { useApiClient } from "@/lib/hooks/useApiClient";
import { CEFR_LEVELS, LEVEL_NAMES } from "@/lib/levels";

export function EnrollCard({ language, onEnrolled }: { language: LanguageSummary; onEnrolled: () => void }) {
  const client = useApiClient();
  const router = useRouter();
  const [level, setLevel] = useState<CEFRLevel>("A1");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEnroll() {
    setSubmitting(true);
    setError(null);
    try {
      const session = await client.enroll(language.id, level);
      onEnrolled();
      router.push(`/sessions/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enroll");
      setSubmitting(false);
    }
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
        <LanguageAvatar name={language.name} />
        <div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>{language.name}</h3>
          <span className="muted" style={{ fontSize: "0.8rem" }}>
            {language.totalWords} {language.totalWords === 1 ? "word" : "words"} across all levels
          </span>
        </div>
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <span className="muted" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
          Starting level
        </span>
        <select value={level} onChange={(e) => setLevel(e.target.value as CEFRLevel)} disabled={submitting}>
          {CEFR_LEVELS.map((l) => (
            <option key={l} value={l}>
              {l} · {LEVEL_NAMES[l]} ({language.wordCountByLevel[l]} words)
            </option>
          ))}
        </select>
      </label>

      <p className="muted" style={{ fontSize: "0.8rem", margin: 0 }}>
        Words from levels below the one you pick are treated as already familiar; you&apos;ll still revise them.
      </p>

      <button type="button" className="btn" onClick={handleEnroll} disabled={submitting}>
        <IconPlus size={16} />
        <span>{submitting ? "Enrolling..." : `Enroll at ${level}`}</span>
      </button>

      {error && (
        <div className="alert alert-danger">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
