"use client";

import { useState } from "react";
import { IconCheck, IconCopy, IconSparkles } from "./Icons";
import { useMe } from "@/lib/hooks/useMe";

export function UserIdCard() {
  const { me, isLoading } = useMe();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!me?.id) return;
    try {
      await navigator.clipboard.writeText(me.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — the id is still visible to select/copy manually
    }
  }

  return (
    <div
      className="card"
      style={{
        marginBottom: "2rem",
        background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.06) 100%)",
        borderColor: "rgba(99, 102, 241, 0.3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <IconSparkles className="w-4 h-4" style={{ color: "var(--primary-light)" }} />
        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>Your User ID</h3>
      </div>
      <p className="muted" style={{ fontSize: "0.85rem", marginBottom: "0.85rem", maxWidth: "560px" }}>
        Paste this into your Claude Desktop conversation so the MCP tutor knows who you are — it's needed the
        first time you create or list your languages.
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
        <code
          className="mono"
          style={{
            background: "rgba(0,0,0,0.35)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "0.6rem 1rem",
            fontSize: "0.9rem",
            color: "var(--primary-light)",
          }}
        >
          {isLoading || !me ? "Loading…" : me.id}
        </code>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: "0.5rem 0.9rem" }}
          onClick={handleCopy}
          disabled={!me?.id}
        >
          {copied ? <IconCheck className="w-4 h-4" /> : <IconCopy className="w-4 h-4" />}
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>
    </div>
  );
}
