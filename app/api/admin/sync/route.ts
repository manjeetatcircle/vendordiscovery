import { NextRequest, NextResponse } from "next/server";
import { syncVendorsFromZip } from "@/lib/vendor-sync";

export async function POST(request: NextRequest) {
  void request;

  const summary = await syncVendorsFromZip();
  return NextResponse.json({
    message:
      summary.status === "SUCCESS"
        ? `Vendor sync completed. ${summary.recordsProcessed} records processed.`
        : `Vendor sync failed: ${summary.errorMessage}`,
    summary
  });
}
