import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Router, type Request, type Response } from "express";
import { createServer } from "language-tutor-mcp";

// The real MCP protocol endpoint (Streamable HTTP), for remote clients
// connecting by URL — distinct from the plain REST API mounted at
// /api/mcp that the stdio npm package's apiClient talks to. Stateless:
// a fresh server + transport per request, since nothing here holds
// server-side session state beyond what's already in Postgres.
export const mcpServerRouter = Router();

mcpServerRouter.post("/", async (req, res) => {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => {
    void transport.close();
    void server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

function methodNotAllowed(_req: Request, res: Response) {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
}

mcpServerRouter.get("/", methodNotAllowed);
mcpServerRouter.delete("/", methodNotAllowed);
