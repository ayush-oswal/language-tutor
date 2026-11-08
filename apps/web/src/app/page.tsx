"use client";

import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import { EnrollCard } from "@/components/EnrollCard";
import { McpConnectGuide } from "@/components/McpConnectGuide";
import { SessionCard } from "@/components/SessionCard";
import { UserIdCard } from "@/components/UserIdCard";
import { IconBook, IconBrain, IconFire, IconLanguage, IconSparkles } from "@/components/Icons";
import { useLanguages } from "@/lib/hooks/useLanguages";
import { useSessions } from "@/lib/hooks/useSession";

export default function HomePage() {
  return (
    <>
      <Show when="signed-out">
        <SignedOutHero />
      </Show>
      <Show when="signed-in">
        <Dashboard />
      </Show>
    </>
  );
}

function SignedOutHero() {
  return (
    <main className="container" style={{ maxWidth: "720px" }}>
      <div style={{ marginTop: "2rem" }}>
        <McpConnectGuide />
      </div>
      <div className="card empty-state hero-card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
        <div className="empty-state-icon" style={{ width: "64px", height: "64px", margin: "0 auto 1.25rem" }}>
          <IconSparkles className="w-8 h-8" />
        </div>
        <h1 className="title hero-title">
          Your Language Hub
        </h1>
        <p className="muted" style={{ maxWidth: "480px", margin: "0 auto 1.75rem" }}>
          Adaptive vocabulary acquisition, spaced drills, and interactive story practice powered by your AI
          assistant. Sign in to get your User ID and start learning.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <SignInButton mode="modal">
            <button type="button" className="btn btn-secondary" style={{ padding: "0.75rem 1.5rem" }}>
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button type="button" className="btn" style={{ padding: "0.75rem 1.5rem" }}>
              Sign up
            </button>
          </SignUpButton>
        </div>
      </div>
    </main>
  );
}

function Dashboard() {
  const { sessions, isLoading: sessionsLoading, mutate: mutateSessions } = useSessions();
  const { languages, isLoading: languagesLoading } = useLanguages();

  const enrolledLanguageIds = new Set(sessions?.map((s) => s.language.id) ?? []);
  const availableLanguages = languages?.filter((l) => !enrolledLanguageIds.has(l.id)) ?? [];
  const knownWords =
    sessions?.reduce((sum, s) => sum + s.vocabularyStats.familiar + s.vocabularyStats.mastered, 0) ?? 0;

  return (
    <main className="container">
      {/* Hero Section */}
      <div style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <span className="pill pill-primary">
            <IconSparkles className="w-3.5 h-3.5" />
            AI Accelerated Learning
          </span>
        </div>
        <h1 className="title hero-title">
          Your Language Hub
        </h1>
        <p className="muted" style={{ maxWidth: "600px", fontSize: "1.05rem", fontWeight: 500 }}>
          Adaptive vocabulary acquisition, spaced drills, and interactive story practice powered by your local AI assistant.
        </p>
      </div>

      <UserIdCard />

      {/* Quick Stats Banner if enrolled anywhere */}
      {sessions && sessions.length > 0 && (
        <div
          className="card"
          style={{
            marginBottom: "2.5rem",
            background: "var(--yellow)",
            borderColor: "var(--ink)",
          }}
        >
          <div className="stats-grid" style={{ margin: 0 }}>
            <div className="stat-box">
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--primary-light)", marginBottom: "0.25rem" }}>
                <IconBrain className="w-4 h-4" />
                <span className="stat-box-label" style={{ margin: 0 }}>Enrolled Languages</span>
              </div>
              <span className="stat-box-value">{sessions.length}</span>
            </div>

            <div className="stat-box">
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--info)", marginBottom: "0.25rem" }}>
                <IconBook className="w-4 h-4" />
                <span className="stat-box-label" style={{ margin: 0 }}>Words Known</span>
              </div>
              <span className="stat-box-value">{knownWords}</span>
            </div>

            <div className="stat-box">
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--warning)", marginBottom: "0.25rem" }}>
                <IconFire className="w-4 h-4" />
                <span className="stat-box-label" style={{ margin: 0 }}>Drill Status</span>
              </div>
              <span className="stat-box-value" style={{ fontSize: "1.1rem", color: "var(--success-ink)" }}>Ready</span>
            </div>
          </div>
        </div>
      )}

      {/* Enrolled languages */}
      <section style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h2 className="subtitle" style={{ margin: 0 }}>Your Languages</h2>
          <span className="muted" style={{ fontSize: "0.85rem" }}>
            {sessions?.length ?? 0} {sessions?.length === 1 ? "language" : "languages"} enrolled
          </span>
        </div>

        <McpConnectGuide />

        {sessionsLoading && (
          <div className="card empty-state">
            <div className="empty-state-icon">
              <IconSparkles className="w-6 h-6" />
            </div>
            <p style={{ fontWeight: 600, color: "var(--text-main)" }}>Loading your courses...</p>
          </div>
        )}

        {!sessionsLoading && sessions && sessions.length === 0 && (
          <div className="card empty-state" style={{ padding: "2.5rem 2rem", textAlign: "center" }}>
            <div className="empty-state-icon" style={{ width: "56px", height: "56px", margin: "0 auto 1rem" }}>
              <IconBrain className="w-7 h-7" />
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.4rem" }}>Not enrolled in any language yet</h3>
            <p className="muted" style={{ maxWidth: "480px", margin: "0 auto" }}>
              Pick a language and a starting level below. Then ask your MCP assistant to teach you new words.
            </p>
          </div>
        )}

        {sessions && sessions.length > 0 && (
          <div className="grid-cards">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </section>

      {/* Catalogue */}
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h2 className="subtitle" style={{ margin: 0 }}>Available Languages</h2>
        </div>

        {languagesLoading && (
          <div className="card empty-state">
            <p style={{ fontWeight: 600, color: "var(--text-main)" }}>Loading languages...</p>
          </div>
        )}

        {!languagesLoading && languages && availableLanguages.length === 0 && (
          <div className="card empty-state" style={{ padding: "2rem", textAlign: "center" }}>
            <div className="empty-state-icon" style={{ margin: "0 auto 0.75rem" }}>
              <IconLanguage className="w-6 h-6" />
            </div>
            <p className="muted">
              {languages.length === 0
                ? "No languages are available yet."
                : "You're enrolled in every available language."}
            </p>
          </div>
        )}

        {availableLanguages.length > 0 && (
          <div className="grid-cards">
            {availableLanguages.map((language) => (
              <EnrollCard key={language.id} language={language} onEnrolled={() => mutateSessions()} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
