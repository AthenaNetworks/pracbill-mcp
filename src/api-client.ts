/**
 * HTTP client for the Pracbill API.
 * Handles authentication, request construction, error handling, and retries.
 */

import { logger } from "./logger.js";

export interface PracbillConfig {
  baseUrl: string;
  apiKey: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  status: number;
  data: T;
  headers: Record<string, string>;
}

export class PracbillApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody: unknown,
    public readonly endpoint: string,
  ) {
    super(message);
    this.name = "PracbillApiError";
  }
}

export class PracbillClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(config: PracbillConfig) {
    if (!config.baseUrl) throw new Error("PRACBILL_URL is required");
    if (!config.apiKey) throw new Error("PRACBILL_API_KEY is required");

    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs ?? 30_000;
    this.maxRetries = config.maxRetries ?? 2;

    logger.info("Pracbill client initialized", { baseUrl: this.baseUrl });
  }

  private buildUrl(pathTemplate: string, pathParams: Record<string, string | number> = {}): string {
    let path = pathTemplate.replace("{api_key}", this.apiKey);

    for (const [key, value] of Object.entries(pathParams)) {
      path = path.replace(`{${key}}`, encodeURIComponent(String(value)));
    }

    return `${this.baseUrl}${path}`;
  }

  async request<T = unknown>(options: {
    method: "GET" | "POST" | "DELETE" | "PUT" | "PATCH";
    pathTemplate: string;
    pathParams?: Record<string, string | number>;
    queryParams?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
  }): Promise<ApiResponse<T>> {
    const url = new URL(this.buildUrl(options.pathTemplate, options.pathParams));

    if (options.queryParams) {
      for (const [key, value] of Object.entries(options.queryParams)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    let bodyStr: string | undefined;
    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
      bodyStr = JSON.stringify(options.body);
    }

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        logger.warn("Retrying request", { attempt, delay, endpoint: options.pathTemplate });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      try {
        logger.debug("API request", {
          method: options.method,
          url: url.toString().replace(this.apiKey, "***"),
          attempt,
        });

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        const response = await fetch(url.toString(), {
          method: options.method,
          headers,
          body: bodyStr,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        const contentType = response.headers.get("content-type") ?? "";
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        if (contentType.includes("application/pdf") || contentType.includes("text/calendar") || contentType.includes("text/html")) {
          const text = await response.text();
          return {
            success: response.ok,
            status: response.status,
            data: text as unknown as T,
            headers: responseHeaders,
          };
        }

        let data: T;
        try {
          data = (await response.json()) as T;
        } catch {
          const text = await response.text().catch(() => "");
          data = text as unknown as T;
        }

        if (!response.ok) {
          throw new PracbillApiError(
            `API returned ${response.status}: ${response.statusText}`,
            response.status,
            data,
            options.pathTemplate,
          );
        }

        logger.debug("API response", {
          status: response.status,
          endpoint: options.pathTemplate,
        });

        return {
          success: true,
          status: response.status,
          data,
          headers: responseHeaders,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (error instanceof PracbillApiError && error.status < 500) {
          throw error;
        }

        if (error instanceof Error && error.name === "AbortError") {
          lastError = new Error(`Request timed out after ${this.timeoutMs}ms`);
          if (attempt === this.maxRetries) throw lastError;
          continue;
        }

        if (attempt === this.maxRetries) throw lastError;
      }
    }

    throw lastError ?? new Error("Request failed after all retries");
  }

  async get<T = unknown>(
    pathTemplate: string,
    pathParams?: Record<string, string | number>,
    queryParams?: Record<string, string | number | boolean | undefined>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: "GET", pathTemplate, pathParams, queryParams });
  }

  async post<T = unknown>(
    pathTemplate: string,
    pathParams?: Record<string, string | number>,
    body?: unknown,
    queryParams?: Record<string, string | number | boolean | undefined>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: "POST", pathTemplate, pathParams, body, queryParams });
  }

  async del<T = unknown>(
    pathTemplate: string,
    pathParams?: Record<string, string | number>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: "DELETE", pathTemplate, pathParams });
  }
}
