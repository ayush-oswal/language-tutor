"use client";

import { useEffect, useState } from "react";
import type { WordSentence, WordWithProgress } from "@lt/core";
import { IconBook, IconX } from "./Icons";
import { SpeakButton } from "./SpeakButton";

function getSentences(raw: unknown): WordSentence[] {
  return Array.isArray(raw) ? (raw as WordSentence[]) : [];
}

function statusClassFor(status: WordWithProgress["progress"]["status"]): string {
  if (status === "MASTERED") return "pill-status-COMPLETED";
  if (status === "LEARNING" || status === "FAMILIAR") return "pill-status-IN_PROGRESS";
  return "pill-status-NEW";
}

function masteryColor(pct: number): string {
  if (pct >= 80) return "var(--success)";
  if (pct >= 40) return "var(--info)";
  return "var(--primary-gradient)";
}

function WordDetailModal({
  word,
  languageCode,
  onClose,
}: {
  word: WordWithProgress;
  languageCode?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const mastery = word.progress.mastery;
  const masteryPct = Math.round(mastery * 100);
  const timesSeen = word.progress.timesSeen;
  const timesCorrect = word.progress.timesCorrect;
  const accuracyPct = timesSeen === 0 ? 0 : Math.round((timesCorrect / timesSeen) * 100);
  const sentences = getSentences(word.sentences);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${word.word} details`}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        zIndex: 100,
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "520px",
          width: "100%",
          maxHeight: "85vh",
          overflowY: "auto",
          overflowX: "hidden",
          background: "var(--white)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>{word.word}</h3>
            <SpeakButton text={word.word} lang={languageCode} size="sm" />
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            aria-label="Close"
            style={{ padding: "0.4rem", flexShrink: 0 }}
            onClick={onClose}
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        <p style={{ fontSize: "1.05rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>{word.translation}</p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", margin: "0.75rem 0 1.1rem" }}>
          <span className="pill pill-level" style={{ fontSize: "0.7rem" }}>
            {word.level}
          </span>
          <span className="pill" style={{ fontSize: "0.7rem" }}>
            {word.partOfSpeech.toLowerCase()}
            {word.gender ? ` · ${word.gender}` : ""}
          </span>
          <span className={`pill ${statusClassFor(word.progress.status)}`} style={{ fontSize: "0.75rem" }}>
            {word.progress.status}
          </span>
          {word.tags.map((t) => (
            <span key={t.id} className="pill" style={{ fontSize: "0.7rem" }}>
              {t.name}
            </span>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem" }}>
          <div className="progress-bar" style={{ flex: 1, height: "8px" }}>
            <div
              className="progress-bar-fill"
              style={{ width: `${masteryPct}%`, background: masteryColor(masteryPct) }}
            />
          </div>
          <span className="mono" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {masteryPct}% mastery
          </span>
        </div>

        <div
          className="muted"
          style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem 1rem", fontSize: "0.82rem", marginBottom: "1.25rem" }}
        >
          <span>
            Seen <strong className="mono">{timesSeen}</strong>
          </span>
          <span>
            Accuracy{" "}
            <strong className="mono">
              {timesSeen > 0 ? `${timesCorrect}/${timesSeen} (${accuracyPct}%)` : "—"}
            </strong>
          </span>
          <span>
            Last reviewed{" "}
            <strong>{word.progress.lastSeenAt ? new Date(word.progress.lastSeenAt).toLocaleDateString() : "Never"}</strong>
          </span>
        </div>

        <div style={{ borderTop: "var(--bw) dashed var(--ink)", paddingTop: "1rem" }}>
          <p style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.6rem" }}>Example sentences</p>
          {sentences.length === 0 ? (
            <p className="muted" style={{ fontSize: "0.85rem" }}>
              No example sentences for this word yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {sentences.map((s, i) => (
                <div key={i}>
                  <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>{s.sentence}</p>
                  <p className="muted" style={{ fontSize: "0.82rem", margin: "0.2rem 0 0" }}>
                    {s.translation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WordRow({
  word,
  languageCode,
  onSelect,
}: {
  word: WordWithProgress;
  languageCode?: string;
  onSelect: () => void;
}) {
  const mastery = word.progress.mastery;
  const masteryPct = Math.round(mastery * 100);
  const timesSeen = word.progress.timesSeen;
  const timesCorrect = word.progress.timesCorrect;
  const accuracyPct = timesSeen === 0 ? 0 : Math.round((timesCorrect / timesSeen) * 100);
  const status = word.progress.status;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "0.5rem 1rem",
        padding: "0.9rem 1rem",
        borderBottom: "var(--bw) solid var(--ink)",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: "130px" }}>
        <span style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "0.95rem" }}>{word.word}</span>
        <SpeakButton text={word.word} lang={languageCode} size="sm" />
      </div>

      <div className="muted" style={{ flex: "1 1 160px", minWidth: 0 }}>
        {word.translation}
        {word.tags.length > 0 && (
          <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "0.15rem" }}>
            {word.tags.map((t) => t.name).join(" · ")}
          </div>
        )}
      </div>

      <span className="pill pill-level" style={{ fontSize: "0.7rem" }}>
        {word.level}
      </span>

      <span className="pill" style={{ fontSize: "0.7rem" }}>
        {word.partOfSpeech.toLowerCase()}
        {word.gender ? ` · ${word.gender}` : ""}
      </span>

      <span className={`pill ${statusClassFor(status)}`} style={{ fontSize: "0.75rem" }}>
        {status}
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: "110px" }}>
        <div className="progress-bar" style={{ width: "70px", height: "6px" }}>
          <div className="progress-bar-fill" style={{ width: `${masteryPct}%`, background: masteryColor(masteryPct) }} />
        </div>
        <span className="mono" style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
          {masteryPct}%
        </span>
      </div>

      <span className="muted mono" style={{ fontSize: "0.78rem" }}>
        Seen {timesSeen}
      </span>

      <span
        className="mono"
        style={{
          fontSize: "0.78rem",
          color: timesSeen === 0 ? "var(--text-dim)" : accuracyPct >= 75 ? "var(--success-ink)" : accuracyPct >= 50 ? "var(--warning-ink)" : "var(--danger-ink)",
        }}
      >
        {timesSeen > 0 ? `${timesCorrect}/${timesSeen} (${accuracyPct}%)` : "—"}
      </span>

      <span className="muted" style={{ fontSize: "0.78rem" }}>
        {word.progress.lastSeenAt ? new Date(word.progress.lastSeenAt).toLocaleDateString() : "Never"}
      </span>
    </div>
  );
}

export function VocabularyTable({ words, languageCode }: { words: WordWithProgress[]; languageCode?: string }) {
  const [selected, setSelected] = useState<WordWithProgress | null>(null);

  if (!Array.isArray(words) || words.length === 0) {
    return (
      <div className="empty-state" style={{ padding: "2.5rem 1rem" }}>
        <div className="empty-state-icon">
          <IconBook className="w-6 h-6" />
        </div>
        <p style={{ fontWeight: 600, color: "var(--text-main)" }}>No words match your search.</p>
        <p className="muted" style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
          Try a different keyword or level.
        </p>
      </div>
    );
  }

  return (
    <>
      <div style={{ border: "var(--bw) solid var(--ink)", boxShadow: "var(--shadow-sm)", background: "var(--white)" }}>
        {words.map((word) => (
          <WordRow key={word.id} word={word} languageCode={languageCode} onSelect={() => setSelected(word)} />
        ))}
      </div>

      {selected && <WordDetailModal word={selected} languageCode={languageCode} onClose={() => setSelected(null)} />}
    </>
  );
}
