import Link from "next/link";
import { redirect } from "next/navigation";
import { ResultsLoader } from "@/components/results-loader";

type ResultPageProps = {
  searchParams: Promise<{
    query?: string;
    userName?: string;
    userEmail?: string;
  }>;
};

export default async function ResultsPage({ searchParams }: ResultPageProps) {
  const params = await searchParams;

  if (!params.query) {
    redirect("/");
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Vendor Discovery Tool</h1>
          <p className="mt-2 text-sm text-slate-600">Search result for your procurement request.</p>
        </div>
        <Link
          href="/"
          className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-accent hover:text-accent"
        >
          New search
        </Link>
      </div>
      <ResultsLoader
        query={params.query}
        userName={params.userName}
        userEmail={params.userEmail}
      />
    </main>
  );
}
