/**
 * Structured logger for the Pracbill MCP server.
 * Outputs JSON lines to stderr to avoid interfering with MCP stdio transport.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: "DEBUG",
  [LogLevel.INFO]: "INFO",
  [LogLevel.WARN]: "WARN",
  [LogLevel.ERROR]: "ERROR",
};

let currentLevel: LogLevel = LogLevel.INFO;

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

function log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  if (level < currentLevel) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level: LOG_LEVEL_NAMES[level],
    message,
    ...data,
  };

  process.stderr.write(JSON.stringify(entry) + "\n");
}

export const logger = {
  debug: (message: string, data?: Record<string, unknown>) => log(LogLevel.DEBUG, message, data),
  info: (message: string, data?: Record<string, unknown>) => log(LogLevel.INFO, message, data),
  warn: (message: string, data?: Record<string, unknown>) => log(LogLevel.WARN, message, data),
  error: (message: string, data?: Record<string, unknown>) => log(LogLevel.ERROR, message, data),
};
