import type { InventoryVendor } from "@/lib/vendor-search";

export const MOCK_VENDORS: InventoryVendor[] = [
  {
    vendorId: "vendor_001",
    vendorName: "Datadog",
    vendorDescription:
      "Cloud monitoring and security platform providing dashboards, alerting, observability, and incident response management.",
    requestTitle: "Datadog",
    requestDescription:
      "Cloud monitoring and security platform providing dashboards, alerting, observability, and incident response management.",
    requestorName: "Chris Bodensieck",
    requestorEmail: "chris.bodensieck@example.com",
    requestId: "REQ-1001",
    department: "Engineering",
    category: "Monitoring",
    subcategory: "Observability",
    status: "active"
  },
  {
    vendorId: "vendor_002",
    vendorName: "Checkr",
    vendorDescription: "Background screening and identity verification services for hiring and onboarding workflows.",
    requestTitle: "Checkr",
    requestDescription: "Background screening and identity verification services for hiring and onboarding workflows.",
    requestorName: "Singh, Manjeet",
    requestorEmail: "manjeet.singh@example.com",
    requestId: "REQ-1002",
    department: "People",
    category: "HR",
    subcategory: "Background Screening",
    status: "active"
  },
  {
    vendorId: "vendor_003",
    vendorName: "SeekOut",
    vendorDescription: "Recruitment search and talent intelligence platform for outbound sourcing and candidate discovery.",
    requestTitle: "SeekOut",
    requestDescription: "Recruitment search and talent intelligence platform for outbound sourcing and candidate discovery.",
    requestorName: "Dana Edwards",
    requestorEmail: "dana.edwards@example.com",
    requestId: "REQ-1003",
    department: "Talent",
    category: "Recruiting",
    subcategory: "Talent Sourcing",
    status: "active"
  }
];
