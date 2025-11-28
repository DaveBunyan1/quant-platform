"use client";

import PriceChart from "./components/PriceChart";

const data = [
  { date: new Date("2025-01-01"), value: 10 },
  { date: new Date("2025-01-02"), value: 20 },
  { date: new Date("2025-01-03"), value: 15 },
  { date: new Date("2025-01-04"), value: 30 },
  { date: new Date("2025-01-05"), value: 25 },
];

export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Crypto vs ETF Tracker</h1>
      <PriceChart data={data} />
      <div className="mt-4"></div>
    </main>
  );
}
