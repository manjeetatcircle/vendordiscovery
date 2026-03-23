"use client";

import { useState, useTransition } from "react";

type SyncRunView = {
  startedAt: string;
  finishedAt: string | null;
  status: string;
  recordsProcessed: number;
  errorMessage: string | null;
};

export function SyncStatusPanel({ lastRun }: { lastRun: SyncRunView | null }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function triggerSync() {
    startTransition(async () => {
      setMessage(null);
      const response = await fetch("/api/admin/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const payload = await response.json();
      setMessage(payload.message ?? "Sync completed.");
    });
  }

  return (
    <section className="grid gap-6">
      <article className="rounded-3xl border border-line bg-panel p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-ink">Inventory refresh</h2>
            <p className="mt-2 text-sm text-slate-600">
              Weekly scheduled sync can call the same endpoint used here.
            </p>
          </div>
          <button
            type="button"
            onClick={triggerSync}
            disabled={isPending}
            className="rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "Refreshing..." : "Run manual refresh"}
          </button>
        </div>
        {message ? <p className="mt-4 text-sm text-slate-700">{message}</p> : null}
      </article>

      <article className="rounded-3xl border border-line bg-white p-6">
        <h2 className="text-xl font-semibold text-ink">Last sync status</h2>
        {lastRun ? (
          <dl className="mt-4 grid gap-3 text-sm text-slate-700">
            <div>
              <dt className="font-semibold text-ink">Started</dt>
              <dd>{new Date(lastRun.startedAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Finished</dt>
              <dd>{lastRun.finishedAt ? new Date(lastRun.finishedAt).toLocaleString() : "In progress"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Status</dt>
              <dd className="capitalize">{lastRun.status.toLowerCase()}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Records processed</dt>
              <dd>{lastRun.recordsProcessed}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Error</dt>
              <dd>{lastRun.errorMessage ?? "None"}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 text-sm text-slate-700">No sync run has been recorded yet.</p>
        )}
      </article>
    </section>
  );
}
