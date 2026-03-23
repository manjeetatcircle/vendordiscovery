import { env } from "@/lib/env";

const ZIP_BASE_URL = "https://api.ziphq.com";

export type ZipVendorRecord = {
  id: string | number;
  name?: string | null;
  description?: string | null;
  request_title?: string | null;
  request_description?: string | null;
  requestor_name?: string | null;
  requestor_email?: string | null;
  request_id?: string | number | null;
  department?: string | null;
  category?: string | null;
  subcategory?: string | null;
  status?: string | null;
  updated_at?: string | null;
  metadata?: Record<string, unknown> | null;
};

function asObject(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

async function zipFetch(path: string) {
  if (!env.ZIP_API_KEY) {
    throw new Error("ZIP_API_KEY is not configured.");
  }

  const response = await fetch(`${ZIP_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      "Zip-Api-Key": env.ZIP_API_KEY,
      accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Zip API request failed: ${response.status}`);
  }

  return response.json();
}

function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    const resolved = asString(value);
    if (resolved) {
      return resolved;
    }
  }
  return null;
}

export async function fetchZipVendors(): Promise<ZipVendorRecord[]> {
  const payload = await zipFetch("/vendors");

  if (Array.isArray(payload)) {
    return payload.map(normalizeZipVendor);
  }

  if (Array.isArray(payload?.vendors)) {
    return payload.vendors.map(normalizeZipVendor);
  }

  if (Array.isArray(payload?.data)) {
    return payload.data.map(normalizeZipVendor);
  }

  return [];
}

export function normalizeZipVendor(raw: Record<string, unknown>): ZipVendorRecord {
  const requestor = asObject(raw.requestor);
  const request = asObject(raw.request) ?? asObject(raw.purchase_request) ?? asObject(raw.request_details);
  const vendor = asObject(raw.vendor);
  return {
    id: firstString(raw.id, raw.vendor_id, request?.id) ?? crypto.randomUUID(),
    name: firstString(raw.vendor_name, raw.name, vendor?.name, request?.vendor_name, request?.name),
    description: firstString(
      raw.vendor_description,
      raw.description,
      raw.summary,
      vendor?.description,
      request?.vendor_description
    ),
    request_title: firstString(raw.request_title, raw.title, request?.title, request?.name, raw.name),
    request_description: firstString(
      raw.request_description,
      request?.description,
      request?.summary,
      raw.description
    ),
    requestor_name:
      firstString(raw.requestor_name, requestor?.name, raw.owner_name, request?.requestor_name, request?.owner_name),
    requestor_email:
      firstString(raw.requestor_email, requestor?.email, raw.owner_email, request?.requestor_email, request?.owner_email),
    request_id: firstString(raw.request_id, raw.purchase_request_id, request?.id),
    department: firstString(raw.department, request?.department),
    category: firstString(raw.category, request?.category),
    subcategory: firstString(raw.subcategory, request?.subcategory),
    status: firstString(raw.status, request?.status),
    updated_at: firstString(raw.updated_at, raw.last_updated_at, request?.updated_at),
    metadata: typeof raw.metadata === "object" && raw.metadata ? (raw.metadata as Record<string, unknown>) : null
  };
}
