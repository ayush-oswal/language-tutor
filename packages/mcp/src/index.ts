import { pathToFileURL } from "node:url";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

export { createServer };

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("language-tutor-mcp server running on stdio");
}

// Only run the stdio transport when this file is executed directly (as the
// CLI/npx entry point) — not when `createServer` is imported as a module,
// e.g. to mount an HTTP transport inside another process.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
