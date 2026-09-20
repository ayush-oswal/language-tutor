"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { VocabularyTable } from "@/components/VocabularyTable";
import { IconArrowLeft, IconArrowRight, IconBook, IconPlus, IconSearch, IconSparkles } from "@/components/Icons";
import { useLanguage } from "@/lib/hooks/useLanguage";
import { useVocabulary } from "@/lib/hooks/useVocabulary";
import { useApiClient } from "@/lib/hooks/useApiClient";

const PAGE_SIZE_OPTIONS = [50, 100] as const;

export default function VocabularyPage({ params }: { params: Promise<{ languageId: string }> }) {
  const { languageId } = use(params);
  const { language } = useLanguage(languageId);
  const client = useApiClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const { words, total, mutate } = useVocabulary(languageId, { search: search || undefined, page, pageSize });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Reset to page 1 whenever the search term or page size changes.
  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  async function handleAddWord(e: React.FormEvent) {
    e.preventDefault();
    if (!word.trim() || !translation.trim()) return;
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(false);
    try {
      await client.addWord(languageId, {
        word: word.trim(),
        translation: translation.trim(),
        partOfSpeech: partOfSpeech.trim() || undefined,
      });
      setWord("");
      setTranslation("");
      setPartOfSpeech("");
      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 3000);
      mutate();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add word");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">My Languages</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href={`/languages/${languageId}`}>{language?.name ?? "…"}</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-active">Vocabulary</span>
      </nav>

      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <h1 className="title" style={{ margin: 0 }}>
              {language?.name ?? "Language"} Vocabulary
            </h1>
            <span className="pill pill-primary">
              {total} {total === 1 ? "word" : "words"}
            </span>
          </div>
          <p className="muted" style={{ marginTop: "0.25rem" }}>
            Search words, inspect spaced repetition mastery, or manually append new vocabulary items.
          </p>
        </div>

        <Link href={`/languages/${languageId}`}>
          <button type="button" className="btn btn-secondary" style={{ padding: "0.5rem 1rem" }}>
            <IconArrowLeft size={16} />
            <span>Dashboard</span>
          </button>
        </Link>
      </div>

      {/* Add Word Card */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <IconPlus size={18} />
          <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>
            Add New Word to Bank
          </h3>
        </div>

        <form onSubmit={handleAddWord} style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "stretch" }}>
          <input
            placeholder="Word (e.g. la manzana)"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            style={{ flex: "1 1 200px", minWidth: 0 }}
            required
          />
          <input
            placeholder="Translation (e.g. the apple)"
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            style={{ flex: "1 1 200px", minWidth: 0 }}
            required
          />
          <input
            placeholder="Part of speech (noun, verb...)"
            value={partOfSpeech}
            onChange={(e) => setPartOfSpeech(e.target.value)}
            style={{ flex: "1 1 160px", minWidth: 0 }}
          />
          <button
            type="submit"
            disabled={submitting || !word.trim() || !translation.trim()}
            style={{ flex: "0 0 auto", whiteSpace: "nowrap" }}
          >
            {submitting ? "Adding..." : "Add Word"}
          </button>
        </form>

        {formSuccess && (
          <div className="alert alert-success" style={{ marginTop: "0.75rem" }}>
            <span>Word added successfully to vocabulary bank!</span>
          </div>
        )}

        {formError && (
          <div className="alert alert-danger" style={{ marginTop: "0.75rem" }}>
            <span>{formError}</span>
          </div>
        )}
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

        <VocabularyTable words={words ?? []} languageCode={language?.languageCode} />

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
