import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { RemoteApiError } from "./apiClient.js";

export function textResult(data: unknown): CallToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

export function errorResult(message: string): CallToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

export async function wrapTool(fn: () => Promise<unknown>): Promise<CallToolResult> {
  try {
    const data = await fn();
    return textResult(data);
  } catch (err) {
    if (err instanceof RemoteApiError) {
      return errorResult(`${err.code}: ${err.message}`);
    }
    console.error(err);
    return errorResult(`Internal error: ${err instanceof Error ? err.message : String(err)}`);
  }
}
