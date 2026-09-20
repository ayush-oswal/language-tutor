# Running locally

## 1. Start Postgres (Docker)
```
docker compose up -d postgres
```

## 2. Start the API server
```
npm run dev:api
```
Runs on http://localhost:4000. Needs `CLERK_PUBLISHABLE_KEY` and
`CLERK_SECRET_KEY` in the root `.env` (see `.env.example`) — it verifies the
web app's Clerk session tokens and lazily creates a `User` row on first call.

## 3. Start the frontend
```
npm run dev:web
```
Runs on http://localhost:3000. Needs `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and
`CLERK_SECRET_KEY` in `apps/web/.env.local`.

**Sign up first** — the homepage requires a Clerk account. Once signed in,
the dashboard shows a "Your User ID" card; copy that id, since it's what you
give the MCP tutor in Claude Desktop (only needed for `createLanguage` and
`listLanguages` — everything else is scoped by `languageId` alone once a
language exists).

## 4. MCP server (Claude Desktop)
Not started manually — Claude Desktop spawns it itself per the entry already
added to `%APPDATA%\Claude\claude_desktop_config.json`. The MCP server no
longer talks to Postgres directly — it calls the API over HTTP, so it needs
`API_BASE_URL` instead of `DATABASE_URL`:
```json
"language-tutor": {
  "command": "node",
  "args": ["C:\\Users\\Ayush\\desktop\\coding\\language-tutor-mcp\\packages\\mcp\\dist\\index.js"],
  "env": { "API_BASE_URL": "http://localhost:4000" }
}
```
The API server (step 2) must be running for the MCP tools to work. Just
restart Claude Desktop to pick up config/env changes. If you change any
`packages/mcp` or `packages/core` source, rebuild before restarting Claude
Desktop:
```
npx tsc -b packages/mcp
```

## To stop everything
```
# Ctrl+C the dev:api / dev:web terminals, then:
docker compose stop postgres
```

## To reset the database (wipe all data, keep schema)
```
node --input-type=module -e "import { prisma } from '@lt/db'; await prisma.user.deleteMany({}); process.exit(0);"
```
(Deleting `User` rows cascades to their `Language`/`Word`/`Exercise` rows.)

## First-time setup (already done, for reference)
```
npm install
docker compose up -d postgres
npm run db:migrate     # applies Prisma migrations
npx tsc -b packages/db packages/core packages/api packages/mcp
```
Also requires a Clerk application's API keys — see `.env.example` for where
`CLERK_PUBLISHABLE_KEY`/`CLERK_SECRET_KEY` (root `.env`, for the API) and
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`/`CLERK_SECRET_KEY` (`apps/web/.env.local`,
for the frontend) go.
