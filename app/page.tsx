"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Crypto vs ETF Tracker</h1>

      <div className="mt-4"></div>
    </main>
  );
}
