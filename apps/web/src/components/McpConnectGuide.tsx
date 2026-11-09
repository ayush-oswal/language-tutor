"use client";

import { useState } from "react";
import { IconCheck, IconCopy, IconSparkles } from "./Icons";

const MCP_URL = "https://language-tutor-cgwq.onrender.com/mcp";

const CLI_COMMAND = `claude mcp add --transport http language-tutor ${MCP_URL}`;

function CopyableCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — the code is still visible to select/copy manually
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <pre
        className="mono"
        style={{
          background: "var(--ink)",
          border: "var(--bw) solid var(--ink)",
          borderRadius: 0,
          padding: "0.85rem 1rem",
          fontSize: "0.82rem",
          color: "var(--yellow)",
          overflowX: "auto",
          margin: 0,
        }}
      >
        {code}
      </pre>
      <button
        type="button"
        className="btn btn-secondary"
        style={{ position: "absolute", top: "0.5rem", right: "0.5rem", padding: "0.35rem 0.6rem" }}
        onClick={handleCopy}
      >
        {copied ? <IconCheck className="w-4 h-4" /> : <IconCopy className="w-4 h-4" />}
        <span>{copied ? "Copied!" : "Copy"}</span>
      </button>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "0.85rem" }}>
      <div
        style={{
          flexShrink: 0,
          width: "32px",
          height: "32px",
          borderRadius: 0,
          background: "var(--pink)",
          border: "var(--bw) solid var(--ink)",
          boxShadow: "3px 3px 0 var(--ink)",
          color: "var(--ink)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.9rem",
          fontWeight: 700,
          fontFamily: "var(--font-mono)",
        }}
      >
        {n}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: "0.92rem", marginBottom: "0.4rem" }}>{title}</p>
        <div className="muted" style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function McpConnectGuide() {
  return (
    <div
      className="card"
      style={{
        marginBottom: "2rem",
        background: "var(--teal-soft)",
        borderColor: "var(--ink)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
        <IconSparkles className="w-4 h-4" style={{ color: "var(--primary-light)" }} />
        <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, textTransform: "uppercase" }}>
          Connect to Claude Desktop (or any MCP client)
        </h3>
      </div>
      <p className="muted" style={{ fontSize: "0.85rem", marginBottom: "1.25rem", maxWidth: "640px" }}>
        Language Tutor runs as an MCP server. No install needed — connect it once with the steps below.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
        <Step n={1} title="Copy the server URL">
          Works with Claude Desktop, Claude.ai, Claude Code, or any other MCP client that supports remote
          (Streamable HTTP) servers.
          <div style={{ marginTop: "0.6rem" }}>
            <CopyableCode code={MCP_URL} />
          </div>
        </Step>

        <Step n={2} title="Add it in your client">
          <strong>Claude Desktop / Claude.ai:</strong> Settings → Connectors → Add custom connector, and paste the
          URL.
          <br />
          <strong>Claude Code:</strong> run this in your terminal instead:
          <div style={{ marginTop: "0.6rem" }}>
            <CopyableCode code={CLI_COMMAND} />
          </div>
        </Step>

        <Step n={3} title="Find it in your tools">
          &quot;language-tutor&quot; should now be listed among your client's tools/connectors. Sign in above,
          enroll in a language, and give it your User ID when it asks.
          <div style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}>
            The server runs on a free hosting tier, so the very first request after a period of inactivity can
            take 30-60 seconds while it wakes back up — after that it's fast.
          </div>
        </Step>
      </div>
    </div>
  );
}
