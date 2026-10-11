"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import type { CEFRLevel } from "@lt/core";
import { VocabularyTable } from "@/components/VocabularyTable";
import { IconArrowLeft, IconArrowRight, IconSearch } from "@/components/Icons";
import { useSession } from "@/lib/hooks/useSession";
import { useVocabulary } from "@/lib/hooks/useVocabulary";
import { CEFR_LEVELS } from "@/lib/levels";

const PAGE_SIZE_OPTIONS = [50, 100] as const;

export default function VocabularyPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const { session } = useSession(sessionId);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<CEFRLevel | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const { words, total } = useVocabulary(sessionId, {
    search: search || undefined,
    level: level || undefined,
    page,
    pageSize,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const selectableLevels = session
    ? CEFR_LEVELS.slice(0, CEFR_LEVELS.indexOf(session.currentLevel) + 1)
    : [];

  // Reset to page 1 whenever the filters or page size change.
  useEffect(() => {
    setPage(1);
  }, [search, level, pageSize]);

  return (
    <main className="container">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">My Languages</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href={`/sessions/${sessionId}`}>{session?.language.name ?? "…"}</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-active">Vocabulary</span>
      </nav>

      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <h1 className="title" style={{ margin: 0 }}>
              {session?.language.name ?? "Language"} Vocabulary
            </h1>
            <span className="pill pill-primary">
              {total} {total === 1 ? "word" : "words"}
            </span>
          </div>
          <p className="muted" style={{ marginTop: "0.25rem" }}>
            Every word up to your current level{session ? ` (${session.currentLevel})` : ""}, with your spaced
            repetition progress.
          </p>
        </div>

        <Link href={`/sessions/${sessionId}`}>
          <button type="button" className="btn btn-secondary" style={{ padding: "0.5rem 1rem" }}>
            <IconArrowLeft size={16} />
            <span>Dashboard</span>
          </button>
        </Link>
      </div>

      {/* Vocabulary Explorer Card */}
      <div className="card">
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 260px" }}>
            <div
              style={{
                position: "absolute",
                left: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-dim)",
                display: "flex",
                alignItems: "center",
                pointerEvents: "none",
              }}
            >
              <IconSearch size={18} />
            </div>
            <input
              placeholder="Search word or translation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", paddingLeft: "2.75rem" }}
            />
          </div>

          <select value={level} onChange={(e) => setLevel(e.target.value as CEFRLevel | "")} aria-label="Filter by level">
            <option value="">All levels</option>
            {selectableLevels.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span className="muted" style={{ fontSize: "0.85rem" }}>
              Per page
            </span>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                type="button"
                className={pageSize === size ? "btn" : "btn btn-secondary"}
                style={{ padding: "0.4rem 0.85rem", fontSize: "0.85rem" }}
                onClick={() => setPageSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <VocabularyTable words={words ?? []} languageCode={session?.language.code} />

        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "1.25rem",
              paddingTop: "1rem",
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            <span className="muted" style={{ fontSize: "0.85rem" }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: "0.5rem 1rem" }}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <IconArrowLeft size={16} />
                <span>Prev</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: "0.5rem 1rem" }}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <span>Next</span>
                <IconArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
