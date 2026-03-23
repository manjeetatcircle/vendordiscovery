import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const lastRun = await prisma.syncRun.findFirst({
    orderBy: {
      startedAt: "desc"
    }
  });

  return NextResponse.json({
    lastSync: lastRun
      ? {
          startedAt: lastRun.startedAt,
          finishedAt: lastRun.finishedAt,
          status: lastRun.status,
          recordsProcessed: lastRun.recordsProcessed,
          errorMessage: lastRun.errorMessage
        }
      : null
  });
}
