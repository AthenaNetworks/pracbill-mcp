# Pracbill MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that exposes the full **Pracbill Billing API** as tools for AI assistants. Supports **100+ tools** across all API domains including customers, invoices, services, leads, helpdesk, CDR, reporting, and more.

## Features

- **Comprehensive coverage** — every endpoint in the Pracbill OpenAPI spec is available as an MCP tool
- **Environment-based config** — API URL and key via environment variables (no hardcoded credentials)
- **Structured logging** — JSON logs to stderr, configurable log levels
- **Robust error handling** — retries with exponential backoff, timeouts, detailed error messages
- **Swagger parser utility** — CLI tool to inspect and summarise the API spec

## Prerequisites

- **Node.js** >= 18
- A **Pracbill API key** (obtain from your Pracbill instance)

## Quick Start

No build required — just use `npx`:

```bash
PRACBILL_URL=https://billing.pracbill.com.au/api \
PRACBILL_API_KEY=your_key \
npx @athenanetworks/pracbill-mcp
```

Or install globally:

```bash
npm install -g @athenanetworks/pracbill-mcp
pracbill-mcp
```

Or clone and build from source:

```bash
git clone <repo-url> pracbill-mcp
cd pracbill-mcp
npm install
npm run build
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PRACBILL_URL` | Yes | — | Base URL for the Pracbill API (e.g. `https://billing.pracbill.com.au/api`) |
| `PRACBILL_API_KEY` | Yes | — | Your API authentication key |
| `PRACBILL_TIMEOUT` | No | `30000` | Request timeout in milliseconds |
| `PRACBILL_RETRIES` | No | `2` | Max retry attempts for failed requests |
| `LOG_LEVEL` | No | `INFO` | Logging level: `DEBUG`, `INFO`, `WARN`, `ERROR` |

## IDE Installation

### Windsurf

Add to your MCP config file (`~/.codeium/windsurf/mcp_config.json`):

```json
{
  "mcpServers": {
    "pracbill": {
      "command": "npx",
      "args": ["-y", "@athenanetworks/pracbill-mcp"],
      "env": {
        "PRACBILL_URL": "https://billing.pracbill.com.au/api",
        "PRACBILL_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Cursor

Add to your Cursor MCP settings (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "pracbill": {
      "command": "npx",
      "args": ["-y", "@athenanetworks/pracbill-mcp"],
      "env": {
        "PRACBILL_URL": "https://billing.pracbill.com.au/api",
        "PRACBILL_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "pracbill": {
      "command": "npx",
      "args": ["-y", "@athenanetworks/pracbill-mcp"],
      "env": {
        "PRACBILL_URL": "https://billing.pracbill.com.au/api",
        "PRACBILL_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### VS Code (Copilot MCP)

Add to `.vscode/mcp.json` in your project or global settings:

```json
{
  "servers": {
    "pracbill": {
      "command": "npx",
      "args": ["-y", "@athenanetworks/pracbill-mcp"],
      "env": {
        "PRACBILL_URL": "https://billing.pracbill.com.au/api",
        "PRACBILL_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Available Tools

### Sales & Qualification (5 tools)
- `qualify_address` — Qualify an address for available services
- `qualify_address_ndf` — NDF address qualification
- `avc_transfer_check` — AVC transfer verification
- `add_order` — Create an order
- `add_external_sale` — Process external e-commerce sales

### Customers (20 tools)
- `get_customers_paginated`, `get_all_customers`, `get_customer`, `search_customers`
- `add_customer`, `update_customer`
- `get_customer_balance`, `get_customer_payment_details`
- `make_customer_payment`, `log_external_payment`
- `add_customer_item`, `update_customer_item`
- `get_customer_services`, `get_customer_service_pricing`
- `get_credit_management_status`, `set_credit_management_status`
- `get_customer_management_status`, `set_customer_management_status`
- `authenticate_customer`, `get_customer_statement`

### Customer Contacts (7 tools)
- `get_customer_contacts`, `create_customer_contact`, `get_customer_contact`
- `update_customer_contact`, `delete_customer_contact`
- `add_customer_contact_legacy`, `get_customer_contacts_legacy`

### Payment Methods (6 tools)
- `list_payment_methods`, `filter_payment_methods`, `add_payment_method`
- `get_payment_method`, `set_payment_method_status`, `set_payment_method_nickname`

### Leads (5 tools)
- `get_leads_paginated`, `filter_leads`, `get_lead`, `add_lead`, `update_lead`

### Products (3 tools)
- `get_products_by_category`, `get_product`, `get_all_products`

### Service Types (6 tools)
- `get_service_types_paginated`, `get_service_type`, `filter_service_types`
- `add_service_type`, `update_service_type`, `delete_service_type`

### Services / Engineering (11 tools)
- `get_service`, `add_service`, `update_service`, `search_services`
- `calculate_etf`, `execute_etf`
- `add_service_item`, `update_service_item`
- `get_monthly_cost`, `get_pro_rata_cost`, `get_daily_cost`

### Invoices (8 tools)
- `get_invoices`, `get_invoice`, `get_customer_invoices`
- `get_filtered_invoices_paginated`, `get_invoice_pdf`, `get_invoice_statement`
- `void_invoice`, `mark_invoice_bad_debt`

### CDR (5 tools)
- `add_cdr`, `add_multiple_cdrs`, `get_cdr_price`, `get_multiple_cdr_prices`, `get_cdr_status`

### Call Management (13 tools)
- `get_call_types_paginated`, `get_call_type`
- `get_all_call_packs`, `get_call_pack`, `get_customer_call_packs`
- `add_call_pack`, `upgrade_call_pack`, `downgrade_call_pack`, `cancel_call_pack`
- `get_all_call_pack_types`, `get_call_pack_type`, `add_call_pack_type`, `update_call_pack_type`

### Call Rates (3 tools)
- `get_call_rates_paginated`, `get_call_rate_group`, `save_call_rate_group`

### Reporting (1 tool)
- `run_report`

### Timeline (2 tools)
- `get_timeline`, `add_timeline_entry`

### Price Books (3 tools)
- `get_price_books_paginated`, `get_price_book`, `save_price_book`

### Service Bundles (2 tools)
- `get_service_bundle`, `get_customer_service_bundles`

### Orders (4 tools)
- `get_orders`, `get_order`, `update_order`, `update_order_data`

### Helpdesk (17 tools)
- `get_helpdesk_tickets`, `get_outstanding_tickets`, `search_helpdesk_tickets`
- `create_helpdesk_ticket`, `get_helpdesk_ticket`, `update_helpdesk_ticket`
- `assign_helpdesk_ticket`, `close_helpdesk_ticket`, `reopen_helpdesk_ticket`
- `void_helpdesk_ticket`, `set_ticket_priority`
- `get_ticket_notes`, `add_ticket_note`, `get_helpdesk_note`
- `update_helpdesk_note`, `delete_helpdesk_note`
- `get_customer_helpdesk_tickets`

### Calendar (3 tools)
- `get_calendar`, `get_calendar_events`, `get_calendar_events_url`

### Authentication (1 tool)
- `get_api_key`

## Swagger Parser

A standalone CLI utility for inspecting the Pracbill OpenAPI spec:

```bash
# Full summary with endpoints
npm run parse-swagger

# Endpoints only
npx tsx src/swagger-parser.ts --endpoints

# Schemas only
npx tsx src/swagger-parser.ts --schemas
```

## Development

```bash
# Run in development mode (no build needed)
PRACBILL_URL=https://billing.pracbill.com.au/api PRACBILL_API_KEY=your_key npm run dev

# Build for production
npm run build

# Run built version
PRACBILL_URL=https://billing.pracbill.com.au/api PRACBILL_API_KEY=your_key npm start
```

## Publishing

```bash
# Login to npm (first time only)
npm login

# Publish (builds automatically via prepublishOnly)
npm publish
```

After publishing, anyone can use it with:

```bash
npx @athenanetworks/pracbill-mcp
```

## License

MIT
