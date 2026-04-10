#!/usr/bin/env node

/**
 * Pracbill MCP Server
 *
 * A Model Context Protocol server that exposes the Pracbill billing API
 * as tools for AI assistants.
 *
 * Environment variables:
 *   PRACBILL_URL      - Base URL for the Pracbill API (e.g. https://billing.pracbill.com.au/api)
 *   PRACBILL_API_KEY  - API authentication key
 *   PRACBILL_TIMEOUT  - Request timeout in ms (default: 30000)
 *   PRACBILL_RETRIES  - Max retry attempts (default: 2)
 *   LOG_LEVEL         - Logging level: DEBUG, INFO, WARN, ERROR (default: INFO)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { PracbillClient } from "./api-client.js";
import { logger, setLogLevel, LogLevel } from "./logger.js";
import { ALL_TOOLS } from "./tools.js";

// ---------------------------------------------------------------------------
// Configuration from environment
// ---------------------------------------------------------------------------

function getConfig() {
  const baseUrl = process.env.PRACBILL_URL;
  const apiKey = process.env.PRACBILL_API_KEY;

  if (!baseUrl) {
    logger.error("PRACBILL_URL environment variable is required");
    process.exit(1);
  }
  if (!apiKey) {
    logger.error("PRACBILL_API_KEY environment variable is required");
    process.exit(1);
  }

  const logLevel = (process.env.LOG_LEVEL ?? "INFO").toUpperCase();
  const levelMap: Record<string, LogLevel> = {
    DEBUG: LogLevel.DEBUG,
    INFO: LogLevel.INFO,
    WARN: LogLevel.WARN,
    ERROR: LogLevel.ERROR,
  };
  setLogLevel(levelMap[logLevel] ?? LogLevel.INFO);

  return {
    baseUrl,
    apiKey,
    timeoutMs: process.env.PRACBILL_TIMEOUT ? parseInt(process.env.PRACBILL_TIMEOUT, 10) : undefined,
    maxRetries: process.env.PRACBILL_RETRIES ? parseInt(process.env.PRACBILL_RETRIES, 10) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Server bootstrap
// ---------------------------------------------------------------------------

async function main() {
  const config = getConfig();
  const client = new PracbillClient(config);

  const server = new McpServer({
    name: "pracbill",
    version: "1.0.0",
  });

  // Register all tools
  for (const tool of ALL_TOOLS) {
    server.tool(
      tool.name,
      tool.description,
      tool.inputSchema as any,
      async (args: Record<string, unknown>) => {
        logger.info("Tool invoked", { tool: tool.name });
        try {
          const result = await tool.handler(client, args);
          return {
            content: [{ type: "text" as const, text: result }],
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const details = error instanceof Error && "responseBody" in error
            ? JSON.stringify((error as any).responseBody)
            : undefined;

          logger.error("Tool error", {
            tool: tool.name,
            error: message,
            details,
          });

          return {
            content: [
              {
                type: "text" as const,
                text: `Error: ${message}${details ? `\nDetails: ${details}` : ""}`,
              },
            ],
            isError: true,
          };
        }
      },
    );
  }

  logger.info("Registered tools", { count: ALL_TOOLS.length });

  // Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info("Pracbill MCP server started", {
    tools: ALL_TOOLS.length,
    baseUrl: config.baseUrl,
  });
}

main().catch((error) => {
  logger.error("Fatal error", { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
