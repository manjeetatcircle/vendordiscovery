type Match = {
  vendorId: string;
  vendorName: string;
  vendorDescription: string | null;
  requestorName: string | null;
  requestorEmail: string | null;
  confidence: "high" | "medium" | "low";
  whyItMatches: string;
};

type SearchResultPayload = {
  query: string;
  bestMatch: Match | null;
  alternateMatches: Array<{
    vendorName: string;
    reason: string;
  }>;
  lowConfidence: boolean;
};

export function SearchResultsCard({ result }: { result: SearchResultPayload }) {
  return (
    <section className="rounded-[28px] border border-line bg-panel p-8 shadow-card">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Search query</p>
      <h2 className="mt-3 text-2xl font-semibold text-ink">{result.query}</h2>

      {result.bestMatch ? (
        <div className="mt-8 grid gap-6">
          <article className="rounded-3xl border border-line bg-white p-6">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
              Best existing vendor match
            </p>
            <div className="mt-5 grid gap-4 text-sm leading-7 text-slate-700">
              <p>
                <span className="font-semibold text-ink">Vendor:</span> {result.bestMatch.vendorName}
              </p>
              <p>
                <span className="font-semibold text-ink">Description:</span>{" "}
                {result.bestMatch.vendorDescription ?? "No description available."}
              </p>
              <p>
                <span className="font-semibold text-ink">Requestor:</span>{" "}
                {result.bestMatch.requestorEmail ? (
                  <a
                    href={`mailto:${result.bestMatch.requestorEmail}`}
                    className="text-accent underline-offset-4 hover:underline"
                  >
                    {result.bestMatch.requestorName ?? result.bestMatch.requestorEmail}
                  </a>
                ) : (
                  result.bestMatch.requestorName ?? "No requestor recorded."
                )}
              </p>
              <p>
                <span className="font-semibold text-ink">Why this matches:</span>{" "}
                {result.bestMatch.whyItMatches}
              </p>
              <p>
                <span className="font-semibold text-ink">Confidence:</span>{" "}
                <span className="capitalize">{result.bestMatch.confidence}</span>
              </p>
            </div>
          </article>

          {result.lowConfidence && result.alternateMatches.length > 0 ? (
            <article className="rounded-3xl border border-dashed border-line bg-mist p-6">
              <h3 className="text-lg font-semibold text-ink">Alternate matches</h3>
              <ul className="mt-4 grid gap-3 text-sm text-slate-700">
                {result.alternateMatches.map((match) => (
                  <li key={`${match.vendorName}-${match.reason}`} className="rounded-2xl bg-white p-4">
                    <span className="font-semibold text-ink">{match.vendorName}</span>: {match.reason}
                  </li>
                ))}
              </ul>
            </article>
          ) : null}
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-line bg-white p-6 text-sm text-slate-700">
          No strong existing vendor match found in the current inventory.
        </div>
      )}
    </section>
  );
}
