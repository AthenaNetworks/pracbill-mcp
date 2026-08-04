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

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
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

  const server = new Server(
    {
      name: "pracbill",
      version: "1.0.0",
    },
    {
      capabilities: { tools: {} },
    },
  );

  // Index tools by name for dispatch. The low-level Server API is used rather
  // than McpServer because our tool definitions carry raw JSON Schema, which
  // McpServer.tool()/registerTool() rejects (it expects a Zod shape).
  const toolsByName = new Map(ALL_TOOLS.map((tool) => [tool.name, tool]));

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: ALL_TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = toolsByName.get(name);

    if (!tool) {
      logger.error("Unknown tool requested", { tool: name });
      return {
        content: [{ type: "text" as const, text: `Error: unknown tool "${name}"` }],
        isError: true,
      };
    }

    logger.info("Tool invoked", { tool: name });

    try {
      const result = await tool.handler(client, args ?? {});
      return {
        content: [{ type: "text" as const, text: result }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const details = error instanceof Error && "responseBody" in error
        ? JSON.stringify((error as any).responseBody)
        : undefined;

      logger.error("Tool error", { tool: name, error: message, details });

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
  });

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
