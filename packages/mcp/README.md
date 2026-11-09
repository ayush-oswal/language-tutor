# language-tutor-mcp

MCP server for [Language Tutor MCP](https://github.com/ayush-oswal/language-tutor) — an AI-driven language learning app with spaced-repetition vocabulary drills, stories, and exercises.

It talks to a hosted Language Tutor backend over HTTP. Vocabulary comes from a curated catalogue on the backend; the LLM only builds exercises and stories around the words the tools hand it.

## Setup

The server is hosted, so no install is required — add it by URL:

```
https://language-tutor-cgwq.onrender.com/mcp
```

Note: the API runs on a free hosting tier, so after a period of inactivity the first request can take 30-60 seconds while it spins back up — subsequent requests are fast.

### Claude Desktop / Claude.ai

Go to **Settings → Connectors → Add custom connector** and paste the URL above.

### Claude Code

```
claude mcp add --transport http language-tutor https://language-tutor-cgwq.onrender.com/mcp
```

### Any other MCP client

Use the URL above with your client's remote/HTTP server option (sometimes called "Streamable HTTP").

Sign up at the Language Tutor web app first to get your User ID — the tools will ask for it the first time they need it.
