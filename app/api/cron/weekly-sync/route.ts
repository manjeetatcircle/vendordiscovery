import { NextRequest, NextResponse } from "next/server";
import { syncVendorsFromZip } from "@/lib/vendor-sync";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await syncVendorsFromZip();
  return NextResponse.json(summary);
}
