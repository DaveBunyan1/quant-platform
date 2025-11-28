"use client";

import { useEffect, useState } from "react";
import PriceChart from "./components/PriceChart";
import constructDownloadUrl from "./utils/constructDownloadUrl";

const queryUrl = constructDownloadUrl(
  "BTC-USD",
  "2025-01-01",
  "2025-06-01",
  "daily"
);

const data = [
  { date: new Date("2025-01-01"), value: 10 },
  { date: new Date("2025-01-02"), value: 20 },
  { date: new Date("2025-01-03"), value: 15 },
  { date: new Date("2025-01-04"), value: 30 },
  { date: new Date("2025-01-05"), value: 25 },
];

export default function Home() {
  const [testData, setTestData] = useState<
    { date: Date; value: number }[] | null
  >(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Replace with your FastAPI endpoint
        const res = await fetch("http://127.0.0.1:8000/btc");
        const json = await res.json();

        const formatted = json.map(
          (d: { date: string; value: Record<string, number> }) => ({
            date: new Date(d.date),
            value: Object.values(d.value)[0], // get the number from { "BTC-USD": price }
          })
        );

        setTestData(formatted);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Crypto vs ETF Tracker</h1>

      {testData ? <PriceChart data={testData} /> : <p>Loading data...</p>}

      <div className="mt-4"></div>
    </main>
  );
}
