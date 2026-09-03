export interface McpToolResult {
  content: Array<{type:'text';text:string}>;
  isError?: boolean;
  [key:string]: unknown;
}

type ToolHandler = (...args: any[]) => Promise<McpToolResult>;

export function sanitizeToolError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/(token|secret|password|authorization|api[_-]?key)\s*[=:]\s*[^\s,;]+/gi, '$1=[REDACTED]')
    .replace(/Bearer\s+[^\s,;]+/gi, 'Bearer [REDACTED]')
    .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@/gi, 'https://[REDACTED]@');
}

export function withToolBoundary(name: string, handler: ToolHandler): ToolHandler {
  return async (...args: any[]): Promise<McpToolResult> => {
    try {
      return await handler(...args);
    } catch (error) {
      return {
        content: [{type:'text', text:`${name} failed: ${sanitizeToolError(error)}`}],
        isError: true,
      };
    }
  };
}
