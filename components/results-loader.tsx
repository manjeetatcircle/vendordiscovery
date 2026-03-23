"use client";

import { useEffect, useState } from "react";
import { SearchResultsCard } from "@/components/search-results-card";

type SearchResultPayload = {
  query: string;
  bestMatch: {
    vendorId: string;
    vendorName: string;
    vendorDescription: string | null;
    requestorName: string | null;
    requestorEmail: string | null;
    confidence: "high" | "medium" | "low";
    whyItMatches: string;
  } | null;
  alternateMatches: Array<{
    vendorName: string;
    reason: string;
  }>;
  lowConfidence: boolean;
};

export function ResultsLoader({
  query,
  userName,
  userEmail
}: {
  query: string;
  userName?: string;
  userEmail?: string;
}) {
  const [result, setResult] = useState<SearchResultPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query, userName, userEmail })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        if (!cancelled) {
          setError(payload.error ?? "Search failed.");
        }
        return;
      }

      const payload = (await response.json()) as SearchResultPayload;
      if (!cancelled) {
        setResult(payload);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [query, userEmail, userName]);

  if (error) {
    return (
      <section className="rounded-[28px] border border-line bg-panel p-8 shadow-card">
        <p className="text-sm text-red-700">{error}</p>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="rounded-[28px] border border-line bg-panel p-8 shadow-card">
        <p className="text-sm text-slate-600">Searching vendor inventory...</p>
      </section>
    );
  }

  return <SearchResultsCard result={result} />;
}
