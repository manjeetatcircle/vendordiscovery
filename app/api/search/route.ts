import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchVendors } from "@/lib/vendor-search";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    query?: string;
    userName?: string;
    userEmail?: string;
  };

  const query = body.query?.trim();
  if (!query) {
    return NextResponse.json({ error: "Query is required." }, { status: 400 });
  }

  const result = await searchVendors(query);

  try {
    await prisma.searchLog.create({
      data: {
        queryText: query,
        userName: body.userName?.trim() || null,
        userEmail: body.userEmail?.trim() || null,
        matchedVendorId: result.bestMatch?.vendorId ?? null,
        matchedVendorName: result.bestMatch?.vendorName ?? null,
        matchExplanation: result.bestMatch?.whyItMatches ?? null
      }
    });
  } catch {
    // Allow mock-mode search responses before the database is provisioned.
  }

  return NextResponse.json(result);
}
