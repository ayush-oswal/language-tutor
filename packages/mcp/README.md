# language-tutor-mcp

MCP server for [Language Tutor MCP](https://github.com/ayush-oswal/language-tutor) — an AI-driven language learning app with spaced-repetition vocabulary drills, stories, and exercises.

It talks to a hosted Language Tutor backend over HTTP; the LLM only generates content (vocabulary, exercises, stories) and calls these tools to persist/fetch it.

## Setup

Add it to your MCP client's config (e.g. `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "language-tutor": {
      "command": "npx",
      "args": ["-y", "language-tutor-mcp"]
    }
  }
}
```

By default it talks to the hosted Language Tutor API. To point it at a different deployment (e.g. self-hosted), set `API_BASE_URL`:

```json
{
  "mcpServers": {
    "language-tutor": {
      "command": "npx",
      "args": ["-y", "language-tutor-mcp"],
      "env": { "API_BASE_URL": "https://your-deployment.example.com" }
    }
  }
}
```

Sign up at the Language Tutor web app first to get your User ID — the tools will ask for it the first time they need it.
