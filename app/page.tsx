import { SearchForm } from "@/components/search-form";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-12">
      <section className="relative overflow-hidden rounded-[32px] border border-line bg-panel/95 p-8 shadow-card sm:p-12">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(36,90,122,0.08),transparent_42%,rgba(16,36,56,0.03))]" />
        <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-accent/20 bg-accentSoft px-4 py-1 text-sm font-medium text-accent">
              Internal procurement lookup
            </div>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                Vendor Discovery Tool
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Check whether we already have an existing vendor before onboarding a new one.
              </p>
            </div>
            <ul className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
              <li className="rounded-2xl border border-line bg-white/70 p-4">
                Search by natural language
              </li>
              <li className="rounded-2xl border border-line bg-white/70 p-4">
                See the best vendor match and alternates
              </li>
              <li className="rounded-2xl border border-line bg-white/70 p-4">
                Contact the original requestor directly
              </li>
            </ul>
          </div>
          <SearchForm />
        </div>
      </section>
    </main>
  );
}
