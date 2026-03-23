"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function SearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    params.set("query", query);
    if (userName) params.set("userName", userName);
    if (userEmail) params.set("userEmail", userEmail);
    router.push(`/results?${params.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[28px] border border-line bg-white/90 p-6 shadow-card"
    >
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="query">
            What capability are you looking for?
          </label>
          <textarea
            id="query"
            required
            rows={7}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="I need a cloud monitoring platform with dashboards and alerting."
            className="w-full rounded-2xl border border-line bg-mist px-4 py-4 text-base text-ink outline-none transition placeholder:text-slate-400 focus:border-accent focus:bg-white"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="userName">
              Name
            </label>
            <input
              id="userName"
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              placeholder="Optional"
              className="w-full rounded-2xl border border-line bg-mist px-4 py-3 text-sm text-ink outline-none transition focus:border-accent focus:bg-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="userEmail">
              Email
            </label>
            <input
              id="userEmail"
              type="email"
              value={userEmail}
              onChange={(event) => setUserEmail(event.target.value)}
              placeholder="Optional"
              className="w-full rounded-2xl border border-line bg-mist px-4 py-3 text-sm text-ink outline-none transition focus:border-accent focus:bg-white"
            />
          </div>
        </div>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent"
        >
          Search existing vendors
        </button>
      </div>
    </form>
  );
}
