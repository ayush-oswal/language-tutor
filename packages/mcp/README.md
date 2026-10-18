# language-tutor-mcp

MCP server for [Language Tutor MCP](https://github.com/ayush-oswal/language-tutor) — an AI-driven language learning app with spaced-repetition vocabulary drills, stories, and exercises.

It talks to a hosted Language Tutor backend over HTTP. Vocabulary comes from a curated catalogue on the backend; the LLM only builds exercises and stories around the words the tools hand it.

## Setup

You need [Node.js](https://nodejs.org) 18 or newer installed.

### Claude Desktop

1. Open Claude Desktop and go to **Settings → Developer → Edit Config**. This opens the folder containing `claude_desktop_config.json`.
2. Open `claude_desktop_config.json` in a text editor.
3. If the file is empty, paste in the block below. If it already has an `"mcpServers"` section, add just the `"language-tutor"` entry inside it, with a comma between it and the entry before it.
4. Save the file.
5. Quit Claude Desktop completely. Closing the window isn't enough: on Windows, right-click the Claude icon in the system tray and choose **Quit**; on macOS, press ⌘Q. Then open it again.
6. Language Tutor should now be listed under Claude's tools (the tools / connectors menu in the chat box).

### Config

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
