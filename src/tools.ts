/**
 * Tool definitions for all Pracbill API endpoints.
 * Each tool maps to one or more API endpoints, grouped by domain.
 */

import type { PracbillClient } from "./api-client.js";
import { logger } from "./logger.js";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function formatResult(data: unknown): string {
  if (typeof data === "string") return data;
  return JSON.stringify(data, null, 2);
}

type ToolHandler = (client: PracbillClient, args: Record<string, unknown>) => Promise<string>;

export interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: ToolHandler;
}

// ---------------------------------------------------------------------------
// SALES / QUALIFICATION
// ---------------------------------------------------------------------------

const qualifyAddress: ToolDef = {
  name: "qualify_address",
  description: "Qualify an address for available services. Returns available service types, technologies, pricing, and optionally AVC transfer verification.",
  inputSchema: {
    type: "object",
    properties: {
      address: { type: "string", description: "The address to qualify" },
      avcid: { type: "string", description: "Optional AVC ID for transfer verification" },
      service_type: { type: "string", description: "Optional service type filter (e.g. FTTP, HFC, FTTC)" },
    },
    required: ["address"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/services/qualify", {}, undefined, {
      address: args.address as string,
      avcid: args.avcid as string | undefined,
      service_type: args.service_type as string | undefined,
    });
    return formatResult(res.data);
  },
};

const qualifyAddressNdf: ToolDef = {
  name: "qualify_address_ndf",
  description: "Qualify an address for New Development Fee (NDF) services.",
  inputSchema: {
    type: "object",
    properties: {
      address: { type: "string", description: "The address to qualify" },
    },
    required: ["address"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/services/qualify/ndf", {}, undefined, {
      address: args.address as string,
    });
    return formatResult(res.data);
  },
};

const avcCheck: ToolDef = {
  name: "avc_transfer_check",
  description: "Verify that an AVC ID matches a given location before submitting a transfer order. Returns match result, target identifier, and current provider EPID.",
  inputSchema: {
    type: "object",
    properties: {
      location_id: { type: "string", description: "LOC ID / DirectoryID from a previous address lookup" },
      avcid: { type: "string", description: "The AVC ID to verify" },
      service_type: { type: "string", description: "Technology type (e.g. FTTP, HFC, FTTC)" },
    },
    required: ["location_id", "avcid"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/services/qualify/avc-check", {}, undefined, {
      location_id: args.location_id as string,
      avcid: args.avcid as string,
      service_type: args.service_type as string | undefined,
    });
    return formatResult(res.data);
  },
};

const addOrder: ToolDef = {
  name: "add_order",
  description: "Create a new order. Provide order details including customer ID, order type, service type, etc.",
  inputSchema: {
    type: "object",
    properties: {
      order_data: { type: "object", description: "Order data including cid, company, order_type, service_type, date_ordered, date_expected, status" },
    },
    required: ["order_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/orders/add", {}, args.order_data);
    return formatResult(res.data);
  },
};

const addExternalSale: ToolDef = {
  name: "add_external_sale",
  description: "Process an external sale from an e-commerce platform. Creates customer, invoice, items, and payments.",
  inputSchema: {
    type: "object",
    properties: {
      sale_data: { type: "object", description: "External sale data" },
    },
    required: ["sale_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/externalsales/add", {}, args.sale_data);
    return formatResult(res.data);
  },
};

// ---------------------------------------------------------------------------
// CUSTOMERS
// ---------------------------------------------------------------------------

const getCustomersPaginated: ToolDef = {
  name: "get_customers_paginated",
  description: "Get a paginated list of customers (20 per page).",
  inputSchema: {
    type: "object",
    properties: {
      page_number: { type: "integer", description: "Page number (default: 1)", default: 1 },
    },
    required: ["page_number"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/customer/get/page/{page_number}", {
      page_number: args.page_number as number,
    });
    return formatResult(res.data);
  },
};

const getAllCustomers: ToolDef = {
  name: "get_all_customers",
  description: "Get all active customers (no pagination). Warning: may return large dataset.",
  inputSchema: { type: "object", properties: {} },
  handler: async (client) => {
    const res = await client.get("/{api_key}/customer/getAll");
    return formatResult(res.data);
  },
};

const getCustomer: ToolDef = {
  name: "get_customer",
  description: "Get a specific customer by ID with full details.",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID" },
    },
    required: ["cid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/customer/get/{cid}", { cid: args.cid as number });
    return formatResult(res.data);
  },
};

const searchCustomers: ToolDef = {
  name: "search_customers",
  description: "Search customers by a specific field (e.g. 'role', 'email', 'company'). Minimum 3 characters for search value.",
  inputSchema: {
    type: "object",
    properties: {
      field: { type: "string", description: "Field to search (e.g., 'role', 'email', 'company')" },
      value: { type: "string", description: "Search value (minimum 3 characters)" },
    },
    required: ["field", "value"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/customer/search/{field}/{value}", {
      field: args.field as string,
      value: args.value as string,
    });
    return formatResult(res.data);
  },
};

const addCustomer: ToolDef = {
  name: "add_customer",
  description: "Create a new customer.",
  inputSchema: {
    type: "object",
    properties: {
      customer_data: { type: "object", description: "Customer data" },
    },
    required: ["customer_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/customer/add", {}, args.customer_data);
    return formatResult(res.data);
  },
};

const updateCustomer: ToolDef = {
  name: "update_customer",
  description: "Update an existing customer's details.",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID (can be customer id, account_id, or crm_id)" },
      customer_data: { type: "object", description: "Updated customer data" },
    },
    required: ["cid", "customer_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/customer/update/{cid}", { cid: args.cid as number }, args.customer_data);
    return formatResult(res.data);
  },
};

const getCustomerBalance: ToolDef = {
  name: "get_customer_balance",
  description: "Get the current balance for a customer.",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID" },
    },
    required: ["cid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/customer/balance/{cid}", { cid: args.cid as number });
    return formatResult(res.data);
  },
};

const getCustomerPaymentDetails: ToolDef = {
  name: "get_customer_payment_details",
  description: "Get the current payment details for a customer.",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID" },
    },
    required: ["cid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/customer/paymentDetails/{cid}", { cid: args.cid as number });
    return formatResult(res.data);
  },
};

const makeCustomerPayment: ToolDef = {
  name: "make_customer_payment",
  description: "Process a payment on a customer's account. Requires either a payment_token or full card details.",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID" },
      payment_data: { type: "object", description: "Payment data (payment_token or card fields)" },
    },
    required: ["cid", "payment_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/customer/payment/{cid}", { cid: args.cid as number }, args.payment_data);
    return formatResult(res.data);
  },
};

const logExternalPayment: ToolDef = {
  name: "log_external_payment",
  description: "Log a payment that was processed by an external party. Bypasses card validation. Requires transaction_id.",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID" },
      payment_data: { type: "object", description: "External payment data including transaction_id" },
    },
    required: ["cid", "payment_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/customer/external-payment/{cid}", { cid: args.cid as number }, args.payment_data);
    return formatResult(res.data);
  },
};

const addCustomerItem: ToolDef = {
  name: "add_customer_item",
  description: "Add a charge item directly to a customer.",
  inputSchema: {
    type: "object",
    properties: {
      item_data: { type: "object", description: "Charge item data" },
    },
    required: ["item_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/customer/item/add", {}, args.item_data);
    return formatResult(res.data);
  },
};

const updateCustomerItem: ToolDef = {
  name: "update_customer_item",
  description: "Update a customer charge item.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "integer", description: "Customer item ID" },
      item_data: { type: "object", description: "Updated charge item data" },
    },
    required: ["id", "item_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/customer/item/update/{id}", { id: args.id as number }, args.item_data);
    return formatResult(res.data);
  },
};

const getCustomerServices: ToolDef = {
  name: "get_customer_services",
  description: "Get all services assigned to a customer.",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID" },
    },
    required: ["cid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/customer/get/services/{cid}", { cid: args.cid as number });
    return formatResult(res.data);
  },
};

const getCustomerServicePricing: ToolDef = {
  name: "get_customer_service_pricing",
  description: "Get service type pricing for a customer (includes price book adjustments).",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID" },
      esid: { type: "integer", description: "Optional: specific service type ID" },
    },
    required: ["cid"],
  },
  handler: async (client, args) => {
    if (args.esid) {
      const res = await client.get("/{api_key}/customer/get/servicePricing/{cid}/{esid}", {
        cid: args.cid as number,
        esid: args.esid as number,
      });
      return formatResult(res.data);
    }
    const res = await client.get("/{api_key}/customer/get/servicePricing/{cid}", { cid: args.cid as number });
    return formatResult(res.data);
  },
};

const getCreditManagementStatus: ToolDef = {
  name: "get_credit_management_status",
  description: "Get credit management status for a customer. Credit management prevents automatic late fees and card charges.",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID" },
    },
    required: ["cid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/customer/getCreditManagementStatus/{cid}", { cid: args.cid as number });
    return formatResult(res.data);
  },
};

const setCreditManagementStatus: ToolDef = {
  name: "set_credit_management_status",
  description: "Set credit management status for a customer (0=disabled, 1=enabled).",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID" },
      status: { type: "integer", description: "Credit management status (0 or 1)", enum: [0, 1] },
    },
    required: ["cid", "status"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/customer/setCreditManagementStatus/{cid}/{status}", {
      cid: args.cid as number,
      status: args.status as number,
    });
    return formatResult(res.data);
  },
};

const getCustomerManagementStatus: ToolDef = {
  name: "get_customer_management_status",
  description: "Get management status for a customer.",
  inputSchema: {
    type: "object",
    properties: { cid: { type: "integer", description: "Customer ID" } },
    required: ["cid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/customer/getManagementStatus/{cid}", { cid: args.cid as number });
    return formatResult(res.data);
  },
};

const setCustomerManagementStatus: ToolDef = {
  name: "set_customer_management_status",
  description: "Set management status for a customer.",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID" },
      status: { type: "string", description: "Management status to set" },
    },
    required: ["cid", "status"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/customer/setManagementStatus/{cid}/{status}", {
      cid: args.cid as number,
      status: args.status as string,
    });
    return formatResult(res.data);
  },
};

const authenticateCustomer: ToolDef = {
  name: "authenticate_customer",
  description: "Authenticate a customer with email and password.",
  inputSchema: {
    type: "object",
    properties: {
      email: { type: "string", description: "Customer email" },
      password: { type: "string", description: "Customer password" },
    },
    required: ["email", "password"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/customer/authenticate/", {}, {
      email: args.email,
      password: args.password,
    });
    return formatResult(res.data);
  },
};

const getCustomerStatement: ToolDef = {
  name: "get_customer_statement",
  description: "Get customer statement as PDF (returns binary data info). Optionally filter by start date.",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID" },
      date_from: { type: "string", description: "Optional start date (YYYY-MM-DD)" },
    },
    required: ["cid"],
  },
  handler: async (client, args) => {
    if (args.date_from) {
      const res = await client.get("/{api_key}/customer/get/statement/{cid}/{date_from}", {
        cid: args.cid as number,
        date_from: args.date_from as string,
      });
      return `PDF statement generated. Content-Type: application/pdf. Size: ${typeof res.data === 'string' ? res.data.length : 'unknown'} bytes.`;
    }
    const res = await client.get("/{api_key}/customer/get/statement/{cid}", { cid: args.cid as number });
    return `PDF statement generated. Content-Type: application/pdf. Size: ${typeof res.data === 'string' ? res.data.length : 'unknown'} bytes.`;
  },
};

// ---------------------------------------------------------------------------
// CUSTOMER CONTACTS
// ---------------------------------------------------------------------------

const getCustomerContacts: ToolDef = {
  name: "get_customer_contacts",
  description: "Get all contacts for a customer.",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID" },
    },
    required: ["cid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/customer/{cid}/contacts", { cid: args.cid as number });
    return formatResult(res.data);
  },
};

const createCustomerContact: ToolDef = {
  name: "create_customer_contact",
  description: "Create a new contact for a customer.",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID" },
      contact_data: { type: "object", description: "Contact details" },
    },
    required: ["cid", "contact_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/customer/{cid}/contacts", { cid: args.cid as number }, args.contact_data);
    return formatResult(res.data);
  },
};

const getCustomerContact: ToolDef = {
  name: "get_customer_contact",
  description: "Get a specific contact for a customer.",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID" },
      contact_id: { type: "integer", description: "Contact ID" },
    },
    required: ["cid", "contact_id"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/customer/{cid}/contact/{contact_id}", {
      cid: args.cid as number,
      contact_id: args.contact_id as number,
    });
    return formatResult(res.data);
  },
};

const updateCustomerContact: ToolDef = {
  name: "update_customer_contact",
  description: "Update a contact for a customer.",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID" },
      contact_id: { type: "integer", description: "Contact ID" },
      contact_data: { type: "object", description: "Updated contact details" },
    },
    required: ["cid", "contact_id", "contact_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/customer/{cid}/contact/{contact_id}", {
      cid: args.cid as number,
      contact_id: args.contact_id as number,
    }, args.contact_data);
    return formatResult(res.data);
  },
};

const deleteCustomerContact: ToolDef = {
  name: "delete_customer_contact",
  description: "Delete a contact from a customer.",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID" },
      contact_id: { type: "integer", description: "Contact ID" },
    },
    required: ["cid", "contact_id"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/customer/{cid}/contact/{contact_id}/delete", {
      cid: args.cid as number,
      contact_id: args.contact_id as number,
    });
    return formatResult(res.data);
  },
};

const addContactLegacy: ToolDef = {
  name: "add_customer_contact_legacy",
  description: "Add a contact to a customer (legacy endpoint).",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID" },
      contact_data: { type: "object", description: "Contact data" },
    },
    required: ["cid", "contact_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/customer/contact/add/{cid}", { cid: args.cid as number }, args.contact_data);
    return formatResult(res.data);
  },
};

const getContactsLegacy: ToolDef = {
  name: "get_customer_contacts_legacy",
  description: "Get all contacts for a customer (legacy endpoint).",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID" },
    },
    required: ["cid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/customer/contact/get/{cid}", { cid: args.cid as number });
    return formatResult(res.data);
  },
};

// ---------------------------------------------------------------------------
// PAYMENT METHODS
// ---------------------------------------------------------------------------

const listPaymentMethods: ToolDef = {
  name: "list_payment_methods",
  description: "List all payment methods for a customer (active and inactive).",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID" },
    },
    required: ["cid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/customer/{cid}/paymentMethods", { cid: args.cid as number });
    return formatResult(res.data);
  },
};

const filterPaymentMethods: ToolDef = {
  name: "filter_payment_methods",
  description: "Filter payment methods by active status, type (bank/card), primary/backup, or payment gateway.",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID" },
      filter_data: { type: "object", description: "Filter criteria" },
    },
    required: ["cid", "filter_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/customer/{cid}/paymentMethods", { cid: args.cid as number }, args.filter_data);
    return formatResult(res.data);
  },
};

const addPaymentMethod: ToolDef = {
  name: "add_payment_method",
  description: "Add a new payment method to a customer (card via token/details, or bank account).",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID" },
      payment_method_data: { type: "object", description: "Payment method details" },
    },
    required: ["cid", "payment_method_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/customer/{cid}/paymentMethods/add", { cid: args.cid as number }, args.payment_method_data);
    return formatResult(res.data);
  },
};

const getPaymentMethod: ToolDef = {
  name: "get_payment_method",
  description: "Get details of a specific payment method.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "integer", description: "Payment Method ID" },
    },
    required: ["id"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/customer/paymentMethods/{id}", { id: args.id as number });
    return formatResult(res.data);
  },
};

const setPaymentMethodStatus: ToolDef = {
  name: "set_payment_method_status",
  description: "Set the status of a payment method (primary, backup, or inactive).",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "integer", description: "Payment Method ID" },
      status_data: { type: "object", description: "Status update (primary/backup/inactive)" },
    },
    required: ["id", "status_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/customer/paymentMethods/{id}/status", { id: args.id as number }, args.status_data);
    return formatResult(res.data);
  },
};

const setPaymentMethodNickname: ToolDef = {
  name: "set_payment_method_nickname",
  description: "Set the nickname/display name of a payment method.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "integer", description: "Payment Method ID" },
      nickname_data: { type: "object", description: "Nickname data" },
    },
    required: ["id", "nickname_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/customer/paymentMethods/{id}/nickname", { id: args.id as number }, args.nickname_data);
    return formatResult(res.data);
  },
};

// ---------------------------------------------------------------------------
// LEADS
// ---------------------------------------------------------------------------

const getLeadsPaginated: ToolDef = {
  name: "get_leads_paginated",
  description: "Get a paginated list of leads (20 per page).",
  inputSchema: {
    type: "object",
    properties: {
      page_number: { type: "integer", description: "Page number", default: 1 },
    },
    required: ["page_number"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/leads/get/page/{page_number}", { page_number: args.page_number as number });
    return formatResult(res.data);
  },
};

const filterLeads: ToolDef = {
  name: "filter_leads",
  description: "Filter leads with optional criteria (all properties optional).",
  inputSchema: {
    type: "object",
    properties: {
      page_number: { type: "integer", description: "Page number", default: 1 },
      filter_data: { type: "object", description: "Filter options" },
    },
    required: ["page_number"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/leads/filter/get/page/{page_number}", {
      page_number: args.page_number as number,
    }, args.filter_data ?? {});
    return formatResult(res.data);
  },
};

const getLead: ToolDef = {
  name: "get_lead",
  description: "Get a specific lead by ID.",
  inputSchema: {
    type: "object",
    properties: {
      lid: { type: "integer", description: "Lead ID" },
    },
    required: ["lid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/leads/get/{lid}", { lid: args.lid as number });
    return formatResult(res.data);
  },
};

const addLead: ToolDef = {
  name: "add_lead",
  description: "Create a new lead.",
  inputSchema: {
    type: "object",
    properties: {
      lead_data: { type: "object", description: "Lead data" },
    },
    required: ["lead_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/leads/add", {}, args.lead_data);
    return formatResult(res.data);
  },
};

const updateLead: ToolDef = {
  name: "update_lead",
  description: "Update an existing lead.",
  inputSchema: {
    type: "object",
    properties: {
      lid: { type: "integer", description: "Lead ID" },
      lead_data: { type: "object", description: "Updated lead data" },
    },
    required: ["lid", "lead_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/leads/{lid}", { lid: args.lid as number }, args.lead_data);
    return formatResult(res.data);
  },
};

// ---------------------------------------------------------------------------
// PRODUCTS
// ---------------------------------------------------------------------------

const getProductsByCategory: ToolDef = {
  name: "get_products_by_category",
  description: "Get products for a category, optionally paginated.",
  inputSchema: {
    type: "object",
    properties: {
      catid: { type: "integer", description: "Category ID" },
      page_number: { type: "integer", description: "Optional page number" },
    },
    required: ["catid"],
  },
  handler: async (client, args) => {
    if (args.page_number) {
      const res = await client.get("/{api_key}/products/category/{catid}/page/{page_number}", {
        catid: args.catid as number,
        page_number: args.page_number as number,
      });
      return formatResult(res.data);
    }
    const res = await client.get("/{api_key}/products/category/{catid}", { catid: args.catid as number });
    return formatResult(res.data);
  },
};

const getProduct: ToolDef = {
  name: "get_product",
  description: "Get a specific product by ID.",
  inputSchema: {
    type: "object",
    properties: {
      pid: { type: "integer", description: "Product ID" },
    },
    required: ["pid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/products/get/{pid}", { pid: args.pid as number });
    return formatResult(res.data);
  },
};

const getAllProducts: ToolDef = {
  name: "get_all_products",
  description: "Get all products (no pagination).",
  inputSchema: { type: "object", properties: {} },
  handler: async (client) => {
    const res = await client.get("/{api_key}/products/getAll");
    return formatResult(res.data);
  },
};

// ---------------------------------------------------------------------------
// SERVICE TYPES
// ---------------------------------------------------------------------------

const getServiceTypesPaginated: ToolDef = {
  name: "get_service_types_paginated",
  description: "Get a paginated list of service types.",
  inputSchema: {
    type: "object",
    properties: {
      page_number: { type: "integer", description: "Page number", default: 1 },
    },
    required: ["page_number"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/serviceType/get/page/{page_number}", { page_number: args.page_number as number });
    return formatResult(res.data);
  },
};

const getServiceType: ToolDef = {
  name: "get_service_type",
  description: "Get details of a specific service type.",
  inputSchema: {
    type: "object",
    properties: {
      esid: { type: "integer", description: "Service Type ID" },
    },
    required: ["esid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/serviceType/get/{esid}", { esid: args.esid as number });
    return formatResult(res.data);
  },
};

const filterServiceTypes: ToolDef = {
  name: "filter_service_types",
  description: "Filter service types with optional criteria. Can be paginated or unpaginated.",
  inputSchema: {
    type: "object",
    properties: {
      page_number: { type: "integer", description: "Page number (omit for all results)" },
      filter_data: { type: "object", description: "Filter options" },
    },
  },
  handler: async (client, args) => {
    if (args.page_number) {
      const res = await client.post("/{api_key}/serviceType/filter/get/page/{page_number}", {
        page_number: args.page_number as number,
      }, args.filter_data ?? {});
      return formatResult(res.data);
    }
    const res = await client.post("/{api_key}/serviceType/filter/get", {}, args.filter_data ?? {});
    return formatResult(res.data);
  },
};

const addServiceType: ToolDef = {
  name: "add_service_type",
  description: "Create a new service type.",
  inputSchema: {
    type: "object",
    properties: {
      service_type_data: { type: "object", description: "Service type data" },
    },
    required: ["service_type_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/serviceType/add", {}, args.service_type_data);
    return formatResult(res.data);
  },
};

const updateServiceType: ToolDef = {
  name: "update_service_type",
  description: "Update an existing service type.",
  inputSchema: {
    type: "object",
    properties: {
      esid: { type: "integer", description: "Service Type ID" },
      service_type_data: { type: "object", description: "Updated service type data" },
    },
    required: ["esid", "service_type_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/serviceType/update/{esid}", { esid: args.esid as number }, args.service_type_data);
    return formatResult(res.data);
  },
};

const deleteServiceType: ToolDef = {
  name: "delete_service_type",
  description: "Delete a service type. Fails if there are active services using it.",
  inputSchema: {
    type: "object",
    properties: {
      esid: { type: "integer", description: "Service Type ID" },
    },
    required: ["esid"],
  },
  handler: async (client, args) => {
    const res = await client.del("/{api_key}/serviceType/delete/{esid}", { esid: args.esid as number });
    return formatResult(res.data);
  },
};

// ---------------------------------------------------------------------------
// SERVICES (ENGINEERING)
// ---------------------------------------------------------------------------

const getService: ToolDef = {
  name: "get_service",
  description: "Get a specific service record by ID.",
  inputSchema: {
    type: "object",
    properties: {
      enid: { type: "integer", description: "Service/Engineering ID" },
    },
    required: ["enid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/engineering/get/{enid}", { enid: args.enid as number });
    return formatResult(res.data);
  },
};

const addService: ToolDef = {
  name: "add_service",
  description: "Create a new service record.",
  inputSchema: {
    type: "object",
    properties: {
      service_data: { type: "object", description: "Service data" },
    },
    required: ["service_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/engineering/add", {}, args.service_data);
    return formatResult(res.data);
  },
};

const updateService: ToolDef = {
  name: "update_service",
  description: "Update an existing service record.",
  inputSchema: {
    type: "object",
    properties: {
      enid: { type: "integer", description: "Service/Engineering ID" },
      service_data: { type: "object", description: "Updated service data" },
    },
    required: ["enid", "service_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/engineering/update/{enid}", { enid: args.enid as number }, args.service_data);
    return formatResult(res.data);
  },
};

const searchServices: ToolDef = {
  name: "search_services",
  description: "Search for services with flexible criteria.",
  inputSchema: {
    type: "object",
    properties: {
      search_criteria: { type: "object", description: "Search criteria" },
    },
    required: ["search_criteria"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/engineering/search", {}, args.search_criteria);
    return formatResult(res.data);
  },
};

const calculateETF: ToolDef = {
  name: "calculate_etf",
  description: "Calculate Early Termination Fee for a service.",
  inputSchema: {
    type: "object",
    properties: {
      enid: { type: "integer", description: "Service/Engineering ID" },
    },
    required: ["enid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/engineering/{enid}/calculateETF", { enid: args.enid as number });
    return formatResult(res.data);
  },
};

const executeETF: ToolDef = {
  name: "execute_etf",
  description: "Execute Early Termination Fee - creates invoice item for ETF charge.",
  inputSchema: {
    type: "object",
    properties: {
      enid: { type: "integer", description: "Service/Engineering ID" },
    },
    required: ["enid"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/engineering/{enid}/doETF", { enid: args.enid as number });
    return formatResult(res.data);
  },
};

const addServiceItem: ToolDef = {
  name: "add_service_item",
  description: "Add a one-time charge item to a service (fees, equipment, installation, etc.). Requires product ID (pid).",
  inputSchema: {
    type: "object",
    properties: {
      item_data: { type: "object", description: "Service item data including pid" },
    },
    required: ["item_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/engineering/item/add", {}, args.item_data);
    return formatResult(res.data);
  },
};

const updateServiceItem: ToolDef = {
  name: "update_service_item",
  description: "Update a one-time charge item on a service.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "integer", description: "Service item ID" },
      item_data: { type: "object", description: "Updated item data" },
    },
    required: ["id", "item_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/engineering/item/update/{id}", { id: args.id as number }, args.item_data);
    return formatResult(res.data);
  },
};

const getMonthlyCost: ToolDef = {
  name: "get_monthly_cost",
  description: "Get the actual monthly cost charged for a service on a specific date (from invoice data).",
  inputSchema: {
    type: "object",
    properties: {
      date: { type: "string", description: "Date in YYYY-MM-DD format" },
      service_num: { type: "string", description: "Service number" },
    },
    required: ["date", "service_num"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/services/get/monthlyCostByServiceNumber/{date}/{service_num}", {
      date: args.date as string,
      service_num: args.service_num as string,
    });
    return formatResult(res.data);
  },
};

const getProRataCost: ToolDef = {
  name: "get_pro_rata_cost",
  description: "Calculate pro-rata monthly cost for a service starting on a specific date.",
  inputSchema: {
    type: "object",
    properties: {
      date: { type: "string", description: "Start date in YYYY-MM-DD format" },
      service_num: { type: "string", description: "Service number" },
    },
    required: ["date", "service_num"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/services/get/monthlyCostByServiceNumber/proRata/{date}/{service_num}", {
      date: args.date as string,
      service_num: args.service_num as string,
    });
    return formatResult(res.data);
  },
};

const getDailyCost: ToolDef = {
  name: "get_daily_cost",
  description: "Calculate daily cost for an active service (monthlyfee / days in current month).",
  inputSchema: {
    type: "object",
    properties: {
      service_num: { type: "string", description: "Service number" },
    },
    required: ["service_num"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/services/get/monthlyCostByServiceNumber/daily/{service_num}", {
      service_num: args.service_num as string,
    });
    return formatResult(res.data);
  },
};

// ---------------------------------------------------------------------------
// INVOICES
// ---------------------------------------------------------------------------

const getInvoices: ToolDef = {
  name: "get_invoices",
  description: "Get all invoices, optionally ordered by a field (iid, cid, date, company, duedate, balance).",
  inputSchema: {
    type: "object",
    properties: {
      order_by: { type: "string", description: "Optional field to order by", enum: ["iid", "cid", "date", "company", "duedate", "balance"] },
    },
  },
  handler: async (client, args) => {
    if (args.order_by) {
      const res = await client.post("/{api_key}/invoice/get", {}, { order_by: args.order_by });
      return formatResult(res.data);
    }
    const res = await client.get("/{api_key}/invoice/get");
    return formatResult(res.data);
  },
};

const getInvoice: ToolDef = {
  name: "get_invoice",
  description: "Get a specific invoice by ID.",
  inputSchema: {
    type: "object",
    properties: {
      iid: { type: "integer", description: "Invoice ID" },
    },
    required: ["iid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/invoice/get/{iid}", { iid: args.iid as number });
    return formatResult(res.data);
  },
};

const getCustomerInvoices: ToolDef = {
  name: "get_customer_invoices",
  description: "Get all invoices for a specific customer, optionally filtered.",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID" },
      filter: { type: "string", description: "Optional filter string (e.g. 'paid=1', 'balance>100', 'date>=2024-01-01')" },
    },
    required: ["cid"],
  },
  handler: async (client, args) => {
    if (args.filter) {
      const res = await client.get("/{api_key}/invoice/get/customer/{cid}/filter/{filter}", {
        cid: args.cid as number,
        filter: args.filter as string,
      });
      return formatResult(res.data);
    }
    const res = await client.get("/{api_key}/invoice/get/customer/{cid}", { cid: args.cid as number });
    return formatResult(res.data);
  },
};

const getFilteredInvoicesPaginated: ToolDef = {
  name: "get_filtered_invoices_paginated",
  description: "Get filtered and paginated invoices (20 per page). Supported filters: bad_debt, paid, date_modified, date, duedate, balance, draft, void.",
  inputSchema: {
    type: "object",
    properties: {
      filter: { type: "string", description: "Filter string (e.g. 'paid=1', 'balance>100')" },
      page_number: { type: "integer", description: "Page number", default: 1 },
    },
    required: ["filter", "page_number"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/invoice/get/filter/{filter}/page/{page_number}", {
      filter: args.filter as string,
      page_number: args.page_number as number,
    });
    return formatResult(res.data);
  },
};

const getInvoicePdf: ToolDef = {
  name: "get_invoice_pdf",
  description: "Download an invoice as PDF.",
  inputSchema: {
    type: "object",
    properties: {
      iid: { type: "integer", description: "Invoice ID" },
    },
    required: ["iid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/invoice/get/pdf/{iid}", { iid: args.iid as number });
    return `PDF invoice generated for invoice ${args.iid}. Content-Type: application/pdf.`;
  },
};

const getInvoiceStatement: ToolDef = {
  name: "get_invoice_statement",
  description: "Download a customer statement as PDF.",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID" },
    },
    required: ["cid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/invoice/get/statement/{cid}", { cid: args.cid as number });
    return `PDF statement generated for customer ${args.cid}. Content-Type: application/pdf.`;
  },
};

const voidInvoice: ToolDef = {
  name: "void_invoice",
  description: "Void an invoice.",
  inputSchema: {
    type: "object",
    properties: {
      iid: { type: "integer", description: "Invoice ID" },
    },
    required: ["iid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/invoice/{iid}/void", { iid: args.iid as number });
    return formatResult(res.data);
  },
};

const markBadDebt: ToolDef = {
  name: "mark_invoice_bad_debt",
  description: "Mark an invoice as bad debt.",
  inputSchema: {
    type: "object",
    properties: {
      iid: { type: "integer", description: "Invoice ID" },
    },
    required: ["iid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/invoice/{iid}/bad_debt", { iid: args.iid as number });
    return formatResult(res.data);
  },
};

// ---------------------------------------------------------------------------
// CDR
// ---------------------------------------------------------------------------

const addCdr: ToolDef = {
  name: "add_cdr",
  description: "Add a single Call Detail Record for billing. API Key must have cdr_source variable set.",
  inputSchema: {
    type: "object",
    properties: {
      cdr_data: { type: "object", description: "CDR data" },
    },
    required: ["cdr_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/cdr/add", {}, args.cdr_data);
    return formatResult(res.data);
  },
};

const addMultipleCdrs: ToolDef = {
  name: "add_multiple_cdrs",
  description: "Add multiple CDRs in a single request. API Key must have cdr_source variable set.",
  inputSchema: {
    type: "object",
    properties: {
      cdrs: { type: "array", items: { type: "object" }, description: "Array of CDR data objects" },
    },
    required: ["cdrs"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/cdr/multiple/add", {}, args.cdrs);
    return formatResult(res.data);
  },
};

const getCdrPrice: ToolDef = {
  name: "get_cdr_price",
  description: "Get rating/pricing info for a specific CDR by orig_id.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", description: "CDR orig_id" },
    },
    required: ["id"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/cdr/getPrice/{id}", { id: args.id as string });
    return formatResult(res.data);
  },
};

const getMultipleCdrPrices: ToolDef = {
  name: "get_multiple_cdr_prices",
  description: "Get rating info for multiple CDRs.",
  inputSchema: {
    type: "object",
    properties: {
      ids: { type: "array", items: { type: "string" }, description: "Array of CDR orig_ids" },
    },
    required: ["ids"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/cdr/getMultiplePrice", {}, args.ids);
    return formatResult(res.data);
  },
};

const getCdrStatus: ToolDef = {
  name: "get_cdr_status",
  description: "Get CDR processing status.",
  inputSchema: { type: "object", properties: {} },
  handler: async (client) => {
    const res = await client.get("/{api_key}/cdr/status");
    return formatResult(res.data);
  },
};

// ---------------------------------------------------------------------------
// CALL TYPES
// ---------------------------------------------------------------------------

const getCallTypesPaginated: ToolDef = {
  name: "get_call_types_paginated",
  description: "Get paginated list of call types (20 per page).",
  inputSchema: {
    type: "object",
    properties: {
      page_number: { type: "integer", description: "Page number", default: 1 },
    },
  },
  handler: async (client, args) => {
    const page = (args.page_number as number) || 1;
    const res = await client.get("/{api_key}/callType/get/page/{page_number}", { page_number: page });
    return formatResult(res.data);
  },
};

const getCallType: ToolDef = {
  name: "get_call_type",
  description: "Get detailed call type information including default rates.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "integer", description: "Call Type ID (ctid)" },
    },
    required: ["id"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/callType/get/{id}", { id: args.id as number });
    return formatResult(res.data);
  },
};

// ---------------------------------------------------------------------------
// CALL PACKS
// ---------------------------------------------------------------------------

const getAllCallPacks: ToolDef = {
  name: "get_all_call_packs",
  description: "Get all call packs for the department.",
  inputSchema: { type: "object", properties: {} },
  handler: async (client) => {
    const res = await client.get("/{api_key}/call_pack/get");
    return formatResult(res.data);
  },
};

const getCallPack: ToolDef = {
  name: "get_call_pack",
  description: "Get a specific call pack by ID.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "integer", description: "Call pack ID" },
    },
    required: ["id"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/call_pack/get/{id}", { id: args.id as number });
    return formatResult(res.data);
  },
};

const getCustomerCallPacks: ToolDef = {
  name: "get_customer_call_packs",
  description: "Get all call packs for a specific customer.",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID" },
    },
    required: ["cid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/call_pack/customer/get/{cid}", { cid: args.cid as number });
    return formatResult(res.data);
  },
};

const addCallPack: ToolDef = {
  name: "add_call_pack",
  description: "Create a new call pack subscription for a customer.",
  inputSchema: {
    type: "object",
    properties: {
      call_pack_data: { type: "object", description: "Call pack data" },
    },
    required: ["call_pack_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/call_pack/add", {}, args.call_pack_data);
    return formatResult(res.data);
  },
};

const upgradeCallPack: ToolDef = {
  name: "upgrade_call_pack",
  description: "Upgrade a call pack (ends current today, creates new from 1st of current month).",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "integer", description: "Call pack ID" },
    },
    required: ["id"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/call_pack/upgrade/{id}", { id: args.id as number });
    return formatResult(res.data);
  },
};

const downgradeCallPack: ToolDef = {
  name: "downgrade_call_pack",
  description: "Downgrade a call pack (ends current today, creates new from 1st of next month).",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "integer", description: "Call pack ID" },
    },
    required: ["id"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/call_pack/downgrade/{id}", { id: args.id as number });
    return formatResult(res.data);
  },
};

const cancelCallPack: ToolDef = {
  name: "cancel_call_pack",
  description: "Cancel a call pack (minimum 30 days notice).",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "integer", description: "Call pack ID" },
      date_ended: { type: "string", description: "Requested end date (min 30 days from today, YYYY-MM-DD)" },
    },
    required: ["id"],
  },
  handler: async (client, args) => {
    const body = args.date_ended ? { date_ended: args.date_ended } : {};
    const res = await client.post("/{api_key}/call_pack/cancel/{id}", { id: args.id as number }, body);
    return formatResult(res.data);
  },
};

// ---------------------------------------------------------------------------
// CALL PACK TYPES
// ---------------------------------------------------------------------------

const getAllCallPackTypes: ToolDef = {
  name: "get_all_call_pack_types",
  description: "Get all call pack types (templates) for the department.",
  inputSchema: { type: "object", properties: {} },
  handler: async (client) => {
    const res = await client.get("/{api_key}/call_pack_type/get");
    return formatResult(res.data);
  },
};

const getCallPackType: ToolDef = {
  name: "get_call_pack_type",
  description: "Get a specific call pack type by ID.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "integer", description: "Call pack type ID" },
    },
    required: ["id"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/call_pack_type/get/{id}", { id: args.id as number });
    return formatResult(res.data);
  },
};

const addCallPackType: ToolDef = {
  name: "add_call_pack_type",
  description: "Create a new call pack type (template).",
  inputSchema: {
    type: "object",
    properties: {
      type_data: { type: "object", description: "Call pack type data" },
    },
    required: ["type_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/call_pack_type/add", {}, args.type_data);
    return formatResult(res.data);
  },
};

const updateCallPackType: ToolDef = {
  name: "update_call_pack_type",
  description: "Update a call pack type.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "integer", description: "Call pack type ID" },
      type_data: { type: "object", description: "Updated call pack type data" },
    },
    required: ["id", "type_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/call_pack_type/update/{id}", { id: args.id as number }, args.type_data);
    return formatResult(res.data);
  },
};

// ---------------------------------------------------------------------------
// CALL RATES
// ---------------------------------------------------------------------------

const getCallRatesPaginated: ToolDef = {
  name: "get_call_rates_paginated",
  description: "Get paginated list of call rate groups (tariff groups).",
  inputSchema: {
    type: "object",
    properties: {
      page_number: { type: "integer", description: "Page number", default: 1 },
    },
  },
  handler: async (client, args) => {
    const page = (args.page_number as number) || 1;
    const res = await client.get("/{api_key}/callRates/get/page/{page_number}", { page_number: page });
    return formatResult(res.data);
  },
};

const getCallRateGroup: ToolDef = {
  name: "get_call_rate_group",
  description: "Get a specific call rate group with all associated call type rates.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "integer", description: "Call rate group ID (ctgid)" },
    },
    required: ["id"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/callRates/get/{id}", { id: args.id as number });
    return formatResult(res.data);
  },
};

const saveCallRateGroup: ToolDef = {
  name: "save_call_rate_group",
  description: "Create or update a call rate group with call type rates.",
  inputSchema: {
    type: "object",
    properties: {
      rate_group_data: { type: "object", description: "Call rate group data" },
    },
    required: ["rate_group_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/callRates/post", {}, args.rate_group_data);
    return formatResult(res.data);
  },
};

// ---------------------------------------------------------------------------
// REPORTING
// ---------------------------------------------------------------------------

const runReport: ToolDef = {
  name: "run_report",
  description: "Run a report. Common reports: agedReceivables, invoiceListing, revenueSummary, customerBillingSummary, etc.",
  inputSchema: {
    type: "object",
    properties: {
      report_data: { type: "object", description: "Report request including name and options" },
    },
    required: ["report_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/report", {}, args.report_data);
    return formatResult(res.data);
  },
};

// ---------------------------------------------------------------------------
// TIMELINE
// ---------------------------------------------------------------------------

const getTimeline: ToolDef = {
  name: "get_timeline",
  description: "Get timeline entries (notes, events) for a specific record.",
  inputSchema: {
    type: "object",
    properties: {
      module: { type: "string", description: "Module name (e.g., customer, orders, helpdesk)" },
      id: { type: "integer", description: "Record ID" },
    },
    required: ["module", "id"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/timeline/{module}/{id}", {
      module: args.module as string,
      id: args.id as number,
    });
    return formatResult(res.data);
  },
};

const addTimelineEntry: ToolDef = {
  name: "add_timeline_entry",
  description: "Add a timeline entry (note or event) to a record.",
  inputSchema: {
    type: "object",
    properties: {
      module: { type: "string", description: "Module name (e.g., customer, orders, helpdesk)" },
      id: { type: "integer", description: "Record ID" },
      entry_data: { type: "object", description: "Timeline entry data" },
    },
    required: ["module", "id", "entry_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/timeline/{module}/{id}", {
      module: args.module as string,
      id: args.id as number,
    }, args.entry_data);
    return formatResult(res.data);
  },
};

// ---------------------------------------------------------------------------
// PRICE BOOKS
// ---------------------------------------------------------------------------

const getPriceBooksPaginated: ToolDef = {
  name: "get_price_books_paginated",
  description: "Get paginated list of price books (20 per page).",
  inputSchema: {
    type: "object",
    properties: {
      page_number: { type: "integer", description: "Page number", default: 1 },
    },
    required: ["page_number"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/priceBooks/get/page/{page_number}", { page_number: args.page_number as number });
    return formatResult(res.data);
  },
};

const getPriceBook: ToolDef = {
  name: "get_price_book",
  description: "Get detailed price book information including all items.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "integer", description: "Price Book ID" },
    },
    required: ["id"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/priceBooks/get/{id}", { id: args.id as number });
    return formatResult(res.data);
  },
};

const savePriceBook: ToolDef = {
  name: "save_price_book",
  description: "Create or update a price book.",
  inputSchema: {
    type: "object",
    properties: {
      price_book_data: { type: "object", description: "Price book data" },
    },
    required: ["price_book_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/priceBooks/post", {}, args.price_book_data);
    return formatResult(res.data);
  },
};

// ---------------------------------------------------------------------------
// SERVICE BUNDLES
// ---------------------------------------------------------------------------

const getServiceBundle: ToolDef = {
  name: "get_service_bundle",
  description: "Get detailed service bundle information including related services.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "integer", description: "Service Bundle ID" },
    },
    required: ["id"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/serviceBundles/get/{id}", { id: args.id as number });
    return formatResult(res.data);
  },
};

const getCustomerServiceBundles: ToolDef = {
  name: "get_customer_service_bundles",
  description: "Get all service bundles for a specific customer.",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID" },
    },
    required: ["cid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/serviceBundles/getByCustomer/{cid}", { cid: args.cid as number });
    return formatResult(res.data);
  },
};

// ---------------------------------------------------------------------------
// ORDERS
// ---------------------------------------------------------------------------

const getOrders: ToolDef = {
  name: "get_orders",
  description: "Get paginated list of orders.",
  inputSchema: {
    type: "object",
    properties: {
      page_number: { type: "integer", description: "Optional page number" },
    },
  },
  handler: async (client, args) => {
    if (args.page_number) {
      const res = await client.get("/{api_key}/orders/get/page/{page_number}", { page_number: args.page_number as number });
      return formatResult(res.data);
    }
    const res = await client.get("/{api_key}/orders/get");
    return formatResult(res.data);
  },
};

const getOrder: ToolDef = {
  name: "get_order",
  description: "Get a specific order with full details.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "integer", description: "Order ID" },
    },
    required: ["id"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/orders/get/{id}", { id: args.id as number });
    return formatResult(res.data);
  },
};

const updateOrder: ToolDef = {
  name: "update_order",
  description: "Update an existing order.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "integer", description: "Order ID" },
      order_data: { type: "object", description: "Updated order data" },
    },
    required: ["id", "order_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/orders/update/{id}", { id: args.id as number }, args.order_data);
    return formatResult(res.data);
  },
};

const updateOrderData: ToolDef = {
  name: "update_order_data",
  description: "Update order workflow data.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "integer", description: "Order ID" },
      data: { type: "object", description: "Order workflow data" },
    },
    required: ["id", "data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/orders/updateData/{id}", { id: args.id as number }, args.data);
    return formatResult(res.data);
  },
};

// ---------------------------------------------------------------------------
// HELPDESK
// ---------------------------------------------------------------------------

const getHelpdeskTickets: ToolDef = {
  name: "get_helpdesk_tickets",
  description: "Get paginated list of helpdesk tickets with optional filtering by status (0=open, 1=closed, 2=void), customer ID, user ID, priority (1=low, 2=medium, 3=high), or search text.",
  inputSchema: {
    type: "object",
    properties: {
      page_number: { type: "integer", description: "Page number" },
      status: { type: "integer", description: "Filter by status (0=open, 1=closed, 2=void)" },
      cid: { type: "integer", description: "Filter by customer ID" },
      uid: { type: "integer", description: "Filter by assigned user ID" },
      priority: { type: "integer", description: "Filter by priority (1=low, 2=medium, 3=high)" },
      search: { type: "string", description: "Search in subject and company" },
      limit: { type: "integer", description: "Records per page (default: 20)" },
    },
  },
  handler: async (client, args) => {
    const queryParams: Record<string, string | number | boolean | undefined> = {};
    if (args.status !== undefined) queryParams.status = args.status as number;
    if (args.cid !== undefined) queryParams.cid = args.cid as number;
    if (args.uid !== undefined) queryParams.uid = args.uid as number;
    if (args.priority !== undefined) queryParams.priority = args.priority as number;
    if (args.search !== undefined) queryParams.search = args.search as string;
    if (args.limit !== undefined) queryParams.limit = args.limit as number;

    if (args.page_number) {
      const res = await client.get("/{api_key}/helpdesk/tickets/page/{page_number}", {
        page_number: args.page_number as number,
      }, queryParams);
      return formatResult(res.data);
    }
    const res = await client.get("/{api_key}/helpdesk/tickets", {}, queryParams);
    return formatResult(res.data);
  },
};

const getOutstandingTickets: ToolDef = {
  name: "get_outstanding_tickets",
  description: "Get all outstanding (open) helpdesk tickets, optionally for a specific user.",
  inputSchema: {
    type: "object",
    properties: {
      uid: { type: "integer", description: "Optional user ID to filter by" },
    },
  },
  handler: async (client, args) => {
    if (args.uid) {
      const res = await client.get("/{api_key}/helpdesk/tickets/outstanding/{uid}", { uid: args.uid as number });
      return formatResult(res.data);
    }
    const res = await client.get("/{api_key}/helpdesk/tickets/outstanding");
    return formatResult(res.data);
  },
};

const searchHelpdeskTickets: ToolDef = {
  name: "search_helpdesk_tickets",
  description: "Search helpdesk tickets.",
  inputSchema: {
    type: "object",
    properties: {
      search_data: { type: "object", description: "Search criteria" },
    },
    required: ["search_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/helpdesk/tickets/search", {}, args.search_data);
    return formatResult(res.data);
  },
};

const createHelpdeskTicket: ToolDef = {
  name: "create_helpdesk_ticket",
  description: "Create a new helpdesk ticket.",
  inputSchema: {
    type: "object",
    properties: {
      ticket_data: { type: "object", description: "Ticket data" },
    },
    required: ["ticket_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/helpdesk/ticket/create", {}, args.ticket_data);
    return formatResult(res.data);
  },
};

const getHelpdeskTicket: ToolDef = {
  name: "get_helpdesk_ticket",
  description: "Get a specific helpdesk ticket with full details.",
  inputSchema: {
    type: "object",
    properties: {
      htid: { type: "integer", description: "Helpdesk ticket ID" },
    },
    required: ["htid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/helpdesk/ticket/{htid}", { htid: args.htid as number });
    return formatResult(res.data);
  },
};

const updateHelpdeskTicket: ToolDef = {
  name: "update_helpdesk_ticket",
  description: "Update a helpdesk ticket.",
  inputSchema: {
    type: "object",
    properties: {
      htid: { type: "integer", description: "Helpdesk ticket ID" },
      ticket_data: { type: "object", description: "Updated ticket data" },
    },
    required: ["htid", "ticket_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/helpdesk/ticket/{htid}/update", { htid: args.htid as number }, args.ticket_data);
    return formatResult(res.data);
  },
};

const assignHelpdeskTicket: ToolDef = {
  name: "assign_helpdesk_ticket",
  description: "Assign a ticket to a user (0 for unassigned).",
  inputSchema: {
    type: "object",
    properties: {
      htid: { type: "integer", description: "Helpdesk ticket ID" },
      uid: { type: "integer", description: "User ID (0 for unassigned)" },
    },
    required: ["htid", "uid"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/helpdesk/ticket/{htid}/assign/{uid}", {
      htid: args.htid as number,
      uid: args.uid as number,
    });
    return formatResult(res.data);
  },
};

const closeHelpdeskTicket: ToolDef = {
  name: "close_helpdesk_ticket",
  description: "Close a helpdesk ticket.",
  inputSchema: {
    type: "object",
    properties: {
      htid: { type: "integer", description: "Helpdesk ticket ID" },
      note: { type: "string", description: "Closing note" },
      uid: { type: "integer", description: "User closing the ticket" },
    },
    required: ["htid"],
  },
  handler: async (client, args) => {
    const body: Record<string, unknown> = {};
    if (args.note) body.note = args.note;
    if (args.uid) body.uid = args.uid;
    const res = await client.post("/{api_key}/helpdesk/ticket/{htid}/close", { htid: args.htid as number }, body);
    return formatResult(res.data);
  },
};

const reopenHelpdeskTicket: ToolDef = {
  name: "reopen_helpdesk_ticket",
  description: "Reopen a closed helpdesk ticket.",
  inputSchema: {
    type: "object",
    properties: {
      htid: { type: "integer", description: "Helpdesk ticket ID" },
      note: { type: "string", description: "Reopening note" },
      uid: { type: "integer", description: "User reopening the ticket" },
    },
    required: ["htid"],
  },
  handler: async (client, args) => {
    const body: Record<string, unknown> = {};
    if (args.note) body.note = args.note;
    if (args.uid) body.uid = args.uid;
    const res = await client.post("/{api_key}/helpdesk/ticket/{htid}/reopen", { htid: args.htid as number }, body);
    return formatResult(res.data);
  },
};

const voidHelpdeskTicket: ToolDef = {
  name: "void_helpdesk_ticket",
  description: "Void a helpdesk ticket.",
  inputSchema: {
    type: "object",
    properties: {
      htid: { type: "integer", description: "Helpdesk ticket ID" },
      note: { type: "string", description: "Void reason" },
      uid: { type: "integer", description: "User voiding the ticket" },
    },
    required: ["htid"],
  },
  handler: async (client, args) => {
    const body: Record<string, unknown> = {};
    if (args.note) body.note = args.note;
    if (args.uid) body.uid = args.uid;
    const res = await client.post("/{api_key}/helpdesk/ticket/{htid}/void", { htid: args.htid as number }, body);
    return formatResult(res.data);
  },
};

const setTicketPriority: ToolDef = {
  name: "set_ticket_priority",
  description: "Set helpdesk ticket priority (1=low, 2=medium, 3=high).",
  inputSchema: {
    type: "object",
    properties: {
      htid: { type: "integer", description: "Helpdesk ticket ID" },
      priority: { type: "integer", description: "Priority (1=low, 2=medium, 3=high)" },
    },
    required: ["htid", "priority"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/helpdesk/ticket/{htid}/priority/{priority}", {
      htid: args.htid as number,
      priority: args.priority as number,
    });
    return formatResult(res.data);
  },
};

const getTicketNotes: ToolDef = {
  name: "get_ticket_notes",
  description: "Get all notes for a helpdesk ticket.",
  inputSchema: {
    type: "object",
    properties: {
      htid: { type: "integer", description: "Helpdesk ticket ID" },
    },
    required: ["htid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/helpdesk/ticket/{htid}/notes", { htid: args.htid as number });
    return formatResult(res.data);
  },
};

const addTicketNote: ToolDef = {
  name: "add_ticket_note",
  description: "Add a note to a helpdesk ticket.",
  inputSchema: {
    type: "object",
    properties: {
      htid: { type: "integer", description: "Helpdesk ticket ID" },
      note_data: { type: "object", description: "Note data" },
    },
    required: ["htid", "note_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/helpdesk/ticket/{htid}/note/add", { htid: args.htid as number }, args.note_data);
    return formatResult(res.data);
  },
};

const getNote: ToolDef = {
  name: "get_helpdesk_note",
  description: "Get a specific helpdesk note.",
  inputSchema: {
    type: "object",
    properties: {
      noteid: { type: "integer", description: "Note ID" },
    },
    required: ["noteid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/helpdesk/note/{noteid}", { noteid: args.noteid as number });
    return formatResult(res.data);
  },
};

const updateNote: ToolDef = {
  name: "update_helpdesk_note",
  description: "Update a helpdesk note.",
  inputSchema: {
    type: "object",
    properties: {
      noteid: { type: "integer", description: "Note ID" },
      note_data: { type: "object", description: "Updated note data" },
    },
    required: ["noteid", "note_data"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/helpdesk/note/{noteid}/update", { noteid: args.noteid as number }, args.note_data);
    return formatResult(res.data);
  },
};

const deleteNote: ToolDef = {
  name: "delete_helpdesk_note",
  description: "Delete a helpdesk note.",
  inputSchema: {
    type: "object",
    properties: {
      noteid: { type: "integer", description: "Note ID" },
    },
    required: ["noteid"],
  },
  handler: async (client, args) => {
    const res = await client.post("/{api_key}/helpdesk/note/{noteid}/delete", { noteid: args.noteid as number });
    return formatResult(res.data);
  },
};

const getCustomerTickets: ToolDef = {
  name: "get_customer_helpdesk_tickets",
  description: "Get all helpdesk tickets for a customer, optionally filtered by status.",
  inputSchema: {
    type: "object",
    properties: {
      cid: { type: "integer", description: "Customer ID" },
      status: { type: "integer", description: "Optional status filter" },
      limit: { type: "integer", description: "Optional result limit" },
    },
    required: ["cid"],
  },
  handler: async (client, args) => {
    const queryParams: Record<string, string | number | boolean | undefined> = {};
    if (args.status !== undefined) queryParams.status = args.status as number;
    if (args.limit !== undefined) queryParams.limit = args.limit as number;
    const res = await client.get("/{api_key}/helpdesk/customer/{cid}/tickets", { cid: args.cid as number }, queryParams);
    return formatResult(res.data);
  },
};

// ---------------------------------------------------------------------------
// CALENDAR
// ---------------------------------------------------------------------------

const getCalendar: ToolDef = {
  name: "get_calendar",
  description: "Get calendar HTML for a user.",
  inputSchema: {
    type: "object",
    properties: {
      uid: { type: "integer", description: "User ID" },
    },
    required: ["uid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/calendar/getCalendar/{uid}", { uid: args.uid as number });
    return `Calendar HTML returned for user ${args.uid}.`;
  },
};

const getCalendarEvents: ToolDef = {
  name: "get_calendar_events",
  description: "Get calendar events as JSON for a user.",
  inputSchema: {
    type: "object",
    properties: {
      uid: { type: "integer", description: "User ID" },
    },
    required: ["uid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/calendar/getEvents/{uid}", { uid: args.uid as number });
    return formatResult(res.data);
  },
};

const getCalendarEventsUrl: ToolDef = {
  name: "get_calendar_events_url",
  description: "Get calendar events as iCalendar (.ics) file for a user.",
  inputSchema: {
    type: "object",
    properties: {
      uid: { type: "integer", description: "User ID" },
    },
    required: ["uid"],
  },
  handler: async (client, args) => {
    const res = await client.get("/{api_key}/calendar/getEventsUrl/{uid}", { uid: args.uid as number });
    return `iCalendar file returned for user ${args.uid}.`;
  },
};

// ---------------------------------------------------------------------------
// AUTHENTICATION
// ---------------------------------------------------------------------------

const getApiKey: ToolDef = {
  name: "get_api_key",
  description: "Authenticate a user and retrieve their API key.",
  inputSchema: {
    type: "object",
    properties: {
      user: { type: "string", description: "Username" },
      pass: { type: "string", description: "Password" },
    },
    required: ["user", "pass"],
  },
  handler: async (client, args) => {
    const res = await client.get("/get-key/{user}/{pass}", {
      user: args.user as string,
      pass: args.pass as string,
    });
    return formatResult(res.data);
  },
};

// ---------------------------------------------------------------------------
// EXPORT ALL TOOLS
// ---------------------------------------------------------------------------

export const ALL_TOOLS: ToolDef[] = [
  // Sales / Qualification
  qualifyAddress,
  qualifyAddressNdf,
  avcCheck,
  addOrder,
  addExternalSale,

  // Customers
  getCustomersPaginated,
  getAllCustomers,
  getCustomer,
  searchCustomers,
  addCustomer,
  updateCustomer,
  getCustomerBalance,
  getCustomerPaymentDetails,
  makeCustomerPayment,
  logExternalPayment,
  addCustomerItem,
  updateCustomerItem,
  getCustomerServices,
  getCustomerServicePricing,
  getCreditManagementStatus,
  setCreditManagementStatus,
  getCustomerManagementStatus,
  setCustomerManagementStatus,
  authenticateCustomer,
  getCustomerStatement,

  // Customer Contacts
  getCustomerContacts,
  createCustomerContact,
  getCustomerContact,
  updateCustomerContact,
  deleteCustomerContact,
  addContactLegacy,
  getContactsLegacy,

  // Payment Methods
  listPaymentMethods,
  filterPaymentMethods,
  addPaymentMethod,
  getPaymentMethod,
  setPaymentMethodStatus,
  setPaymentMethodNickname,

  // Leads
  getLeadsPaginated,
  filterLeads,
  getLead,
  addLead,
  updateLead,

  // Products
  getProductsByCategory,
  getProduct,
  getAllProducts,

  // Service Types
  getServiceTypesPaginated,
  getServiceType,
  filterServiceTypes,
  addServiceType,
  updateServiceType,
  deleteServiceType,

  // Services (Engineering)
  getService,
  addService,
  updateService,
  searchServices,
  calculateETF,
  executeETF,
  addServiceItem,
  updateServiceItem,
  getMonthlyCost,
  getProRataCost,
  getDailyCost,

  // Invoices
  getInvoices,
  getInvoice,
  getCustomerInvoices,
  getFilteredInvoicesPaginated,
  getInvoicePdf,
  getInvoiceStatement,
  voidInvoice,
  markBadDebt,

  // CDR
  addCdr,
  addMultipleCdrs,
  getCdrPrice,
  getMultipleCdrPrices,
  getCdrStatus,

  // Call Types
  getCallTypesPaginated,
  getCallType,

  // Call Packs
  getAllCallPacks,
  getCallPack,
  getCustomerCallPacks,
  addCallPack,
  upgradeCallPack,
  downgradeCallPack,
  cancelCallPack,

  // Call Pack Types
  getAllCallPackTypes,
  getCallPackType,
  addCallPackType,
  updateCallPackType,

  // Call Rates
  getCallRatesPaginated,
  getCallRateGroup,
  saveCallRateGroup,

  // Reporting
  runReport,

  // Timeline
  getTimeline,
  addTimelineEntry,

  // Price Books
  getPriceBooksPaginated,
  getPriceBook,
  savePriceBook,

  // Service Bundles
  getServiceBundle,
  getCustomerServiceBundles,

  // Orders
  getOrders,
  getOrder,
  updateOrder,
  updateOrderData,

  // Helpdesk
  getHelpdeskTickets,
  getOutstandingTickets,
  searchHelpdeskTickets,
  createHelpdeskTicket,
  getHelpdeskTicket,
  updateHelpdeskTicket,
  assignHelpdeskTicket,
  closeHelpdeskTicket,
  reopenHelpdeskTicket,
  voidHelpdeskTicket,
  setTicketPriority,
  getTicketNotes,
  addTicketNote,
  getNote,
  updateNote,
  deleteNote,
  getCustomerTickets,

  // Calendar
  getCalendar,
  getCalendarEvents,
  getCalendarEventsUrl,

  // Authentication
  getApiKey,
];
