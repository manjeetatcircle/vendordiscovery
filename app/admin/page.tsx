import { prisma } from "@/lib/prisma";
import { SyncStatusPanel } from "@/components/sync-status-panel";

export default async function AdminPage() {
  let lastRun: Awaited<ReturnType<typeof prisma.syncRun.findFirst>> = null;
  try {
    lastRun = await prisma.syncRun.findFirst({
      orderBy: {
        startedAt: "desc"
      }
    });
  } catch {
    lastRun = null;
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Admin</h1>
        <p className="mt-2 text-sm text-slate-600">
          Trigger a manual vendor inventory refresh and review the latest sync status.
        </p>
      </div>
      <SyncStatusPanel
        lastRun={
          lastRun
            ? {
                startedAt: lastRun.startedAt.toISOString(),
                finishedAt: lastRun.finishedAt?.toISOString() ?? null,
                status: lastRun.status,
                recordsProcessed: lastRun.recordsProcessed,
                errorMessage: lastRun.errorMessage
              }
            : null
        }
      />
    </main>
  );
}
