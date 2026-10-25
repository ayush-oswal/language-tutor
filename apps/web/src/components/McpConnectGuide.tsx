"use client";

import { useState } from "react";
import { IconCheck, IconCopy, IconSparkles } from "./Icons";

const CONFIG_SNIPPET = `{
  "mcpServers": {
    "language-tutor": {
      "command": "npx",
      "args": ["-y", "language-tutor-mcp"]
    }
  }
}`;

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
          background: "rgba(0,0,0,0.35)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "0.85rem 1rem",
          fontSize: "0.82rem",
          color: "var(--primary-light)",
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
          width: "26px",
          height: "26px",
          borderRadius: "50%",
          background: "var(--primary-gradient)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.8rem",
          fontWeight: 700,
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
        background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)",
        borderColor: "rgba(99, 102, 241, 0.25)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
        <IconSparkles className="w-4 h-4" style={{ color: "var(--primary-light)" }} />
        <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>Connect to Claude Desktop</h3>
      </div>
      <p className="muted" style={{ fontSize: "0.85rem", marginBottom: "1.25rem", maxWidth: "640px" }}>
        Language Tutor runs as an MCP server inside Claude Desktop. Connect it once with the steps below.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
        <Step n={1} title="Install Node.js 18 or newer">
          Download it from{" "}
          <a href="https://nodejs.org" target="_blank" rel="noreferrer" style={{ color: "var(--primary-light)" }}>
            nodejs.org
          </a>{" "}
          if you don&apos;t already have it.
        </Step>

        <Step n={2} title="Open Claude Desktop's config file">
          In Claude Desktop, go to <strong>Settings → Developer → Edit Config</strong>. This opens the folder
          containing <code className="mono">claude_desktop_config.json</code> — open that file in a text editor.
        </Step>

        <Step n={3} title="Add the Language Tutor server">
          If the file is empty, paste the block below as-is. If it already has an{" "}
          <code className="mono">&quot;mcpServers&quot;</code> section, add just the{" "}
          <code className="mono">&quot;language-tutor&quot;</code> entry inside it (with a comma before it).
          <div style={{ marginTop: "0.6rem" }}>
            <CopyableCode code={CONFIG_SNIPPET} />
          </div>
        </Step>

        <Step n={4} title="Save the file and restart Claude Desktop">
          Closing the window isn&apos;t enough. On Windows, right-click the Claude icon in the system tray and
          choose <strong>Quit</strong>; on macOS, press <strong>⌘Q</strong>. Then open Claude Desktop again.
        </Step>

        <Step n={5} title="Find it in Claude's tools">
          &quot;language-tutor&quot; should now be listed under Claude's tools (the tools / connectors menu in the
          chat box). Sign in above, enroll in a language, and give Claude your User ID when it asks.
        </Step>
      </div>
    </div>
  );
}
