"use client";

import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import { LanguageCard } from "@/components/LanguageCard";
import { UserIdCard } from "@/components/UserIdCard";
import { IconBook, IconBrain, IconFire, IconSparkles } from "@/components/Icons";
import { useLanguages } from "@/lib/hooks/useLanguages";

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
    <main className="container">
      <div className="card empty-state" style={{ padding: "4rem 2rem", textAlign: "center", marginTop: "2rem" }}>
        <div className="empty-state-icon" style={{ width: "64px", height: "64px", margin: "0 auto 1.25rem" }}>
          <IconSparkles className="w-8 h-8" />
        </div>
        <h1 className="title" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
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
  const { languages, isLoading } = useLanguages();

  const totalWords = languages?.reduce((sum, l) => sum + (l.wordCount ?? 0), 0) ?? 0;
  const activeCount = languages?.length ?? 0;

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
        <h1 className="title" style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
          Your Language Hub
        </h1>
        <p className="muted" style={{ maxWidth: "600px", fontSize: "1rem" }}>
          Adaptive vocabulary acquisition, spaced drills, and interactive story practice powered by your local AI assistant.
        </p>
      </div>

      <UserIdCard />

      {/* Quick Stats Banner if languages exist */}
      {!isLoading && languages && languages.length > 0 && (
        <div
          className="card"
          style={{
            marginBottom: "2rem",
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)",
            borderColor: "rgba(99, 102, 241, 0.25)",
          }}
        >
          <div className="stats-grid" style={{ margin: 0 }}>
            <div className="stat-box" style={{ background: "rgba(10, 14, 23, 0.6)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--primary-light)", marginBottom: "0.25rem" }}>
                <IconBrain className="w-4 h-4" />
                <span className="stat-box-label" style={{ margin: 0 }}>Active Languages</span>
              </div>
              <span className="stat-box-value">{activeCount}</span>
            </div>

            <div className="stat-box" style={{ background: "rgba(10, 14, 23, 0.6)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--info)", marginBottom: "0.25rem" }}>
                <IconBook className="w-4 h-4" />
                <span className="stat-box-label" style={{ margin: 0 }}>Total Vocabulary</span>
              </div>
              <span className="stat-box-value">{totalWords}</span>
            </div>

            <div className="stat-box" style={{ background: "rgba(10, 14, 23, 0.6)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--warning)", marginBottom: "0.25rem" }}>
                <IconFire className="w-4 h-4" />
                <span className="stat-box-label" style={{ margin: 0 }}>Drill Status</span>
              </div>
              <span className="stat-box-value" style={{ fontSize: "1.1rem", color: "#34d399" }}>Ready</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h2 className="subtitle" style={{ margin: 0 }}>Current Courses</h2>
          <span className="muted" style={{ fontSize: "0.85rem" }}>
            {languages?.length ?? 0} {languages?.length === 1 ? "language" : "languages"} enrolled
          </span>
        </div>

        {isLoading && (
          <div className="card empty-state">
            <div className="empty-state-icon">
              <IconSparkles className="w-6 h-6" />
            </div>
            <p style={{ fontWeight: 600, color: "var(--text-main)" }}>Loading your courses...</p>
            <p className="muted" style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>Connecting to local tutor state</p>
          </div>
        )}

        {!isLoading && languages && languages.length === 0 && (
          <div className="card empty-state" style={{ padding: "3.5rem 2rem", textAlign: "center" }}>
            <div className="empty-state-icon" style={{ width: "64px", height: "64px", margin: "0 auto 1.25rem" }}>
              <IconBrain className="w-8 h-8" />
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              No languages created yet
            </h3>
            <p className="muted" style={{ maxWidth: "480px", margin: "0 auto 1.5rem" }}>
              Start your journey right now! Tell your MCP assistant which language you would like to master.
            </p>
            <div
              style={{
                display: "inline-flex",
                flexDirection: "column",
                gap: "0.5rem",
                textAlign: "left",
                background: "rgba(0,0,0,0.3)",
                padding: "1rem 1.25rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 700 }}>
                Try asking your assistant:
              </span>
              <code className="mono" style={{ color: "var(--primary-light)", fontSize: "0.85rem" }}>
                &ldquo;I want to learn Spanish at A1&rdquo;
              </code>
              <code className="mono" style={{ color: "var(--info)", fontSize: "0.85rem" }}>
                &ldquo;Teach me German beginner vocabulary&rdquo;
              </code>
            </div>
          </div>
        )}

        {languages && languages.length > 0 && (
          <div className="grid-cards">
            {languages.map((language) => (
              <LanguageCard key={language.id} language={language} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
