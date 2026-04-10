#!/usr/bin/env node

/**
 * Swagger Parser Utility
 *
 * Reads and summarises the Pracbill OpenAPI spec (pracbill.json).
 * Run: npx tsx src/swagger-parser.ts [--endpoints] [--schemas] [--summary]
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

interface OpenApiSpec {
  openapi: string;
  info: { title: string; version: string; description?: string };
  servers: Array<{ url: string; description: string }>;
  tags: Array<{ name: string; description: string }>;
  paths: Record<string, Record<string, any>>;
  components?: { schemas?: Record<string, any> };
}

function loadSpec(filePath: string): OpenApiSpec {
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as OpenApiSpec;
}

function summariseEndpoints(spec: OpenApiSpec): void {
  const paths = Object.entries(spec.paths);
  const byTag: Record<string, Array<{ method: string; path: string; description: string }>> = {};

  for (const [path, methods] of paths) {
    const pathParams = methods.parameters ?? [];

    for (const [method, detail] of Object.entries(methods)) {
      if (method === "parameters") continue;
      const op = detail as any;
      const tags = op.tags ?? ["untagged"];
      const desc = op.summary ?? op.description ?? "";

      for (const tag of tags) {
        if (!byTag[tag]) byTag[tag] = [];
        byTag[tag].push({
          method: method.toUpperCase(),
          path,
          description: desc.slice(0, 100),
        });
      }
    }
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log(`  ${spec.info.title} v${spec.info.version}`);
  console.log(`  ${paths.length} paths | ${Object.keys(byTag).length} tags`);
  console.log(`${"=".repeat(70)}\n`);

  for (const [tag, endpoints] of Object.entries(byTag).sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`\n## ${tag} (${endpoints.length} endpoints)`);
    for (const ep of endpoints) {
      console.log(`  ${ep.method.padEnd(7)} ${ep.path}`);
      if (ep.description) console.log(`          ${ep.description}`);
    }
  }
}

function summariseSchemas(spec: OpenApiSpec): void {
  const schemas = spec.components?.schemas ?? {};
  const names = Object.keys(schemas).sort();

  console.log(`\n## Schemas (${names.length})\n`);
  for (const name of names) {
    const schema = schemas[name];
    const props = schema.properties ? Object.keys(schema.properties) : [];
    const required = schema.required ?? [];
    console.log(`  ${name}`);
    if (props.length > 0) {
      console.log(`    Properties: ${props.join(", ")}`);
      if (required.length > 0) {
        console.log(`    Required:   ${required.join(", ")}`);
      }
    }
  }
}

function printSummary(spec: OpenApiSpec): void {
  const paths = Object.entries(spec.paths);
  let totalEndpoints = 0;
  const methods: Record<string, number> = {};

  for (const [, pathMethods] of paths) {
    for (const method of Object.keys(pathMethods)) {
      if (method === "parameters") continue;
      totalEndpoints++;
      methods[method.toUpperCase()] = (methods[method.toUpperCase()] ?? 0) + 1;
    }
  }

  const schemas = spec.components?.schemas ?? {};

  console.log(`\nAPI:       ${spec.info.title} v${spec.info.version}`);
  console.log(`Servers:   ${spec.servers.map((s) => `${s.description} (${s.url})`).join(", ")}`);
  console.log(`Paths:     ${paths.length}`);
  console.log(`Endpoints: ${totalEndpoints}`);
  console.log(`Methods:   ${Object.entries(methods).map(([m, c]) => `${m}:${c}`).join("  ")}`);
  console.log(`Tags:      ${spec.tags.map((t) => t.name).join(", ")}`);
  console.log(`Schemas:   ${Object.keys(schemas).length}`);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const specPath = resolve(process.cwd(), "pracbill.json");

try {
  const spec = loadSpec(specPath);

  if (args.includes("--endpoints")) {
    summariseEndpoints(spec);
  } else if (args.includes("--schemas")) {
    summariseSchemas(spec);
  } else {
    printSummary(spec);
    summariseEndpoints(spec);
  }
} catch (err) {
  console.error(`Failed to parse spec: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
